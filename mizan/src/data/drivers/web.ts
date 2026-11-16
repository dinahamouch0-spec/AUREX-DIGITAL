/**
 * localStorage driver for the web build. Synchronous, so writes are durable
 * before the UI reports success. One key per collection.
 * Limitation: browsers cap localStorage at ~5 MB per origin.
 */
import { COLLECTIONS, CollectionName } from '../../domain/types';
import type { Conflict, LoadedState, OutboxItem, Row, StorageDriver } from '../store';

const P = 'mizan:v1:';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(P + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export class WebStorageDriver implements StorageDriver {
  private cols = new Map<CollectionName, Record<string, Row>>();
  private outbox: Record<string, OutboxItem> = {};
  private conflicts: Record<string, Conflict> = {};
  private meta: Record<string, string> = {};

  private write(key: string, value: unknown) {
    globalThis.localStorage.setItem(P + key, JSON.stringify(value));
  }

  async init(): Promise<LoadedState> {
    if (!globalThis.localStorage) throw new Error('localStorage unavailable');
    const records: LoadedState['records'] = [];
    for (const c of COLLECTIONS) {
      const map = read<Record<string, Row>>(`c:${c}`, {});
      this.cols.set(c, map);
      for (const row of Object.values(map)) records.push({ collection: c, row });
    }
    this.outbox = read('outbox', {});
    this.conflicts = read('conflicts', {});
    this.meta = read('meta', {});
    return { records, outbox: Object.values(this.outbox), conflicts: Object.values(this.conflicts), meta: { ...this.meta } };
  }
  writeRecord(collection: CollectionName, row: Row) {
    const map = this.cols.get(collection) ?? {};
    map[row.id] = row;
    this.cols.set(collection, map);
    this.write(`c:${collection}`, map);
  }
  writeOutbox(item: OutboxItem) {
    this.outbox[item.key] = item;
    this.write('outbox', this.outbox);
  }
  deleteOutbox(key: string) {
    delete this.outbox[key];
    this.write('outbox', this.outbox);
  }
  writeConflict(c: Conflict) {
    this.conflicts[c.key] = c;
    this.write('conflicts', this.conflicts);
  }
  deleteConflict(key: string) {
    delete this.conflicts[key];
    this.write('conflicts', this.conflicts);
  }
  writeMeta(key: string, value: string | null) {
    if (value == null) delete this.meta[key];
    else this.meta[key] = value;
    this.write('meta', this.meta);
  }
  async clearAll() {
    for (const k of Object.keys(globalThis.localStorage)) if (k.startsWith(P)) globalThis.localStorage.removeItem(k);
    this.cols.clear();
    this.outbox = {};
    this.conflicts = {};
    this.meta = {};
  }
}
