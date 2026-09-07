import { site } from '../data/site.js';
import { routes } from '../lib/routes.js';
import { esc, money, moneyShort, count } from '../lib/format.js';
import { groups, inGroup } from '../lib/catalog.js';
import { icons } from '../components/icons.js';
import { card } from '../components/product-card.js';

/* The stage. For a product photographed for AUREX the shot opens: it lifts
   while light rings expand behind it. Products without a stage get the
   supplier shot on a plinth — honest about what we have rather than faking
   a 3D moment from a flat white cut-out. */
const stage = (p) => p.stage ? `
<div class="pstage">
  <div class="opener" id="opener">
    <span class="opener__burst"></span>
    <span class="opener__ring"></span>
    <span class="opener__ring"></span>
    <img class="opener__shot" src="/assets/img/products/${p.stage}.webp"
         alt="${esc(p.name)}" width="1000" height="1000" fetchpriority="high" decoding="async">
  </div>
  <button class="pstage__btn" id="open-btn" type="button" aria-pressed="false">
    ${icons.bolt} <span>Open it</span>
  </button>
</div>` : `
<div class="pstage pstage--flat">
  <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="eager" decoding="async">
</div>`;

const variantRow = (v, i) => `
<label class="vrow${v.available ? '' : ' vrow--out'}">
  <input type="radio" name="variant" value="${v.id}" data-price="${v.price}"
         ${i === 0 ? 'checked' : ''} ${v.available ? '' : 'disabled'}>
  <span class="vrow__label">${esc(v.label)}</span>
  <span class="vrow__price">${moneyShort(v.price)}</span>
  ${v.available ? '' : '<span class="vrow__out">Out</span>'}
</label>`;

export const product = (p) => {
  const group = groups.find((g) => g.slug === p.groups[0]);
  const related = inGroup(p.groups[0]).filter((x) => x.id !== p.id).slice(0, 4);
  const inStock = p.variants.filter((v) => v.available).length;

  return `
<div class="wrap pwrap">
  <nav class="crumbs" aria-label="Breadcrumb">
    <a href="${routes.home()}">Home</a>${icons.chevron}
    <a href="${routes.shop()}">Shop</a>${icons.chevron}
    ${group ? `<a href="${routes.group(group.slug)}">${esc(group.name)}</a>${icons.chevron}` : ''}
    <span>${esc(p.name)}</span>
  </nav>

  <div class="pgrid">
    ${stage(p)}

    <div class="pinfo">
      <p class="card__brand">${esc(p.brand)}</p>
      <h1 class="chrome">${esc(p.name)}</h1>

      <div class="pinfo__price">
        <b class="num" id="price">${moneyShort(p.priceMin)}</b>
        ${p.priceMin !== p.priceMax ? `<span class="pinfo__range">from ${moneyShort(p.priceMin)} to ${moneyShort(p.priceMax)}</span>` : ''}
      </div>

      <p class="pinfo__stock">
        ${p.available
          ? `<span class="tag">${icons.check} In stock</span>
             <span class="pinfo__vn">${count(inStock)} of ${count(p.variants.length)} options available</span>`
          : '<span class="tag tag--out">Out of stock</span>'}
      </p>

      ${p.variants.length > 1 ? `
      <fieldset class="vlist">
        <legend>Choose an option</legend>
        ${p.variants.map(variantRow).join('')}
      </fieldset>` : `<input type="radio" name="variant" value="${p.variants[0].id}"
                             data-price="${p.variants[0].price}" checked hidden>`}

      <div class="padd">
        <div class="qty">
          <button type="button" id="q-down" aria-label="One fewer">${icons.minus}</button>
          <input type="number" id="qty" value="1" min="1" max="99" aria-label="Quantity">
          <button type="button" id="q-up" aria-label="One more">${icons.plus}</button>
        </div>
        <button class="btn padd__btn" id="add" data-product="${p.id}"
                ${p.available ? '' : 'disabled'}>
          ${icons.cart} <span>${p.available ? 'Add to cart' : 'Out of stock'}</span>
        </button>
      </div>

      <ul class="pfacts">
        <li>${icons.shield}<span>Authentic stock, sourced through the brand</span></li>
        <li>${icons.truck}<span>Delivered across Lebanon</span></li>
        <li>${icons.globe}<span>Priced in ${site.currency}</span></li>
      </ul>
    </div>
  </div>

  ${related.length ? `
  <section class="sec">
    <div class="sec__hd">
      <div><p class="eyebrow">More in ${esc(group?.name || 'this range')}</p>
      <h2 class="chrome">Goes with this</h2></div>
      <a class="btn btn--ghost" href="${routes.group(p.groups[0])}">See all</a>
    </div>
    <div class="grid">${related.map((r) => card(r)).join('')}</div>
  </section>` : ''}
</div>`;
};
