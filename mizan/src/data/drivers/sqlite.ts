/**
 * SQLite driver (iOS/Android) via expo-sqlite's synchronous API, so a write
 * is durable before the UI reports success.
 *
 * Layout: a generic `records` table (collection, id, JSON body) plus
 * `outbox`, `conflicts` and `meta`. Domain queries run in memory over the
 * loaded records; this keeps the local schema stable while the server schema
 * (supabase/migrations) stays normalized.
 */
import * as SQLite from 'expo-sqlite';

import type { CollectionName } from '../../domain/types';
import type { Conflict, LoadedState, OutboxItem, Row, StorageDriver } from '../store';

const SCHEMA_VERSION = 1;

export class SQLiteDriver implements StorageDriver {
  private db: SQLite.SQLiteDatabase | null = null;

  constructor(private name = 'mizan.db') {}

  private get conn(): SQLite.SQLiteDatabase {
    if (!this.db) throw new Error('SQLiteDriver not initialised');
    return this.db;
  }

  async init(): Promise<LoadedState> {
    this.db = SQLite.openDatabaseSync(this.name);
    this.conn.execSync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS records (
        collection TEXT NOT NULL, id TEXT NOT NULL, body TEXT NOT NULL, updated_at TEXT NOT NULL,
        PRIMARY KEY (collection, id));
      CREATE TABLE IF NOT EXISTS outbox (key TEXT PRIMARY KEY NOT NULL, body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS conflicts (key TEXT PRIMARY KEY NOT NULL, body TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
    `);
    this.conn.runSync('INSERT OR IGNORE INTO meta (key, value) VALUES (?, ?)', 'local_schema_version', String(SCHEMA_VERSION));

    const records = this.conn
      .getAllSync<{ collection: string; body: string }>('SELECT collection, body FROM records')
      .map((r) => ({ collection: r.collection as CollectionName, row: JSON.parse(r.body) as Row }));
    const outbox = this.conn.getAllSync<{ body: string }>('SELECT body FROM outbox').map((r) => JSON.parse(r.body) as OutboxItem);
    const conflicts = this.conn.getAllSync<{ body: string }>('SELECT body FROM conflicts').map((r) => JSON.parse(r.body) as Conflict);
    const meta = Object.fromEntries(
      this.conn.getAllSync<{ key: string; value: string }>('SELECT key, value FROM meta').map((r) => [r.key, r.value]),
    );
    return { records, outbox, conflicts, meta };
  }

  writeRecord(collection: CollectionName, row: Row) {
    this.conn.runSync(
      'INSERT OR REPLACE INTO records (collection, id, body, updated_at) VALUES (?, ?, ?, ?)',
      collection,
      row.id,
      JSON.stringify(row),
      row.updated_at,
    );
  }
  writeOutbox(item: OutboxItem) {
    this.conn.runSync('INSERT OR REPLACE INTO outbox (key, body) VALUES (?, ?)', item.key, JSON.stringify(item));
  }
  deleteOutbox(key: string) {
    this.conn.runSync('DELETE FROM outbox WHERE key = ?', key);
  }
  writeConflict(c: Conflict) {
    this.conn.runSync('INSERT OR REPLACE INTO conflicts (key, body) VALUES (?, ?)', c.key, JSON.stringify(c));
  }
  deleteConflict(key: string) {
    this.conn.runSync('DELETE FROM conflicts WHERE key = ?', key);
  }
  writeMeta(key: string, value: string | null) {
    if (value == null) this.conn.runSync('DELETE FROM meta WHERE key = ?', key);
    else this.conn.runSync('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)', key, value);
  }
  async clearAll() {
    this.conn.execSync('DELETE FROM records; DELETE FROM outbox; DELETE FROM conflicts; DELETE FROM meta;');
  }
}
