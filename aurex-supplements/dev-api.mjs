#!/usr/bin/env node
/* Runs the API next to the static server in development, so the whole
   commerce flow can be exercised without deploying. */
import { createServer } from 'node:http';
import { route } from './api/router.js';

const PORT = Number(process.env.API_PORT || 4322);
createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const url = `http://localhost:${PORT}${req.url}`;
  const request = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: chunks.length ? Buffer.concat(chunks) : undefined,
  });
  const out = await route(request).catch((e) => {
    console.error(e);
    return new Response(JSON.stringify({ error: 'server' }), { status: 500 });
  });
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(PORT, () => console.log(`api http://localhost:${PORT}`));
