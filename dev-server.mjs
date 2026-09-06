#!/usr/bin/env node
// Local development server: serves dist/ and routes /api/* through the very
// same router the Netlify function uses.
//
//   npm run dev            -> build + serve on http://localhost:8899

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { router } from './api/router.js';

const PORT = Number(process.env.PORT || 8899);
const ROOT = 'dist';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

async function resolveFile(pathname) {
  const clean = decodeURIComponent(pathname).replace(/\.\./g, '');
  for (const candidate of [
    path.join(ROOT, clean),
    path.join(ROOT, clean, 'index.html'),
    path.join(ROOT, `${clean}.html`),
  ]) {
    if (existsSync(candidate) && (await stat(candidate)).isFile()) return candidate;
  }
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (url.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
      duplex: 'half',
    });
    const response = await router(request);
    const headers = {};
    response.headers.forEach((v, k) => { headers[k] = v; });
    // Secure cookies would be dropped over plain http locally.
    if (headers['set-cookie']) headers['set-cookie'] = headers['set-cookie'].replace('; Secure', '');
    res.writeHead(response.status, headers);
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }

  const file = await resolveFile(url.pathname);
  if (!file) {
    const locale = url.pathname.startsWith('/en') ? 'en' : 'ar';
    const fallback = path.join(ROOT, locale, '404', 'index.html');
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
    res.end(existsSync(fallback) ? await readFile(fallback) : 'Not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(PORT, () => console.log(`http://localhost:${PORT}`));
