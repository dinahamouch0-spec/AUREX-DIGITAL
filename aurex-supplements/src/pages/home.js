import { site } from '../data/site.js';
import { routes } from '../lib/routes.js';
import { esc, count, priceRange } from '../lib/format.js';
import { products, groups, brands, catalog } from '../lib/catalog.js';
import { icons } from '../components/icons.js';
import { chevron } from '../components/mark.js';
import { card } from '../components/product-card.js';

/* The ring. Each product sits on its own face of a cylinder, placed by
   rotateY + translateZ; the whole ring turns as one element. Real 3D, no
   library — the products are flat photographs, so geometry would buy nothing
   that a transform cannot. */
const ring = (items) => {
  const step = 360 / items.length;
  return `
<div class="stage" id="stage" data-count="${items.length}">
  <div class="ring" id="ring" style="--faces:${items.length}">
    ${items.map((p, i) => `
    <a class="ring__face" href="${routes.product(p.slug)}" data-i="${i}"
       style="--a:${(i * step).toFixed(3)}deg" aria-label="${esc(p.name)}"
       data-name="${esc(p.name)}" data-meta="${esc(p.brand)} &middot; ${esc(priceRange(p))}">
      <img src="/assets/img/products/${p.stage}@500.webp" alt="" loading="${i < 3 ? 'eager' : 'lazy'}"
           width="500" height="500" decoding="async">
    </a>`).join('')}
  </div>
  <div class="stage__label" id="stage-label" aria-live="polite">
    <b id="stage-name">${esc(items[0].name)}</b>
    <i id="stage-meta">${esc(items[0].brand)} &middot; ${priceRange(items[0])}</i>
  </div>
  <p class="stage__hint">${icons.drag} drag to turn</p>
</div>`;
};

export const home = () => {
  const staged = products.filter((p) => p.stage);
  const featured = products.filter((p) => p.stage).slice(0, 8);
  const topBrands = brands.slice(0, 18);
  const variantsInStock = products.reduce(
    (n, p) => n + p.variants.filter((v) => v.available).length, 0);
  const inStock = products.filter((p) => p.available).length;

  return `
<section class="hero">
  <div class="wrap hero__grid">
    <div class="hero__copy">
      <p class="eyebrow">${esc(site.tagline)}</p>
      <h1><span class="chrome">BETTER</span><span class="chrome">STRONGER</span><span class="lo">FURTHER</span></h1>
      <p class="hero__lede">Every serious brand, one shelf. ${count(products.length)} products
        priced in ${site.currency} and shipped across Lebanon.</p>
      <div class="hero__acts">
        <a class="btn" href="${routes.shop()}">Shop everything ${icons.arrow}</a>
        <a class="btn btn--ghost" href="${routes.group('protein')}">Start with protein</a>
      </div>
      <div class="hero__stats">
        <div class="hero__stat"><b>${count(products.length)}</b><span>Products</span></div>
        <div class="hero__stat"><b>${count(brands.length)}</b><span>Brands</span></div>
        <div class="hero__stat"><b>${count(variantsInStock)}</b><span>Options in stock</span></div>
      </div>
    </div>
  </div>
  ${ring(staged.slice(0, 10))}
</section>

<section class="sec wrap">
  <div class="sec__hd">
    <div>
      <p class="eyebrow">Shop by goal</p>
      <h2 class="chrome">Find what you train for</h2>
    </div>
    <a class="btn btn--ghost" href="${routes.shop()}">All ${count(products.length)} products</a>
  </div>
  <div class="groups">
    ${groups.map((g) => `
    <a class="group reveal" href="${routes.group(g.slug)}">
      ${chevron({ id: 'g-' + g.slug, cls: 'group__mark' })}
      <b>${esc(g.name)}</b>
      <span>${count(g.count)} products</span>
    </a>`).join('')}
  </div>
</section>

<section class="sec wrap">
  <div class="sec__hd">
    <div>
      <p class="eyebrow">On the stage</p>
      <h2 class="chrome">Shot for AUREX</h2>
      <p>The products we put under our own lights &mdash; each one photographed
         on the AUREX stage rather than lifted from a supplier sheet.</p>
    </div>
  </div>
  <div class="grid">${featured.map((p) => card(p, { stage: true })).join('')}</div>
</section>

<section class="ticker" aria-label="Brands we carry">
  <div class="ticker__row">
    ${[...topBrands, ...topBrands].map((b) => `<b>${esc(b.name)}</b>`).join('')}
  </div>
</section>

<section class="sec wrap">
  <div class="trust">
    <div class="reveal">${icons.shield}<b>Authentic only</b>
      <p>Sourced from the brands and their regional distributors. No grey imports.</p></div>
    <div class="reveal">${icons.truck}<b>Delivered nationwide</b>
      <p>Across Lebanon, with tracking from the moment an order leaves the shelf.</p></div>
    <div class="reveal">${icons.bolt}<b>${count(inStock)} in stock now</b>
      <p>Live stock from the shelf &mdash; if the site sells it, we hold it.</p></div>
    <div class="reveal">${icons.globe}<b>${count(brands.length)} brands</b>
      <p>From Optimum and Dymatize to Thorne, Swanson and NOW Foods.</p></div>
  </div>
</section>`;
};
