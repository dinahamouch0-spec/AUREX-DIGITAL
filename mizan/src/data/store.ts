/**
 * Local-first record store.
 *
 * - Every write is persisted synchronously through the storage driver
 *   (SQLite on device, localStorage on web, memory in tests) before
 *   listeners are notified, so data survives an app restart.
 * - Every write enqueues an outbox item for later sync. Items are
 *   coalesced per record (the latest local state is what gets pushed).
 * - Deletes are tombstones (`deleted_at`) so they can sync and be undone.
 * - The UI never touches the driver directly — only this store / use cases.
 */
import { APPEND_ONLY_COLLECTIONS, AUDITED_COLLECTIONS, BaseRecord, CollectionMap, CollectionName, COLLECTIONS, LOCAL_ONLY_COLLECTIONS, MAX_VERSIONS, VERSIONED_COLLECTIONS } from '../domain/types';
import { ValidationError, defaultsFor, validateRecord } from '../domain/schema';

export type Row = BaseRecord & Record<string, unknown> & { _server_updated_at?: string | null; _history?: Row[] };

/** Previous versions are kept (newest first) for as-of evaluation; local only. */
export function withPreviousVersion(collection: CollectionName, existing: Row, next: Row): Row {
  if (!VERSIONED_COLLECTIONS.includes(collection)) return next;
  const { _history, ...snapshot } = existing;
  const strip = (r: Row) => {
    const { _history: _h, _server_updated_at: _s, ...rest } = r;
    void _h;
    void _s;
    return JSON.stringify(rest);
  };
  if (strip(existing) === strip(next)) return next;
  return { ...next, _history: [snapshot as Row, ...(_history ?? [])].slice(0, MAX_VERSIONS) };
}

export type OutboxStatus = 'pending' | 'failed' | 'conflict';
export interface OutboxItem {
  key: string; // `${collection}:${record_id}`
  collection: CollectionName;
  record_id: string;
  created_at: string;
  attempts: number;
  next_attempt_at: string;
  status: OutboxStatus;
  last_error?: string | null;
}

export interface Conflict {
  key: string;
  collection: CollectionName;
  record_id: string;
  local: Row;
  remote: Row;
  detected_at: string;
}

export interface LoadedState {
  records: { collection: CollectionName; row: Row }[];
  outbox: OutboxItem[];
  conflicts: Conflict[];
  meta: Record<string, string>;
}

/** Synchronous after `init()`; async only for startup and wipe. */
export interface StorageDriver {
  init(): Promise<LoadedState>;
  writeRecord(collection: CollectionName, row: Row): void;
  writeOutbox(item: OutboxItem): void;
  deleteOutbox(key: string): void;
  writeConflict(c: Conflict): void;
  deleteConflict(key: string): void;
  writeMeta(key: string, value: string | null): void;
  clearAll(): Promise<void>;
}

export interface StoreOptions {
  uuid: () => string;
  now?: () => Date;
}

type Listener = () => void;

export class Store {
  private data = new Map<CollectionName, Map<string, Row>>();
  private listCache = new Map<CollectionName, Row[]>();
  private outbox = new Map<string, OutboxItem>();
  private conflicts = new Map<string, Conflict>();
  private meta = new Map<string, string>();
  private listeners = new Set<Listener>();
  private _version = 0;
  private loaded = false;

  constructor(
    private driver: StorageDriver,
    private opts: StoreOptions,
  ) {
    for (const c of COLLECTIONS) this.data.set(c, new Map());
  }

  get version() {
    return this._version;
  }
  get isLoaded() {
    return this.loaded;
  }

  private now() {
    return (this.opts.now ?? (() => new Date()))();
  }

  async load(): Promise<void> {
    const state = await this.driver.init();
    for (const { collection, row } of state.records) {
      this.data.get(collection)?.set(row.id, row);
    }
    for (const o of state.outbox) this.outbox.set(o.key, o);
    for (const c of state.conflicts) this.conflicts.set(c.key, c);
    for (const [k, v] of Object.entries(state.meta)) this.meta.set(k, v);
    this.loaded = true;
    this.emit();
  }

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getVersion = () => this._version;

  private emit(changed?: CollectionName) {
    if (changed) this.listCache.delete(changed);
    else this.listCache.clear();
    this._version++;
    for (const l of this.listeners) l();
  }

  // ---------- reads ----------

  /** Non-deleted records. The returned array is cached until the collection changes. */
  list<C extends CollectionName>(collection: C): CollectionMap[C][] {
    let cached = this.listCache.get(collection);
    if (!cached) {
      cached = [...(this.data.get(collection)?.values() ?? [])].filter((r) => !r.deleted_at);
      this.listCache.set(collection, cached);
    }
    return cached as unknown as CollectionMap[C][];
  }

  get<C extends CollectionName>(collection: C, id: string | null | undefined): CollectionMap[C] | undefined {
    if (!id) return undefined;
    const r = this.data.get(collection)?.get(id);
    return r && !r.deleted_at ? (r as unknown as CollectionMap[C]) : undefined;
  }

  /** Including tombstones (for sync and undo). */
  getRaw(collection: CollectionName, id: string): Row | undefined {
    return this.data.get(collection)?.get(id);
  }

  allRaw(collection: CollectionName): Row[] {
    return [...(this.data.get(collection)?.values() ?? [])];
  }

  // ---------- writes ----------

  insert<C extends CollectionName>(
    collection: C,
    values: Partial<CollectionMap[C]> & Record<string, unknown>,
    opts: { skipValidation?: boolean } = {},
  ): CollectionMap[C] {
    const ts = this.now().toISOString();
    const row: Row = {
      ...defaultsFor(collection),
      ...values,
      id: (values.id as string) ?? this.opts.uuid(),
      created_at: ts,
      updated_at: ts,
      deleted_at: null,
    } as Row;
    if (!opts.skipValidation) this.validate(collection, row);
    if (this.data.get(collection)?.has(row.id)) throw new Error('duplicate_id');
    this.persist(collection, row);
    this.audit(collection, 'create', row.id);
    this.emit(collection);
    return row as unknown as CollectionMap[C];
  }

  update<C extends CollectionName>(
    collection: C,
    id: string,
    patch: Partial<CollectionMap[C]> & Record<string, unknown>,
  ): CollectionMap[C] {
    if (APPEND_ONLY_COLLECTIONS.includes(collection)) throw new Error('append_only');
    const existing = this.data.get(collection)?.get(id);
    if (!existing) throw new Error('not_found');
    const next: Row = {
      ...existing,
      ...patch,
      id: existing.id,
      created_at: existing.created_at,
      updated_at: this.now().toISOString(),
    } as Row;
    if (!next.deleted_at) this.validate(collection, next);
    this.persist(collection, withPreviousVersion(collection, existing, next));
    this.audit(collection, 'update', id);
    this.emit(collection);
    return next as unknown as CollectionMap[C];
  }

  /** Tombstone delete. Returns a function that undoes it. */
  remove(collection: CollectionName, id: string): () => void {
    if (APPEND_ONLY_COLLECTIONS.includes(collection)) throw new Error('append_only');
    const existing = this.data.get(collection)?.get(id);
    if (!existing || existing.deleted_at) return () => undefined;
    const ts = this.now().toISOString();
    this.persist(collection, withPreviousVersion(collection, existing, { ...existing, deleted_at: ts, updated_at: ts }));
    this.audit(collection, 'delete', id);
    this.emit(collection);
    return () => this.restore(collection, id);
  }

  restore(collection: CollectionName, id: string) {
    const existing = this.data.get(collection)?.get(id);
    if (!existing || !existing.deleted_at) return;
    this.persist(collection, withPreviousVersion(collection, existing, { ...existing, deleted_at: null, updated_at: this.now().toISOString() }));
    this.audit(collection, 'restore', id);
    this.emit(collection);
  }

  private validate(collection: CollectionName, row: Row) {
    const errors = validateRecord(collection, row);
    if (Object.keys(errors).length > 0) throw new ValidationError(errors);
  }

  private persist(collection: CollectionName, row: Row) {
    this.driver.writeRecord(collection, row);
    this.data.get(collection)?.set(row.id, row);
    if (LOCAL_ONLY_COLLECTIONS.includes(collection)) return;
    const key = `${collection}:${row.id}`;
    const existing = this.outbox.get(key);
    const item: OutboxItem = {
      key,
      collection,
      record_id: row.id,
      created_at: existing?.created_at ?? this.now().toISOString(),
      attempts: 0,
      next_attempt_at: this.now().toISOString(),
      status: existing?.status === 'conflict' ? 'conflict' : 'pending',
      last_error: null,
    };
    this.driver.writeOutbox(item);
    this.outbox.set(key, item);
  }

  /** Minimal audit trail for sensitive records: no field values, only the action. */
  private audit(collection: CollectionName, action: string, id: string) {
    if (!AUDITED_COLLECTIONS.includes(collection)) return;
    const ts = this.now().toISOString();
    const row: Row = {
      id: this.opts.uuid(),
      created_at: ts,
      updated_at: ts,
      deleted_at: null,
      action,
      entity_type: collection,
      entity_id: id,
      occurred_at: ts,
      metadata: null,
    };
    this.persist('audit_logs', row);
    this.listCache.delete('audit_logs');
  }

  // ---------- sync support (used by SyncEngine only) ----------

  /** Apply a server row without creating an outbox entry. */
  applyRemote(collection: CollectionName, remote: Row) {
    const existing = this.data.get(collection)?.get(remote.id);
    let row: Row = { ...remote, _server_updated_at: remote.updated_at };
    delete (row as Record<string, unknown>).user_id;
    delete (row as Record<string, unknown>)._history; // never trust history from elsewhere
    if (existing) row = withPreviousVersion(collection, existing, row);
    this.driver.writeRecord(collection, row);
    this.data.get(collection)?.set(row.id, row);
    this.emit(collection);
  }

  /** Mark a pushed record as in sync with the server version. */
  markSynced(collection: CollectionName, id: string, serverUpdatedAt: string, pushedLocalUpdatedAt: string) {
    const key = `${collection}:${id}`;
    const row = this.data.get(collection)?.get(id);
    if (row) {
      const next = { ...row, _server_updated_at: serverUpdatedAt };
      this.driver.writeRecord(collection, next);
      this.data.get(collection)?.set(id, next);
    }
    // Only clear the outbox if no newer local edit happened during the push.
    if (row && row.updated_at === pushedLocalUpdatedAt) {
      this.driver.deleteOutbox(key);
      this.outbox.delete(key);
    }
    this.emit(collection);
  }

  pendingOutbox(): OutboxItem[] {
    return [...this.outbox.values()];
  }

  hasPending(collection: CollectionName, id: string) {
    return this.outbox.has(`${collection}:${id}`);
  }

  updateOutbox(item: OutboxItem) {
    this.driver.writeOutbox(item);
    this.outbox.set(item.key, item);
    this.emit();
  }

  dropOutbox(key: string) {
    this.driver.deleteOutbox(key);
    this.outbox.delete(key);
    this.emit();
  }

  listConflicts(): Conflict[] {
    return [...this.conflicts.values()];
  }

  addConflict(c: Conflict) {
    this.driver.writeConflict(c);
    this.conflicts.set(c.key, c);
    const item = this.outbox.get(c.key);
    if (item) this.updateOutbox({ ...item, status: 'conflict' });
    this.emit();
  }

  /** Resolve a conflict by keeping the local or the server version. */
  resolveConflict(key: string, keep: 'local' | 'remote') {
    const c = this.conflicts.get(key);
    if (!c) return;
    this.driver.deleteConflict(key);
    this.conflicts.delete(key);
    if (keep === 'remote') {
      this.dropOutbox(key);
      this.applyRemote(c.collection, c.remote);
    } else {
      const row = this.data.get(c.collection)?.get(c.record_id);
      if (row) {
        const next = { ...row, _server_updated_at: c.remote.updated_at };
        this.driver.writeRecord(c.collection, next);
        this.data.get(c.collection)?.set(row.id, next);
      }
      const item = this.outbox.get(key);
      if (item) this.updateOutbox({ ...item, status: 'pending', attempts: 0, next_attempt_at: this.now().toISOString() });
    }
    this.emit(c.collection);
  }

  // ---------- meta ----------

  getMeta(key: string): string | undefined {
    return this.meta.get(key);
  }

  setMeta(key: string, value: string | null) {
    this.driver.writeMeta(key, value);
    if (value == null) this.meta.delete(key);
    else this.meta.set(key, value);
    this.emit();
  }

  getMetaJSON<T>(key: string, fallback: T): T {
    const raw = this.meta.get(key);
    if (!raw) return fallback;
    try {
      return { ...fallback, ...JSON.parse(raw) } as T;
    } catch {
      return fallback;
    }
  }

  setMetaJSON(key: string, value: unknown) {
    this.setMeta(key, JSON.stringify(value));
  }

  /** Permanently erase all local data (account deletion / sign-out wipe). */
  async wipe() {
    await this.driver.clearAll();
    for (const c of COLLECTIONS) this.data.set(c, new Map());
    this.outbox.clear();
    this.conflicts.clear();
    this.meta.clear();
    this.emit();
  }
}
