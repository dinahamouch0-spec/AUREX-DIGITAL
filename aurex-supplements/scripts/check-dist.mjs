#!/usr/bin/env node
/* Walks the built site and fails on a reference that resolves to nothing:
   a missing image or a dead internal link. Cheap insurance against a rename
   that silently empties a page. */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST = 'dist';
const pages = [];
async function walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) await walk(f);
    else if (e.name.endsWith('.html')) pages.push(f);
  }
}
await walk(DIST);

const resolves = (u) => {
  const p = path.join(DIST, u.split('?')[0].split('#')[0]);
  return existsSync(p) || existsSync(path.join(p, 'index.html')) || existsSync(p + '.html');
};

const badAssets = new Map();
const badLinks = new Map();
let assets = 0, links = 0;

for (const f of pages) {
  const html = await readFile(f, 'utf8');
  const page = '/' + path.relative(DIST, f).replace(/index\.html$/, '');

  for (const m of html.matchAll(/(?:src|href)="(\/[^"]*\.(?:webp|png|jpg|svg|css|js|json))"/g)) {
    assets++;
    if (!resolves(m[1])) badAssets.set(m[1], (badAssets.get(m[1]) || 0) + 1);
  }
  for (const m of html.matchAll(/url\('(\/[^']+)'\)/g)) {
    assets++;
    if (!resolves(m[1])) badAssets.set(m[1], (badAssets.get(m[1]) || 0) + 1);
  }
  for (const m of html.matchAll(/href="(\/[^"#?]*\/)"/g)) {
    links++;
    if (!resolves(m[1])) badLinks.set(m[1] + '  (on ' + page + ')', 1);
  }
}

console.log(`pages ${pages.length} · asset refs ${assets} · internal links ${links}`);
const problems = [...badAssets.keys()].map((k) => 'asset  ' + k)
  .concat([...badLinks.keys()].map((k) => 'link   ' + k));
if (problems.length) {
  console.error('\nBROKEN:\n  ' + problems.slice(0, 25).join('\n  '));
  console.error(`\n${problems.length} broken reference${problems.length === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('nothing broken');
