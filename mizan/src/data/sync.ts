/**
 * Sync engine: pushes the durable outbox and pulls server changes.
 *
 * Policies (blueprint 03 §3–5):
 * - New records merge by client-generated UUID.
 * - If a record changed on the server since we last saw it AND we have a
 *   local pending edit, it becomes a Conflict for the user to resolve —
 *   never auto-merged (this covers financial and sensitive records).
 * - Deletes are tombstones pushed like any other update; RLS on the server
 *   is the authorisation check.
 * - Failures retry with exponential backoff + jitter, up to MAX_ATTEMPTS,
 *   after which the item is marked `failed` (kept, never discarded) and can
 *   be retried manually.
 * - The client never trusts its own user_id: it sends the session's user id
 *   and the database RLS policy rejects anything else.
 */
import { CollectionName, SYNCED_COLLECTIONS } from '../domain/types';
import type { OutboxItem, Row, Store } from './store';

export interface RemoteAdapter {
  /** Upsert a row; returns the server's stored row (with server updated_at). */
  upsert(collection: CollectionName, row: Record<string, unknown>): Promise<Row>;
  fetchById(collection: CollectionName, id: string): Promise<Row | null>;
  /** Rows with updated_at >= cursor, ascending, at most `limit`. */
  fetchChangedSince(collection: CollectionName, cursor: string | null, limit: number): Promise<Row[]>;
}

export const MAX_ATTEMPTS = 8;
const PAGE = 500;

export interface SyncResult {
  pushed: number;
  pulled: number;
  failed: number;
  conflicts: number;
  startedAt: string;
  finishedAt: string;
  errorCode?: string;
}

export function backoffMs(attempts: number, random: () => number = Math.random): number {
  const base = Math.min(30 * 60 * 1000, 2000 * 2 ** Math.max(0, attempts - 1));
  return Math.round(base / 2 + random() * (base / 2));
}

/** Strip local-only fields and attach the authenticated user id. */
export function toServerRow(row: Row, userId: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith('_')) continue;
    out[k] = v;
  }
  out.user_id = userId;
  return out;
}

function sameContent(a: Row, b: Row): boolean {
  const strip = (r: Row) => {
    const { updated_at, _server_updated_at, user_id, ...rest } = r as Record<string, unknown>;
    void updated_at;
    void _server_updated_at;
    void user_id;
    return JSON.stringify(Object.keys(rest).sort().map((k) => [k, rest[k] ?? null]));
  };
  return strip(a) === strip(b);
}

/** Sanitised error code — never includes record content or tokens. */
export function errorCode(e: unknown): string {
  if (e && typeof e === 'object') {
    const anyE = e as { code?: unknown; status?: unknown; name?: unknown };
    if (typeof anyE.code === 'string' && /^[A-Za-z0-9_.-]{1,40}$/.test(anyE.code)) return anyE.code;
    if (typeof anyE.status === 'number') return `http_${anyE.status}`;
    if (typeof anyE.name === 'string' && /^[A-Za-z]{1,40}$/.test(anyE.name)) return anyE.name;
  }
  return 'unknown_error';
}

export class SyncEngine {
  private running = false;

  constructor(
    private store: Store,
    private remote: RemoteAdapter,
    private userId: string,
    private now: () => Date = () => new Date(),
  ) {}

  get isRunning() {
    return this.running;
  }

  async syncNow(opts: { force?: boolean } = {}): Promise<SyncResult> {
    const startedAt = this.now().toISOString();
    if (this.running) return { pushed: 0, pulled: 0, failed: 0, conflicts: 0, startedAt, finishedAt: startedAt, errorCode: 'already_running' };
    this.running = true;
    const result: SyncResult = { pushed: 0, pulled: 0, failed: 0, conflicts: 0, startedAt, finishedAt: startedAt };
    try {
      await this.push(result, opts.force ?? false);
      await this.pull(result);
    } catch (e) {
      result.errorCode = errorCode(e);
    } finally {
      this.running = false;
      result.finishedAt = this.now().toISOString();
      this.store.setMetaJSON('sync:last_result', result);
    }
    return result;
  }

  private async push(result: SyncResult, force: boolean) {
    const nowIso = this.now().toISOString();
    const items = this.store
      .pendingOutbox()
      .filter((i) => i.status !== 'conflict' && (force || (i.status === 'pending' && i.next_attempt_at <= nowIso)))
      // audit logs last so the entities they reference exist first
      .sort((a, b) => (a.collection === 'audit_logs' ? 1 : 0) - (b.collection === 'audit_logs' ? 1 : 0) || a.created_at.localeCompare(b.created_at));

    for (const item of items) {
      const local = this.store.getRaw(item.collection, item.record_id);
      if (!local) {
        this.store.dropOutbox(item.key);
        continue;
      }
      try {
        const remote = await this.remote.fetchById(item.collection, item.record_id);
        if (remote && remote.updated_at !== local._server_updated_at && !sameContent(local, remote)) {
          this.store.addConflict({
            key: item.key,
            collection: item.collection,
            record_id: item.record_id,
            local,
            remote,
            detected_at: this.now().toISOString(),
          });
          result.conflicts++;
          continue;
        }
        const saved = await this.remote.upsert(item.collection, toServerRow(local, this.userId));
        this.store.markSynced(item.collection, item.record_id, saved.updated_at, local.updated_at);
        result.pushed++;
      } catch (e) {
        const attempts = item.attempts + 1;
        const failed = attempts >= MAX_ATTEMPTS;
        const next: OutboxItem = {
          ...item,
          attempts,
          status: failed ? 'failed' : 'pending',
          last_error: errorCode(e),
          next_attempt_at: new Date(this.now().getTime() + backoffMs(attempts)).toISOString(),
        };
        this.store.updateOutbox(next);
        result.failed++;
      }
    }
  }

  private async pull(result: SyncResult) {
    for (const collection of SYNCED_COLLECTIONS) {
      const cursorKey = `sync:cursor:${collection}`;
      let cursor = this.store.getMeta(cursorKey) ?? null;
      for (;;) {
        const rows = await this.remote.fetchChangedSince(collection, cursor, PAGE);
        let advanced = false;
        for (const remote of rows) {
          const local = this.store.getRaw(collection, remote.id);
          if (local && local._server_updated_at === remote.updated_at) {
            // already have this version
          } else if (local && this.store.hasPending(collection, remote.id)) {
            if (!sameContent(local, remote)) {
              this.store.addConflict({
                key: `${collection}:${remote.id}`,
                collection,
                record_id: remote.id,
                local,
                remote,
                detected_at: this.now().toISOString(),
              });
              result.conflicts++;
            }
          } else {
            this.store.applyRemote(collection, remote);
            result.pulled++;
          }
          if (!cursor || remote.updated_at > cursor) {
            cursor = remote.updated_at;
            advanced = true;
          }
        }
        if (cursor) this.store.setMeta(cursorKey, cursor);
        if (rows.length < PAGE || !advanced) break;
      }
    }
  }
}
