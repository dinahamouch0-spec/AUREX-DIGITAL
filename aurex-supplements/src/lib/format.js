/* One place decides how money and counts read, so the storefront, the cart
   and the admin never drift apart. */
export const money = (n) =>
  '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const moneyShort = (n) =>
  Number.isInteger(Number(n)) ? '$' + Number(n) : money(n);

export const count = (n) => Number(n).toLocaleString('en-US');

export const priceRange = (p) =>
  p.priceMin === p.priceMax ? moneyShort(p.priceMin) : `${moneyShort(p.priceMin)} – ${moneyShort(p.priceMax)}`;

/* Escapes for HTML text and attributes. Product names come from a supplier
   feed, so nothing from the catalogue reaches a template unescaped. */
export const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
