// Admin authentication, session handling and signed photo access.
// Part 3 §28, §29, §31, §48, §49.

import { scrypt, randomBytes, timingSafeEqual, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { db, audit } from './db.js';
import { randomKey } from './validate.js';

const scryptAsync = promisify(scrypt);

const SESSION_HOURS = 12;
const LOCK_AFTER = 6;          // failed attempts
const LOCK_MINUTES = 15;

/* ------------------------------------------------------------ passwords -- */
/** scrypt with a per-password salt. Plaintext is never stored. §28 */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scryptAsync(String(password), salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (!stored || !stored.startsWith('scrypt:')) return false;
  const [, salt, hex] = stored.split(':');
  const key = await scryptAsync(String(password), salt, 64);
  const a = Buffer.from(hex, 'hex');
  return a.length === key.length && timingSafeEqual(a, key);
}

/**
 * The admin account. On first run it is created from ADMIN_PASSWORD.
 * There is deliberately no public "create admin" route. §28
 */
export async function ensureAdmin() {
  const existing = await db.settings.get('admin');
  if (existing?.passwordHash) return existing;

  const initial = process.env.ADMIN_PASSWORD;
  if (!initial) return null;          // dashboard stays closed until it is set
  const rec = {
    username: process.env.ADMIN_USERNAME || 'admin',
    passwordHash: await hashPassword(initial),
    createdAt: new Date().toISOString(),
  };
  await db.settings.set('admin', rec);
  return rec;
}

/* ------------------------------------------------------- rate limiting --- */
/** Part 3 §48: repeated failures lock the account for a cooling-off period. */
async function attempts() {
  return (await db.settings.get('login_attempts')) || { count: 0, lockedUntil: null };
}

export async function loginLocked() {
  const a = await attempts();
  if (!a.lockedUntil) return false;
  if (new Date(a.lockedUntil) > new Date()) return true;
  await db.settings.set('login_attempts', { count: 0, lockedUntil: null });
  return false;
}

async function recordFailure() {
  const a = await attempts();
  const count = (a.count || 0) + 1;
  const lockedUntil = count >= LOCK_AFTER
    ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
    : null;
  await db.settings.set('login_attempts', { count, lockedUntil });
}

const clearFailures = () => db.settings.set('login_attempts', { count: 0, lockedUntil: null });

/* --------------------------------------------------------- sessions ------ */
export async function login(username, password) {
  if (await loginLocked()) return { error: 'locked' };

  const admin = await ensureAdmin();
  if (!admin) return { error: 'not_configured' };

  const userOk = String(username || '') === admin.username;
  const passOk = await verifyPassword(password, admin.passwordHash);
  // Both checks run regardless, so timing does not reveal which one failed.
  if (!userOk || !passOk) {
    await recordFailure();
    await audit('admin_login_failed', {}, 'anonymous');
    return { error: 'invalid' };
  }

  await clearFailures();
  const token = randomKey(32);
  await db.sessions.set(token, {
    token, username: admin.username,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_HOURS * 3600_000).toISOString(),
  });
  await audit('admin_login', {}, admin.username);
  return { token, expiresHours: SESSION_HOURS };
}

export async function sessionFrom(request) {
  const cookie = request.headers.get('cookie') || '';
  const m = cookie.match(/(?:^|;\s*)yk_admin=([A-Za-z0-9]+)/);
  if (!m) return null;
  const s = await db.sessions.get(m[1]);
  if (!s) return null;
  if (new Date(s.expiresAt) < new Date()) { await db.sessions.del(m[1]); return null; }
  return s;
}

export async function logout(request) {
  const s = await sessionFrom(request);
  if (s) await db.sessions.del(s.token);
}

export const sessionCookie = (token, hours = SESSION_HOURS) =>
  `yk_admin=${token}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=${hours * 3600}`;

export const clearCookie = () =>
  'yk_admin=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0';

/** Guard for every admin route. Hidden URLs are never authorization. §29 */
export async function requireAdmin(request) {
  const s = await sessionFrom(request);
  if (!s) return { ok: false, response: json({ error: 'unauthorized' }, 401) };
  return { ok: true, session: s };
}

/* --------------------------------------------- signed photo access ------- */
// Part 3 §31: photo URLs are short-lived and signed server-side. A copied link
// stops working when it expires, and cannot be forged without the secret.
const SIGNING_SECRET = () =>
  process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || 'ya7kayti-dev-only-secret';

const PHOTO_TTL_SECONDS = 300;   // 5 minutes

export function signPhoto(uploadToken, ttl = PHOTO_TTL_SECONDS) {
  const exp = Math.floor(Date.now() / 1000) + ttl;
  const sig = createHmac('sha256', SIGNING_SECRET())
    .update(`${uploadToken}.${exp}`).digest('hex').slice(0, 32);
  return { exp, sig };
}

export function verifyPhotoSignature(uploadToken, exp, sig) {
  const e = Number(exp);
  if (!Number.isFinite(e) || e < Math.floor(Date.now() / 1000)) return false;
  const expected = createHmac('sha256', SIGNING_SECRET())
    .update(`${uploadToken}.${e}`).digest('hex').slice(0, 32);
  const a = Buffer.from(String(sig || ''));
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ------------------------------------------------------------- helpers --- */
export function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...extraHeaders,
    },
  });
}
