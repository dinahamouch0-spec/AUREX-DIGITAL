/* Order input is untrusted. Everything is bounded and re-typed here; nothing
   downstream sees a value this file has not vouched for. */
const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export function validateOrder(body) {
  const errors = [];
  const c = body?.customer || {};

  const name = str(c.name, 120);
  const phone = str(c.phone, 40);
  const address = str(c.address, 400);
  const note = str(c.note, 600);
  const email = str(c.email, 160);

  if (name.length < 2) errors.push('A name is needed.');
  if (!/^[\d\s+()-]{6,}$/.test(phone)) errors.push('A reachable phone number is needed.');
  if (address.length < 8) errors.push('A delivery address is needed.');
  if (email && !/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) errors.push('That email address looks wrong.');

  const lines = Array.isArray(body?.lines) ? body.lines.slice(0, 60) : [];
  const clean = [];
  for (const l of lines) {
    const variantId = str(l?.variantId, 40);
    const qty = Math.floor(Number(l?.qty));
    if (!variantId || !Number.isFinite(qty) || qty < 1 || qty > 99) continue;
    clean.push({ variantId, qty });
  }
  if (!clean.length) errors.push('The cart is empty.');

  return { errors, order: { customer: { name, phone, address, note, email }, lines: clean } };
}
