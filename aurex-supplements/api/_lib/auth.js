/* Admin sessions.

   One shared password, held as an environment variable and compared in
   constant time; the browser gets an opaque random token in an HttpOnly
   cookie, never the password or anything derived from it. Sessions live in
   the store so signing out actually revokes, rather than only clearing a
   cookie the holder could put back. */
import { randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { collection } from './store.js';

const sessions = collection('sessions');
const COOKIE = 'aurex_admin';
const TTL_MS = 1000 * 60 * 60 * 12;

const constantEquals = (a, b) => {
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
};

export function readCookie(req, name = COOKIE) {
  const raw = req.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export async function signIn(password) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error('ADMIN_PASSWORD is not set');
  if (!password || !constantEquals(password, expected)) return null;

  const token = randomBytes(32).toString('hex');
  const rows = await sessions.all();
  const now = Date.now();
  await sessions.save([{ token, created: now, expires: now + TTL_MS },
                       ...rows.filter((s) => s.expires > now)].slice(0, 50));
  return token;
}

export async function currentSession(req) {
  const token = readCookie(req);
  if (!token) return null;
  const s = await sessions.find((x) => x.token === token);
  if (!s || s.expires < Date.now()) return null;
  return s;
}

export async function signOut(req) {
  const token = readCookie(req);
  if (!token) return;
  await sessions.save((await sessions.all()).filter((s) => s.token !== token));
}

export const cookieHeader = (token, maxAge = TTL_MS / 1000) =>
  `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${maxAge}`;
export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
