import type { CollectionName } from '../../domain/types';
import type { Conflict, LoadedState, OutboxItem, Row, StorageDriver } from '../store';

/** In-memory driver for tests. `snapshot()` simulates a restart. */
export class MemoryDriver implements StorageDriver {
  records = new Map<string, { collection: CollectionName; row: Row }>();
  outbox = new Map<string, OutboxItem>();
  conflicts = new Map<string, Conflict>();
  meta = new Map<string, string>();

  async init(): Promise<LoadedState> {
    return {
      records: [...this.records.values()].map((r) => structuredClone(r)),
      outbox: [...this.outbox.values()].map((o) => ({ ...o })),
      conflicts: [...this.conflicts.values()].map((c) => structuredClone(c)),
      meta: Object.fromEntries(this.meta),
    };
  }
  writeRecord(collection: CollectionName, row: Row) {
    this.records.set(`${collection}:${row.id}`, { collection, row: structuredClone(row) });
  }
  writeOutbox(item: OutboxItem) {
    this.outbox.set(item.key, { ...item });
  }
  deleteOutbox(key: string) {
    this.outbox.delete(key);
  }
  writeConflict(c: Conflict) {
    this.conflicts.set(c.key, structuredClone(c));
  }
  deleteConflict(key: string) {
    this.conflicts.delete(key);
  }
  writeMeta(key: string, value: string | null) {
    if (value == null) this.meta.delete(key);
    else this.meta.set(key, value);
  }
  async clearAll() {
    this.records.clear();
    this.outbox.clear();
    this.conflicts.clear();
    this.meta.clear();
  }
}
