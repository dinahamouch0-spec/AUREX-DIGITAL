import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';

import { ValidationError } from '../src/domain/schema';
import type { CollectionName } from '../src/domain/types';
import { MemoryDriver } from '../src/data/drivers/memory';
import { Row, Store } from '../src/data/store';
import { MAX_ATTEMPTS, RemoteAdapter, SyncEngine, backoffMs, errorCode } from '../src/data/sync';

/** In-memory stand-in for the server, enforcing ownership like RLS. */
class FakeRemote implements RemoteAdapter {
  rows = new Map<string, Row & { user_id: string }>();
  clock = Date.parse('2026-11-16T10:00:00Z');
  failNext = 0;
  constructor(private owner: string) {}
  private tick() {
    this.clock += 1000;
    return new Date(this.clock).toISOString();
  }
  async upsert(collection: CollectionName, row: Record<string, unknown>) {
    if (this.failNext > 0) {
      this.failNext--;
      throw Object.assign(new Error('network'), { status: 503 });
    }
    if (row.user_id !== this.owner) throw Object.assign(new Error('rls'), { code: '42501' });
    const saved = { ...(row as Row & { user_id: string }), updated_at: this.tick() };
    this.rows.set(`${collection}:${row.id}`, saved);
    return { ...saved };
  }
  async fetchById(collection: CollectionName, id: string) {
    if (this.failNext > 0) {
      this.failNext--;
      throw Object.assign(new Error('network'), { status: 503 });
    }
    const r = this.rows.get(`${collection}:${id}`);
    return r ? { ...r } : null;
  }
  async fetchChangedSince(collection: CollectionName, cursor: string | null) {
    return [...this.rows.entries()]
      .filter(([k, r]) => k.startsWith(collection + ':') && (!cursor || r.updated_at >= cursor))
      .map(([, r]) => ({ ...r }))
      .sort((a, b) => a.updated_at.localeCompare(b.updated_at));
  }
  /** Simulate an edit made on another device. */
  serverEdit(collection: CollectionName, id: string, patch: Record<string, unknown>) {
    const k = `${collection}:${id}`;
    const r = this.rows.get(k)!;
    this.rows.set(k, { ...r, ...patch, updated_at: this.tick() });
  }
}

const mkStore = (driver = new MemoryDriver(), now = () => new Date('2026-11-16T09:00:00Z')) =>
  new Store(driver, { uuid: randomUUID, now });

describe('Store', () => {
  let driver: MemoryDriver;
  let store: Store;
  beforeEach(async () => {
    driver = new MemoryDriver();
    store = mkStore(driver);
    await store.load();
  });

  it('validates writes and preserves nothing invalid', () => {
    expect(() => store.insert('tasks', { title: '' })).toThrow(ValidationError);
    try {
      store.insert('grades', { title: 'Quiz', subject_id: 's', score: 5, max_score: 0, recorded_at: new Date().toISOString() });
    } catch (e) {
      expect((e as ValidationError).errors.max_score).toBe('too_small');
    }
    expect(store.list('tasks')).toHaveLength(0);
  });

  it('applies schema defaults and persists across restart', async () => {
    const t = store.insert('tasks', { title: 'Revise chemistry' });
    expect(t.status).toBe('not_started');
    expect(t.priority).toBe('medium');
    const reloaded = mkStore(driver);
    await reloaded.load();
    expect(reloaded.get('tasks', t.id)?.title).toBe('Revise chemistry');
    expect(reloaded.pendingOutbox()).toHaveLength(1);
  });

  it('tombstones deletes and supports undo', () => {
    const t = store.insert('tasks', { title: 'x' });
    const undo = store.remove('tasks', t.id);
    expect(store.list('tasks')).toHaveLength(0);
    expect(store.getRaw('tasks', t.id)?.deleted_at).toBeTruthy();
    undo();
    expect(store.list('tasks')).toHaveLength(1);
  });

  it('coalesces outbox entries per record', () => {
    const t = store.insert('tasks', { title: 'a' });
    store.update('tasks', t.id, { title: 'b' });
    store.update('tasks', t.id, { title: 'c' });
    expect(store.pendingOutbox().filter((o) => o.collection === 'tasks')).toHaveLength(1);
  });

  it('writes an audit entry (without values) for financial records', () => {
    store.insert('transactions', { direction: 'income', status: 'cleared', currency: 'USD', amount_minor: 1000, occurred_on: '2026-11-16' });
    const audit = store.list('audit_logs');
    expect(audit).toHaveLength(1);
    expect(audit[0]).toMatchObject({ action: 'create', entity_type: 'transactions', metadata: null });
    expect(JSON.stringify(audit[0])).not.toContain('1000');
  });

  it('wipes all local data', async () => {
    store.insert('tasks', { title: 'x' });
    await store.wipe();
    expect(store.list('tasks')).toHaveLength(0);
    expect(driver.records.size).toBe(0);
  });
});

describe('SyncEngine', () => {
  const USER = 'user-1';
  let store: Store;
  let remote: FakeRemote;
  let engine: SyncEngine;
  let clock: number;

  beforeEach(async () => {
    clock = Date.parse('2026-11-16T09:00:00Z');
    store = mkStore(new MemoryDriver(), () => new Date(clock));
    await store.load();
    remote = new FakeRemote(USER);
    engine = new SyncEngine(store, remote, USER, () => new Date(clock));
  });

  it('pushes offline-captured records with the authenticated user id, then clears the outbox', async () => {
    const t = store.insert('tasks', { title: 'offline task' });
    const r = await engine.syncNow();
    expect(r).toMatchObject({ pushed: 1, failed: 0, conflicts: 0 });
    expect(remote.rows.get(`tasks:${t.id}`)?.user_id).toBe(USER);
    expect(store.pendingOutbox()).toHaveLength(0);
    expect(remote.rows.get(`tasks:${t.id}`)).not.toHaveProperty('_server_updated_at');
  });

  it('retries with backoff and never discards failed items', async () => {
    store.insert('tasks', { title: 'x' });
    remote.failNext = 100;
    await engine.syncNow();
    let [item] = store.pendingOutbox();
    expect(item).toMatchObject({ attempts: 1, status: 'pending', last_error: 'http_503' });
    expect(item.next_attempt_at > new Date(clock).toISOString()).toBe(true);
    for (let i = 0; i < MAX_ATTEMPTS + 2; i++) {
      clock += 60 * 60 * 1000;
      await engine.syncNow();
    }
    [item] = store.pendingOutbox();
    expect(item.status).toBe('failed');
    remote.failNext = 0;
    await engine.syncNow({ force: true });
    expect(store.pendingOutbox()).toHaveLength(0);
  });

  it('pulls records created on another device', async () => {
    await remote.upsert('habits', { id: 'h1', user_id: USER, name: 'Walk', schedule_type: 'daily', status: 'active', sort_order: 0, created_at: 'x', updated_at: 'x' });
    const r = await engine.syncNow();
    expect(r.pulled).toBe(1);
    expect(store.get('habits', 'h1')?.name).toBe('Walk');
    expect(store.pendingOutbox()).toHaveLength(0);
  });

  it('detects a same-record conflict and lets the user keep either version', async () => {
    const tx = store.insert('transactions', { direction: 'income', status: 'cleared', currency: 'USD', amount_minor: 1000, occurred_on: '2026-11-16' });
    await engine.syncNow();
    remote.serverEdit('transactions', tx.id, { amount_minor: 2000 });
    clock += 1000;
    store.update('transactions', tx.id, { amount_minor: 1500 });
    const r = await engine.syncNow();
    expect(r.conflicts).toBeGreaterThanOrEqual(1);
    expect(store.listConflicts()).toHaveLength(1);
    // financial amounts are not auto-merged: server still has the other device's value
    expect(remote.rows.get(`transactions:${tx.id}`)?.amount_minor).toBe(2000);

    store.resolveConflict(`transactions:${tx.id}`, 'local');
    await engine.syncNow();
    expect(remote.rows.get(`transactions:${tx.id}`)?.amount_minor).toBe(1500);
    expect(store.listConflicts()).toHaveLength(0);
  });

  it('keep-server resolution discards the local edit', async () => {
    const t = store.insert('tasks', { title: 'v1' });
    await engine.syncNow();
    remote.serverEdit('tasks', t.id, { title: 'server' });
    store.update('tasks', t.id, { title: 'local' });
    await engine.syncNow();
    store.resolveConflict(`tasks:${t.id}`, 'remote');
    expect(store.get('tasks', t.id)?.title).toBe('server');
    expect(store.pendingOutbox().filter((o) => o.collection === 'tasks')).toHaveLength(0);
  });

  it('propagates tombstone deletes', async () => {
    const t = store.insert('tasks', { title: 'x' });
    await engine.syncNow();
    store.remove('tasks', t.id);
    await engine.syncNow();
    expect(remote.rows.get(`tasks:${t.id}`)?.deleted_at).toBeTruthy();
  });

  it('rejects writes for another user (server-side ownership)', async () => {
    const other = new SyncEngine(store, remote, 'intruder', () => new Date(clock));
    store.insert('tasks', { title: 'x' });
    const r = await other.syncNow();
    expect(r.failed).toBe(1);
    expect(store.pendingOutbox()[0].last_error).toBe('42501');
  });

  it('has bounded jittered backoff and sanitised error codes', () => {
    expect(backoffMs(1, () => 0)).toBe(1000);
    expect(backoffMs(50, () => 1)).toBe(30 * 60 * 1000);
    expect(errorCode(new Error('secret token abc'))).toBe('Error');
    expect(errorCode({ code: 'has spaces and secrets' })).toBe('unknown_error');
  });
});
