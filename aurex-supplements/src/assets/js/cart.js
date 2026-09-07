/* The cart lives in localStorage and is re-priced against the catalogue on
   every read, so a price change in admin can never be overridden by a stale
   line someone left in a tab last week. The server re-prices again at order
   time; this is display maths. */
const KEY = 'aurex.cart.v1';

const read = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
};
const write = (lines) => {
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* private mode */ }
  paintCount(lines);
  dispatchEvent(new CustomEvent('cart:change', { detail: lines }));
};

export const cart = {
  lines: read,
  count: () => read().reduce((n, l) => n + l.qty, 0),

  add(variantId, productId, qty = 1) {
    const lines = read();
    const hit = lines.find((l) => l.variantId === variantId);
    if (hit) hit.qty = Math.min(99, hit.qty + qty);
    else lines.push({ variantId, productId, qty });
    write(lines);
  },
  setQty(variantId, qty) {
    const lines = read().map((l) => (l.variantId === variantId ? { ...l, qty } : l))
                        .filter((l) => l.qty > 0);
    write(lines);
  },
  remove(variantId) { write(read().filter((l) => l.variantId !== variantId)); },
  clear() { write([]); },
};

function paintCount(lines = read()) {
  const n = lines.reduce((a, l) => a + l.qty, 0);
  const el = document.getElementById('cart-n');
  if (!el) return;
  el.textContent = n;
  el.hidden = n === 0;
}

export function initCart() {
  paintCount();
  /* Another tab is the same cart. */
  addEventListener('storage', (e) => { if (e.key === KEY) paintCount(); });
}
