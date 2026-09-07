import { routes } from '../lib/routes.js';
import { esc, priceRange, moneyShort } from '../lib/format.js';

/* One card shape for every grid on the site. Products with a photographed
   stage show it; the rest fall back to the supplier shot, which sits on
   white — so it gets a lighter plinth rather than being forced onto black. */
export const card = (p, { stage = false, eager = false } = {}) => {
  const shot = p.stage
    ? `<img class="card__img card__img--stage" src="/assets/img/products/${p.stage}@500.webp"
            alt="" width="500" height="500" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`
    : `<img class="card__img" src="${esc(p.thumb || p.image)}" alt="" width="350" height="350"
            loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;

  /* Facts travel on the element so the filters never need the catalogue
     shipped a second time to the browser. */
  return `
<article class="card${p.stage ? ' card--stage' : ''}"
  data-brand="${esc(p.brand)}" data-name="${esc(p.name)}"
  data-min="${p.priceMin}" data-max="${p.priceMax}"
  data-stock="${p.available ? 1 : 0}" data-stage="${p.stage ? 1 : 0}">
  <div class="card__stage">${shot}
    ${!p.available ? '<span class="tag tag--out card__flag">Out of stock</span>' : ''}
    ${stage && p.stage ? '<span class="tag card__flag">AUREX stage</span>' : ''}
  </div>
  <div class="card__body">
    <p class="card__brand">${esc(p.brand)}</p>
    <h3 class="card__name">${esc(p.name)}</h3>
    <div class="card__foot">
      <span class="card__price">${priceRange(p)}</span>
      ${p.variants.length > 1 ? `<span class="card__from">${p.variants.length} options</span>` : ''}
    </div>
  </div>
  <a class="card__link" href="${routes.product(p.slug)}">
    <span class="sr-only">${esc(p.name)} — ${priceRange(p)}</span>
  </a>
</article>`;
};
