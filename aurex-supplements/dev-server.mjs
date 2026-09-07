#!/usr/bin/env node
/* Static server for dist/, with the same clean-URL behaviour Netlify gives. */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = 'dist';
const PORT = Number(process.env.PORT || 4321);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain' };

const tryFiles = async (p) => {
  for (const f of [p, path.join(p, 'index.html'), p + '.html']) {
    try { if ((await stat(f)).isFile()) return f; } catch { /* next */ }
  }
  return null;
};

createServer(async (req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = await tryFiles(path.join(DIST, url));
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    return res.end(await readFile(path.join(DIST, '404.html')).catch(() => 'Not found'));
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
