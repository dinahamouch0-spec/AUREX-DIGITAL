import { esc, j, each } from '../lib/html.js';
import { icons } from './icons.js';
import { copy } from '../data/copy.js';
import { site, money } from '../data/site.js';
import { url, productPath } from '../lib/routes.js';
import { startingPrice } from '../lib/pricing.js';
import { asset } from '../lib/assets.js';

/**
 * Responsive picture for an approved promotional asset.
 * Part 1 §4: aspect ratio is fixed at the asset's native 3:2 and never
 * distorted. Part 1 §34: dimensions are always reserved to avoid layout shift.
 */
export function assetPicture(name, {
  alt, sizes = '100vw', loading = 'lazy', fetchpriority, className = '',
} = {}) {
  const w = 1536, h = 1024;
  return `<picture>
  <source type="image/webp" sizes="${esc(sizes)}"
          srcset="${asset(`/assets/img/${name}-480.webp`)} 480w, ${asset(`/assets/img/${name}-768.webp`)} 768w, ${asset(`/assets/img/${name}-1100.webp`)} 1100w, ${asset(`/assets/img/${name}-1536.webp`)} 1536w">
  <img src="${asset(`/assets/img/${name}-1100.jpg`)}" width="${w}" height="${h}"
       alt="${esc(alt)}" class="${esc(className)}"
       loading="${loading}" decoding="async"${fetchpriority ? ` fetchpriority="${fetchpriority}"` : ''}
       onerror="this.closest('picture')?.classList.add('is-failed')">
</picture>`;
}

export function sectionHead({ eyebrow, title, lead, center = false, id }) {
  return `<div class="sec-head${center ? ' sec-head--center' : ''}">
    ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}
    <h2${id ? ` id="${esc(id)}"` : ''}>${esc(title)}</h2>
    ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
  </div>`;
}

/* --------------------------------------------------------------- states -- */
export const emptyState = ({ title, text, action, level = 3 }) => {
  const H = `h${level}`;
  return `
  <div class="state">
    <div class="state__ico">${icons.box(26)}</div>
    <${H}>${esc(title)}</${H}>
    ${text ? `<p>${esc(text)}</p>` : ''}
    ${action || ''}
  </div>`;
};

export const errorState = ({ title, text, action }) => `
  <div class="state state--error" role="alert">
    <div class="state__ico">${icons.alert(26)}</div>
    <h3>${esc(title)}</h3>
    ${text ? `<p>${esc(text)}</p>` : ''}
    ${action || ''}
  </div>`;

export const loadingState = (label) => `
  <div class="state" role="status" aria-live="polite">
    <div class="skeleton" style="block-size:120px;margin-block-end:var(--s-4)"></div>
    <p>${esc(label)}</p>
  </div>`;

/* ---------------------------------------------------------------- price -- */
export function priceDisplay(product, locale) {
  const t = copy[locale].product;
  const from = startingPrice(product);
  if (from == null) return `<span class="price"><span class="price__value">—</span></span>`;

  // A unit-priced product shows "each"; an override-priced one shows "from".
  const isUnit = product.pricing?.type === 'unit';
  return `<span class="price">
    ${!isUnit ? `<span class="price__from">${esc(t.from)}</span>` : ''}
    <span class="price__value">${esc(money(from))}</span>
    ${isUnit ? `<span class="price__unit">${esc(t.each)}</span>` : ''}
  </span>`;
}

export const availabilityBadge = (product, locale) => {
  const t = copy[locale].product;
  return product.status === 'active'
    ? `<span class="badge badge--available">${icons.check(13)} ${esc(t.available)}</span>`
    : `<span class="badge badge--unavailable">${esc(t.unavailable)}</span>`;
};

/* ----------------------------------------------------------- product card -- */
export function productCard(product, locale, { eager = false } = {}) {
  const t = copy[locale].product;
  const p = product.t[locale];
  const href = url(locale, productPath(product.slug));

  // Two routes to the product: the image (a large target, hidden from the
  // a11y tree so screen readers hear the product once) and the title link,
  // padded to a full-size target. Part 1 §8/§33.
  return `<article class="pcard reveal">
    <a class="pcard__media" href="${href}" tabindex="-1" aria-hidden="true">
      ${assetPicture(product.asset, {
        alt: '', sizes: '(min-width:1000px) 360px, (min-width:640px) 46vw, 92vw',
        loading: eager ? 'eager' : 'lazy',
      })}
      <span class="pcard__tag">${availabilityBadge(product, locale)}</span>
    </a>
    <div class="pcard__body">
      <h3 class="pcard__title"><a href="${href}">${esc(p.name)}</a></h3>
      <p class="pcard__desc">${esc(p.short)}</p>
      <div class="pcard__foot">
        ${priceDisplay(product, locale)}
        <a class="btn" href="${href}">${esc(t.customize)} ${icons.arrow(15)}</a>
      </div>
    </div>
  </article>`;
}

export function productGrid(products, locale, emptyCopy) {
  if (!products.length) return emptyState({ title: emptyCopy });
  return `<div class="grid-products">${each(products, (p, i) => productCard(p, locale, { eager: i < 3 }))}</div>`;
}

/* ------------------------------------------------------------ breadcrumbs -- */
export const crumbs = (items) => `
  <nav aria-label="Breadcrumb"><ol class="crumbs">
    ${each(items, (i) => `<li>${i.href ? `<a href="${i.href}">${esc(i.label)}</a>` : `<span aria-current="page">${esc(i.label)}</span>`}</li>`)}
  </ol></nav>`;

/* ------------------------------------------------------------ page hero --- */
export const pageHero = ({ title, lead, crumbItems }) => `
  <section class="page-hero">
    <div class="wrap">
      ${crumbItems ? crumbs(crumbItems) : ''}
      <h1>${esc(title)}</h1>
      ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
    </div>
  </section>`;

/* --------------------------------------------------------- production note -- */
export const productionNote = (locale) => {
  const t = copy[locale].product;
  return `<div class="note-inline">${icons.clock(18)}
    <span><strong style="color:var(--c-ink)">${esc(t.production)}</strong><br>${esc(t.productionNote)}</span>
  </div>`;
};

export const privacyNote = (locale) => `
  <div class="privacy-note">${icons.shield(18)}<span>${esc(copy[locale].product.privacy)}</span></div>`;
