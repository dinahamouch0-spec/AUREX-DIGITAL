import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { SCHEMAS } from '../src/domain/schema';
import { SYNCED_COLLECTIONS } from '../src/domain/types';

/** Every field the app writes must exist as a column, or sync would fail at runtime. */
describe('local schema ⇄ Postgres migration', () => {
  const sql = readFileSync(join(__dirname, '../supabase/migrations/20261116000000_init.sql'), 'utf8');
  const tables = new Map<string, Set<string>>();
  for (const m of sql.matchAll(/create table public\.(\w+) \(([\s\S]*?)\n\);/g)) {
    const cols = new Set<string>();
    for (const line of m[2].split('\n')) {
      const c = line.trim().match(/^([a-z_][a-z0-9_]*)\s+(uuid|text|date|timestamptz|numeric|integer|smallint|bigint|boolean|jsonb)/);
      if (c) cols.add(c[1]);
    }
    tables.set(m[1], cols);
  }
  it.each(SYNCED_COLLECTIONS)('%s has a table with every app field', (c) => {
    const cols = tables.get(c);
    expect(cols, `table ${c}`).toBeDefined();
    const missing = [...SCHEMAS[c].fields.map((f) => f.name), 'id', 'user_id', 'created_at', 'updated_at', 'deleted_at'].filter((f) => !cols!.has(f));
    expect(missing).toEqual([]);
  });
});
