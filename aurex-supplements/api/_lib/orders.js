/* Orders.

   Prices are read from the catalogue on the server, never from the request:
   a browser can ask for a variant and a quantity, and nothing else. That is
   the whole reason this runs server-side. */
import catalog from '../../src/data/catalog.json' with { type: 'json' };
import { collection, get } from './store.js';

const orders = collection('orders');

/* Price overrides let the shop change a price without a rebuild. They are
   read here, on the server, at the moment an order is priced — so an override
   applies to the next order placed, not the next deploy. The catalogue stays
   the default; an override is only ever a replacement for one variant. */
let overrideCache = { at: 0, map: {} };
async function overrides() {
  if (Date.now() - overrideCache.at < 10_000) return overrideCache.map;
  overrideCache = { at: Date.now(), map: (await get('price-overrides')) || {} };
  return overrideCache.map;
}

/* The cache spares a store read per order, but a price someone just changed
   in admin must not wait it out — a cache that survives its own write is a
   stale price with extra steps. The writer calls this. */
export const invalidateOverrides = () => { overrideCache = { at: 0, map: {} }; };

const VARIANTS = new Map();
for (const p of catalog.products)
  for (const v of p.variants)
    VARIANTS.set(String(v.id), { ...v, productId: p.id, name: p.name, brand: p.brand, slug: p.slug });

export async function priceOrder(lines) {
  const over = await overrides();
  const priced = [];
  const rejected = [];
  for (const l of lines) {
    const v = VARIANTS.get(String(l.variantId));
    if (!v) { rejected.push({ ...l, reason: 'unknown' }); continue; }
    if (!v.available) { rejected.push({ ...l, reason: 'out of stock', name: v.name }); continue; }
    const unit = typeof over[v.id] === 'number' ? over[v.id] : v.price;
    priced.push({
      variantId: String(v.id), productId: v.productId, name: v.name, brand: v.brand,
      option: v.label, unit, qty: l.qty, total: +(unit * l.qty).toFixed(2),
    });
  }
  const subtotal = +priced.reduce((s, l) => s + l.total, 0).toFixed(2);
  return { lines: priced, rejected, subtotal, currency: catalog.currency };
}

const number = () => 'AX-' + Date.now().toString(36).toUpperCase().slice(-6) +
  '-' + Math.random().toString(36).slice(2, 5).toUpperCase();

export async function placeOrder(order) {
  const priced = await priceOrder(order.lines);
  if (!priced.lines.length) return { error: 'Nothing in this order can be fulfilled.', priced };

  const row = {
    number: number(),
    placed: new Date().toISOString(),
    status: 'new',
    customer: order.customer,
    lines: priced.lines,
    rejected: priced.rejected,
    subtotal: priced.subtotal,
    currency: priced.currency,
  };
  await orders.add(row);
  return { order: row };
}

export const listOrders = () => orders.all();
export const setStatus = (num, status) => orders.update((o) => o.number === num, { status });

/* Every variant, with the override applied, for the admin price table. */
export async function priceList() {
  const over = await overrides();
  const rows = [];
  for (const p of catalog.products)
    for (const v of p.variants)
      rows.push({ variantId: String(v.id), productId: p.id, name: p.name, brand: p.brand,
                  option: v.label, listed: v.price,
                  price: typeof over[v.id] === 'number' ? over[v.id] : v.price,
                  overridden: typeof over[v.id] === 'number' });
  return rows;
}
