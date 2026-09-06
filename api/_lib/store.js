// Storage abstraction.
//
// Production: Netlify Blobs — private by default, no public URL is ever minted
// for an object, which is what Part 3 §30 requires for child photos.
// Development: a filesystem mirror with identical semantics so the same code
// paths are exercised locally.
//
// Everything above this layer speaks collections of JSON documents plus a
// separate binary store, so swapping in Postgres + S3 later is contained here.

import { mkdir, readFile, writeFile, unlink, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DEV_ROOT = process.env.YK_DATA_DIR || '.data';
const isNetlify = () => Boolean(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);

let blobsModule = null;
async function netlifyStore(name) {
  if (!blobsModule) blobsModule = await import('@netlify/blobs');
  return blobsModule.getStore({ name, consistency: 'strong' });
}

const safeKey = (k) => String(k).replace(/[^A-Za-z0-9._:-]/g, '_');

/* ------------------------------------------------------------ JSON docs -- */
export function collection(name) {
  return {
    async get(key) {
      const k = safeKey(key);
      if (isNetlify()) {
        const s = await netlifyStore(name);
        return (await s.get(k, { type: 'json' })) ?? null;
      }
      const f = path.join(DEV_ROOT, name, `${k}.json`);
      if (!existsSync(f)) return null;
      return JSON.parse(await readFile(f, 'utf8'));
    },

    async set(key, value) {
      const k = safeKey(key);
      if (isNetlify()) {
        const s = await netlifyStore(name);
        await s.setJSON(k, value);
        return value;
      }
      const dir = path.join(DEV_ROOT, name);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, `${k}.json`), JSON.stringify(value, null, 2));
      return value;
    },

    async del(key) {
      const k = safeKey(key);
      if (isNetlify()) {
        const s = await netlifyStore(name);
        await s.delete(k);
        return;
      }
      const f = path.join(DEV_ROOT, name, `${k}.json`);
      if (existsSync(f)) await unlink(f);
    },

    async keys(prefix = '') {
      if (isNetlify()) {
        const s = await netlifyStore(name);
        const { blobs } = await s.list({ prefix: prefix ? safeKey(prefix) : undefined });
        return blobs.map((b) => b.key);
      }
      const dir = path.join(DEV_ROOT, name);
      if (!existsSync(dir)) return [];
      return (await readdir(dir))
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.slice(0, -5))
        .filter((k) => k.startsWith(safeKey(prefix) === '' ? '' : safeKey(prefix)));
    },

    async all(prefix = '') {
      const ks = await this.keys(prefix);
      const out = [];
      for (const k of ks) {
        const v = await this.get(k);
        if (v) out.push(v);
      }
      return out;
    },
  };
}

/* --------------------------------------------------------- binary blobs -- */
/** Private object store for child photos. No public URL is ever produced. */
export const files = {
  async put(key, bytes, meta = {}) {
    const k = safeKey(key);
    if (isNetlify()) {
      const s = await netlifyStore('uploads');
      await s.set(k, bytes, { metadata: meta });
      return k;
    }
    const dir = path.join(DEV_ROOT, 'uploads');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, k), Buffer.from(bytes));
    await writeFile(path.join(dir, `${k}.meta.json`), JSON.stringify(meta));
    return k;
  },

  async get(key) {
    const k = safeKey(key);
    if (isNetlify()) {
      const s = await netlifyStore('uploads');
      const buf = await s.get(k, { type: 'arrayBuffer' });
      return buf ? Buffer.from(buf) : null;
    }
    const f = path.join(DEV_ROOT, 'uploads', k);
    if (!existsSync(f)) return null;
    return readFile(f);
  },

  async del(key) {
    const k = safeKey(key);
    if (isNetlify()) {
      const s = await netlifyStore('uploads');
      await s.delete(k);
      return;
    }
    for (const f of [path.join(DEV_ROOT, 'uploads', k), path.join(DEV_ROOT, 'uploads', `${k}.meta.json`)]) {
      if (existsSync(f)) await unlink(f);
    }
  },

  async exists(key) {
    return (await this.get(key)) !== null;
  },
};

/** Monotonic counter used for customer-facing order numbers. */
export async function nextSequence(name, start = 1000) {
  const c = collection('_seq');
  const cur = (await c.get(name))?.value ?? start;
  const next = cur + 1;
  await c.set(name, { value: next });
  return next;
}
