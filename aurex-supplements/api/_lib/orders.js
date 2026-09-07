/* Orders.

   Prices are read from the catalogue on the server, never from the request:
   a browser can ask for a variant and a quantity, and nothing else. That is
   the whole reason this runs server-side. */
import catalog from '../../src/data/catalog.json' with { type: 'json' };
import { collection } from './store.js';

const orders = collection('orders');

const VARIANTS = new Map();
for (const p of catalog.products)
  for (const v of p.variants)
    VARIANTS.set(String(v.id), { ...v, productId: p.id, name: p.name, brand: p.brand, slug: p.slug });

export function priceOrder(lines) {
  const priced = [];
  const rejected = [];
  for (const l of lines) {
    const v = VARIANTS.get(String(l.variantId));
    if (!v) { rejected.push({ ...l, reason: 'unknown' }); continue; }
    if (!v.available) { rejected.push({ ...l, reason: 'out of stock', name: v.name }); continue; }
    priced.push({
      variantId: String(v.id), productId: v.productId, name: v.name, brand: v.brand,
      option: v.label, unit: v.price, qty: l.qty, total: +(v.price * l.qty).toFixed(2),
    });
  }
  const subtotal = +priced.reduce((s, l) => s + l.total, 0).toFixed(2);
  return { lines: priced, rejected, subtotal, currency: catalog.currency };
}

const number = () => 'AX-' + Date.now().toString(36).toUpperCase().slice(-6) +
  '-' + Math.random().toString(36).slice(2, 5).toUpperCase();

export async function placeOrder(order) {
  const priced = priceOrder(order.lines);
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
