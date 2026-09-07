import { routes } from '../lib/routes.js';
import { esc, count } from '../lib/format.js';
import { products, groups, brands } from '../lib/catalog.js';
import { card } from '../components/product-card.js';
import { icons } from '../components/icons.js';

/* Filtering runs in the browser over the rendered grid: 488 products is small
   enough that a round trip per checkbox would be slower than the DOM work,
   and it keeps every listing a static page that works before JS arrives. */
const controls = (list, activeGroup) => {
  const present = new Map();
  for (const p of list) present.set(p.brand, (present.get(p.brand) || 0) + 1);
  const shown = brands.filter((b) => present.has(b.name));

  return `
<aside class="filters" id="filters">
  <div class="filters__hd">
    <h2 class="filters__t">${icons.filter} Filter</h2>
    <button class="filters__clear" id="f-clear" type="button">Clear</button>
  </div>

  <div class="fgroup">
    <h3>Category</h3>
    <ul class="flist">
      <li><a href="${routes.shop()}"${!activeGroup ? ' aria-current="page"' : ''}>
        All <span>${count(products.length)}</span></a></li>
      ${groups.map((g) => `<li><a href="${routes.group(g.slug)}"${activeGroup === g.slug ? ' aria-current="page"' : ''}>
        ${esc(g.name)} <span>${count(g.count)}</span></a></li>`).join('')}
    </ul>
  </div>

  <div class="fgroup">
    <h3>Brand <span class="fgroup__n" id="f-brand-n"></span></h3>
    <input class="fsearch" type="search" id="f-brand-q" placeholder="Find a brand…" aria-label="Filter the brand list">
    <div class="fscroll" id="f-brands">
      ${shown.map((b) => `
      <label class="fcheck"><input type="checkbox" name="brand" value="${esc(b.name)}">
        <span>${esc(b.name)}</span><em>${present.get(b.name)}</em></label>`).join('')}
    </div>
  </div>

  <div class="fgroup">
    <h3>Price</h3>
    <div class="frange">
      <label>Max <b id="f-price-v">any</b></label>
      <input type="range" id="f-price" min="0" max="200" step="5" value="200">
    </div>
  </div>

  <div class="fgroup">
    <label class="fcheck"><input type="checkbox" id="f-stock">
      <span>In stock only</span></label>
  </div>
</aside>`;
};

export const shop = ({ list, title, lede, activeGroup = null, hero = null }) => `
<section class="phead${hero ? ' phead--art' : ''}"${hero ? ` style="--art:url('/assets/img/groups/${hero}.webp')"` : ''}>
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="${routes.home()}">Home</a>${icons.chevron}
      <a href="${routes.shop()}">Shop</a>
      ${activeGroup ? `${icons.chevron}<span>${esc(title)}</span>` : ''}
    </nav>
    <h1 class="chrome">${esc(title)}</h1>
    <p class="phead__lede">${esc(lede)}</p>
  </div>
</section>

<div class="wrap shop">
  ${controls(list, activeGroup)}
  <div class="shop__main">
    <div class="shop__bar">
      <p class="shop__n"><b id="grid-n">${count(list.length)}</b> products</p>
      <div class="shop__sort">
        <label for="sort">Sort</label>
        <select id="sort">
          <option value="featured">Featured</option>
          <option value="price-asc">Price, low to high</option>
          <option value="price-desc">Price, high to low</option>
          <option value="name">Name</option>
          <option value="brand">Brand</option>
        </select>
      </div>
      <button class="btn btn--steel shop__ftoggle" id="f-toggle" type="button">${icons.filter} Filter</button>
    </div>

    <div class="grid" id="grid">
      ${list.map((p, i) => card(p, { eager: i < 4 })).join('')}
    </div>
    <p class="shop__empty" id="grid-empty" hidden>
      Nothing matches those filters. <button type="button" id="f-clear-2">Clear them</button>
    </p>
  </div>
</div>`;
