#!/usr/bin/env node
/* Pulls every supplier product image into the repository.

   The catalogue ships with images pointing at the previous store's Shopify
   CDN. Serving a shop from someone else's CDN means a deleted file becomes a
   hole on our shelf, so the images are fetched once and served from here.
   Cached on disk: re-running only fetches what is missing. */
import { mkdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import catalog from '../src/data/catalog.json' with { type: 'json' };

const OUT = 'src/assets/img/supplier';
const CONCURRENCY = 6;

const exists = (f) => access(f).then(() => true, () => false);

async function grab(p) {
  if (!p.image) return 'none';
  const ext = (p.image.split('?')[0].match(/\.(jpe?g|png|webp|avif)$/i)?.[1] || 'jpg').toLowerCase();
  const name = `${createHash('sha1').update(p.image).digest('hex').slice(0, 12)}.${ext}`;
  const file = path.join(OUT, name);
  p.local = `/assets/img/supplier/${name}`;
  if (await exists(file)) return 'cached';
  const r = await fetch(p.image, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`${r.status} ${p.image}`);
  await writeFile(file, Buffer.from(await r.arrayBuffer()));
  return 'fetched';
}

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const list = catalog.products.filter((p) => p.image);
  const tally = { fetched: 0, cached: 0, failed: 0 };
  const queue = [...list];

  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const p = queue.pop();
      try { tally[await grab(p)]++; }
      catch { tally.failed++; }
      const done = tally.fetched + tally.cached + tally.failed;
      if (done % 50 === 0) console.log(`  ${done}/${list.length}`);
    }
  }));

  await writeFile('src/data/supplier-map.json',
    JSON.stringify(Object.fromEntries(list.filter((p) => p.local).map((p) => [p.id, p.local]))));
  console.log(`\nfetched ${tally.fetched} · cached ${tally.cached} · failed ${tally.failed}`);
};
main().catch((e) => { console.error(e); process.exit(1); });
