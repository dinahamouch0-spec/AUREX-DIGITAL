// Domain data access. Seeds from the static catalog on first run, then the
// database is authoritative so Admin edits (Part 3 §13-17) take effect without
// a code change or redeploy.

import { collection, files, nextSequence } from './store.js';
import { categories as seedCategories, products as seedProducts } from '../../src/data/catalog.js';
import { faqs as seedFaqs, creations as seedCreations } from '../../src/data/content.js';
import { site } from '../../src/data/site.js';

export const db = {
  products:   collection('products'),
  categories: collection('categories'),
  orders:     collection('orders'),
  orderIndex: collection('order_index'),   // order number + token -> order id
  uploads:    collection('uploads'),       // upload metadata + lifecycle state
  content:    collection('content'),       // faq / creations / reviews
  settings:   collection('settings'),
  audit:      collection('audit'),
  sessions:   collection('sessions'),
  idem:       collection('idempotency'),
  files,
};

/* ------------------------------------------------------------- settings -- */
export const DEFAULT_SETTINGS = {
  businessName: 'Ya 7kayti',
  whatsapp: site.whatsapp,
  whish: site.whish,
  instagram: site.instagram,
  email: site.email,
  productionMinDays: site.productionDays.min,
  productionMaxDays: site.productionDays.max,
  currency: 'USD',
  // Part 3 §34: completion schedules photo deletion after a grace period.
  photoRetentionHours: 24,
  // Part 3 §33: uploads never attached to an order are cleaned up.
  abandonedUploadHours: 48,
  maxUploadMb: 12,
};

export async function getSettings() {
  const stored = (await db.settings.get('business')) || {};
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(patch) {
  const next = { ...(await getSettings()), ...patch };
  await db.settings.set('business', next);
  return next;
}

/* ----------------------------------------------------------------- seed -- */
let seeded = false;

/** Idempotent: only writes documents that do not already exist. */
export async function ensureSeeded() {
  if (seeded) return;
  const marker = await db.settings.get('seed');
  if (marker?.done) { seeded = true; return; }

  for (const c of seedCategories) {
    if (!(await db.categories.get(c.id))) await db.categories.set(c.id, c);
  }
  for (const p of seedProducts) {
    if (!(await db.products.get(p.id))) await db.products.set(p.id, p);
  }
  if (!(await db.content.get('faqs')))      await db.content.set('faqs', { items: seedFaqs });
  if (!(await db.content.get('creations'))) await db.content.set('creations', { items: seedCreations });
  // Part 1 §20 / Part 3 §24: reviews start empty. Never invented.
  if (!(await db.content.get('reviews')))   await db.content.set('reviews', { items: [] });
  if (!(await db.settings.get('business'))) await db.settings.set('business', DEFAULT_SETTINGS);

  await db.settings.set('seed', { done: true, at: new Date().toISOString() });
  seeded = true;
}

/* -------------------------------------------------------------- catalog -- */
export async function allProducts() {
  await ensureSeeded();
  return db.products.all();
}
export async function allCategories() {
  await ensureSeeded();
  return (await db.categories.all()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}
export async function getProduct(id) {
  await ensureSeeded();
  return db.products.get(id);
}
export async function getProductBySlug(slug) {
  return (await allProducts()).find((p) => p.slug === slug) || null;
}

/* --------------------------------------------------------------- orders -- */
/** Friendly, unique, non-sequential-looking enough for a customer. §32 */
export async function newOrderNumber() {
  const n = await nextSequence('order', 1041);
  return `YK-${n}`;
}

export async function saveOrder(order) {
  await db.orders.set(order.id, order);
  // The order number is a display identifier, never authorization (§51):
  // the confirmation token is what grants read access.
  await db.orderIndex.set(order.orderNumber, { id: order.id, token: order.confirmToken });
  return order;
}

export const getOrder = (id) => db.orders.get(id);

export async function listOrders() {
  const all = await db.orders.all();
  return all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/* ---------------------------------------------------------------- audit -- */
/** Part 3 §11/§44. Never records photo bytes, signed URLs or secrets. */
export async function audit(event, detail = {}, actor = 'system') {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.audit.set(id, { id, at: new Date().toISOString(), event, actor, ...detail });
}

export async function orderTimeline(orderId) {
  const all = await db.audit.all();
  return all.filter((e) => e.orderId === orderId).sort((a, b) => a.at.localeCompare(b.at));
}
