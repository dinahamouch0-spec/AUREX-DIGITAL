/* Persistence. Netlify Blobs when deployed, a JSON file on disk in dev, so
   `npm run dev` needs no cloud account and the two behave identically.

   The file fallback is for development only. A function's filesystem does not
   survive the invocation, so falling back to it in production would accept
   orders and then lose them — silently, which is the worst way to lose an
   order. On Netlify, a failure to reach Blobs throws instead. */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEV_DIR = process.env.AUREX_DATA_DIR || '.data';
const ON_NETLIFY = Boolean(process.env.NETLIFY || process.env.NETLIFY_DEV);
let blobs = null;

async function store() {
  if (blobs !== null) return blobs;
  try {
    const { getStore } = await import('@netlify/blobs');
    blobs = getStore({ name: 'aurex', consistency: 'strong' });
  } catch (err) {
    if (ON_NETLIFY) {
      throw new Error('Netlify Blobs is unavailable, and a function cannot ' +
        'keep data on disk. Refusing to write where it would be lost: ' + err.message);
    }
    blobs = false;                       // dev: fall through to the file store
  }
  return blobs;
}

const devFile = (key) => path.join(DEV_DIR, key.replace(/[^\w.-]/g, '_') + '.json');

export async function get(key) {
  const s = await store();
  if (s) return (await s.get(key, { type: 'json' })) ?? null;
  try { return JSON.parse(await readFile(devFile(key), 'utf8')); }
  catch { return null; }
}

export async function set(key, value) {
  const s = await store();
  if (s) return s.setJSON(key, value);
  await mkdir(DEV_DIR, { recursive: true });
  await writeFile(devFile(key), JSON.stringify(value, null, 2));
}

export async function del(key) {
  const s = await store();
  if (s) return s.delete(key);
  await writeFile(devFile(key), 'null').catch(() => {});
}

/* A collection is a single document holding a list. The volumes here are
   hundreds, not millions, so one read beats an index to maintain. */
export const collection = (name) => ({
  async all() { return (await get(name)) || []; },
  async save(rows) { return set(name, rows); },
  async add(row) {
    const rows = (await get(name)) || [];
    rows.unshift(row);
    await set(name, rows.slice(0, 5000));
    return row;
  },
  async find(fn) { return ((await get(name)) || []).find(fn) || null; },
  async update(fn, patch) {
    const rows = (await get(name)) || [];
    const i = rows.findIndex(fn);
    if (i < 0) return null;
    rows[i] = { ...rows[i], ...patch };
    await set(name, rows);
    return rows[i];
  },
});
