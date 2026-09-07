import { routes } from '../lib/routes.js';
import { site, whatsapp } from '../data/site.js';
import { esc, count } from '../lib/format.js';
import { brands, byBrand } from '../lib/catalog.js';
import { icons } from '../components/icons.js';
import { card } from '../components/product-card.js';

export const brandsPage = () => {
  /* A flat list of 109 is a wall. Grouping by first letter turns it into
     something you can aim at. */
  const letters = new Map();
  for (const b of [...brands].sort((a, b2) => a.name.localeCompare(b2.name))) {
    const k = /[A-Za-z]/.test(b.name[0]) ? b.name[0].toUpperCase() : '#';
    if (!letters.has(k)) letters.set(k, []);
    letters.get(k).push(b);
  }
  return `
<section class="phead"><div class="wrap">
  <nav class="crumbs"><a href="${routes.home()}">Home</a>${icons.chevron}<span>Brands</span></nav>
  <h1 class="chrome">${count(brands.length)} brands</h1>
  <p class="phead__lede">Everything on the shelf, by maker.</p>
</div></section>
<div class="wrap sec">
  <div class="alpha">
    ${[...letters.keys()].map((k) => `<a href="#L${k}">${k}</a>`).join('')}
  </div>
  ${[...letters].map(([k, list]) => `
  <section class="bset" id="L${k}">
    <h2 class="bset__k">${k}</h2>
    <ul class="bgrid">
      ${list.map((b) => `<li><a href="${routes.brand(b.slug)}">
        <b>${esc(b.name)}</b><span>${count(b.count)}</span></a></li>`).join('')}
    </ul>
  </section>`).join('')}
</div>`;
};

export const cartPage = () => `
<div class="wrap pwrap">
  <nav class="crumbs"><a href="${routes.home()}">Home</a>${icons.chevron}<span>Cart</span></nav>
  <h1 class="chrome">Your cart</h1>
  <div class="cartwrap" id="cartwrap">
    <div class="cartlines" id="cartlines"></div>
    <aside class="carttotal" id="carttotal"></aside>
  </div>
  <p class="cartempty" id="cartempty" hidden>
    Nothing in the cart yet. <a href="${routes.shop()}">Start shopping</a>.
  </p>

  <dialog class="checkout" id="checkout-dlg">
    <form class="checkout__box" id="checkout-form" method="dialog">
      <button class="checkout__x" type="button" id="co-close" aria-label="Close">${icons.close}</button>
      <h2 class="chrome">Where is it going?</h2>
      <p class="ahint">We confirm stock and delivery by phone before anything ships &mdash;
        from <b style="color:var(--chrome-300)">${site.contact.display}</b>.</p>

      <label for="co-name">Name</label>
      <input id="co-name" name="name" autocomplete="name" required maxlength="120">

      <label for="co-phone">Phone</label>
      <input id="co-phone" name="phone" type="tel" autocomplete="tel" required maxlength="40"
             placeholder="+961 …">

      <label for="co-address">Delivery address</label>
      <textarea id="co-address" name="address" rows="3" required maxlength="400"
                autocomplete="street-address"></textarea>

      <label for="co-email">Email <span>optional</span></label>
      <input id="co-email" name="email" type="email" autocomplete="email" maxlength="160">

      <label for="co-note">Anything we should know <span>optional</span></label>
      <textarea id="co-note" name="note" rows="2" maxlength="600"></textarea>

      <p class="checkout__err" id="co-err" role="alert" hidden></p>
      <button class="btn" type="submit" id="co-send">Place order</button>
    </form>
  </dialog>

  <section class="placed" id="placed" hidden>
    <h2 class="chrome">Order placed</h2>
    <p>Your reference is <b id="placed-num" class="num"></b>. Keep it &mdash; we use it
       when we call to confirm, from ${site.contact.display}.</p>
    <div style="display:flex;gap:var(--s-3);flex-wrap:wrap;justify-content:center">
      <a class="btn" href="${routes.shop()}">Keep shopping</a>
      <a class="btn btn--wa" id="placed-wa" href="${whatsapp('')}" target="_blank" rel="noopener">
        ${icons.whatsapp} <span>Message us</span></a>
    </div>
  </section>
</div>`;

export const notFound = () => `
<div class="wrap pwrap" style="text-align:center;padding-block:var(--s-10)">
  <h1 class="chrome">Not here</h1>
  <p style="color:var(--text-dim);margin:var(--s-4) 0 var(--s-6)">
    That page has moved or never existed.</p>
  <a class="btn" href="${routes.shop()}">Browse the shop ${icons.arrow}</a>
</div>`;
