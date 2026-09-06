import { esc, j, each } from '../lib/html.js';
import { icons } from './icons.js';
import { site, localeMeta, waLink } from '../data/site.js';
import { copy } from '../data/copy.js';
import { url, absUrl, routes, categoryPath } from '../lib/routes.js';
import { activeCategories } from '../data/catalog.js';

const other = (l) => (l === 'ar' ? 'en' : 'ar');

/* ------------------------------------------------------------------ head -- */
export function head({ locale, title, description, path, ogImage }) {
  const m = localeMeta[locale];
  const brand = site.brand.name[locale];
  const full = title ? `${title} — ${brand}` : `${brand} | ${site.brand.tagline[locale]}`;
  const og = ogImage || '/assets/img/stories-1100.jpg';
  const noindex = Object.values(routes).some((r) => r.noindex && r.path === path);

  return j(
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`,
    `<title>${esc(full)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    noindex ? `<meta name="robots" content="noindex, nofollow">` : `<meta name="robots" content="index, follow">`,
    `<link rel="canonical" href="${absUrl(locale, path)}">`,
    // hreflang across both locales plus x-default. Part 1 §35.
    `<link rel="alternate" hreflang="ar" href="${absUrl('ar', path)}">`,
    `<link rel="alternate" hreflang="en" href="${absUrl('en', path)}">`,
    `<link rel="alternate" hreflang="x-default" href="${absUrl(site.defaultLocale, path)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(brand)}">`,
    `<meta property="og:title" content="${esc(full)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    `<meta property="og:url" content="${absUrl(locale, path)}">`,
    `<meta property="og:image" content="${site.baseUrl}${og}">`,
    `<meta property="og:locale" content="${locale === 'ar' ? 'ar_AR' : 'en_US'}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="theme-color" content="#fffcf8">`,
    `<link rel="icon" href="/assets/img/favicon.ico" sizes="any">`,
    `<link rel="icon" type="image/png" href="/assets/img/favicon-32.png" sizes="32x32">`,
    `<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">`,
    // Fonts are self-hosted: no third-party connection at render time.
    // Only the faces this locale actually needs are preloaded. Part 1 §34.
    `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/BalooBhaijaan2-${locale === 'ar' ? 'arabic' : 'latin'}-${locale === 'ar' ? 'zYX9KUwuEqdVGqM8tPDdAA_Y-_bMAIRsdO_q' : 'zYX9KUwuEqdVGqM8tPDdAA_Y-_bMAIFsdA'}.woff2">`,
    locale === 'ar'
      ? `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/Cairo-arabic-SLXVc1nY6HkvangtZmpQdkhzfH5lkSscQyyS4J0.woff2">`
      : `<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/Nunito-latin-XRXV3I6Li01BKofINeaB.woff2">`,
    `<link rel="stylesheet" href="/assets/css/styles.css">`,
  );
}

/* ---------------------------------------------------------------- loader -- */
export function loader(locale) {
  return `
<div class="loader" id="loader" role="status" aria-live="polite">
  <div class="loader__inner">
    <div class="loader__sparks" aria-hidden="true">
      ${[1, 2, 3, 4].map(() => `<span class="loader__spark">${icons.sparkle(9)}</span>`).join('')}
    </div>
    <img class="loader__mark" src="/assets/img/logo-mark-256.png" width="108" height="108" alt="" fetchpriority="high">
    <p class="loader__word">${esc(site.brand.name[locale])}</p>
    <span class="sr-only">${esc(copy[locale].common.loading)}</span>
  </div>
</div>`;
}

/* ---------------------------------------------------------------- header -- */
function navItems(locale) {
  const t = copy[locale].nav;
  const cats = activeCategories();
  // Short labels in navigation (Part 1 §10); the full category name is used
  // as the page heading. Falls back to the category name for any new category.
  return [
    { key: 'home', label: t.home, path: routes.home.path },
    { key: 'shop', label: t.shop, path: routes.shop.path },
    ...cats.map((c) => ({
      key: c.slug,
      label: t[c.slug] || c.t[locale].name,
      path: categoryPath(c.slug),
    })),
    { key: 'how', label: t.how, path: routes.how.path },
    { key: 'about', label: t.about, path: routes.about.path },
  ];
}

export function header(locale, current = '') {
  const t = copy[locale].nav;
  const items = navItems(locale);
  const alt = other(locale);
  const link = (i, cls) =>
    `<a class="${cls}" href="${url(locale, i.path)}"${i.key === current ? ' aria-current="page"' : ''}>${esc(i.label)}${cls === 'drawer__link' ? icons.arrow(16) : ''}</a>`;

  return `
<header class="header" id="header">
  <div class="wrap header__bar">
    <a class="brand" href="${url(locale, '')}">
      <img src="/assets/img/logo-mark-96.png" width="44" height="44"
           alt="${esc(site.brand.name[locale])}" fetchpriority="high">
      <span class="brand__text">
        <span class="brand__name">${esc(site.brand.name[locale])}</span>
        <span class="brand__tag">${esc(site.brand.tagline[locale])}</span>
      </span>
    </a>

    <nav class="nav" aria-label="${esc(t.menu)}">
      <ul class="nav__list">${each(items, (i) => `<li>${link(i, 'nav__link')}</li>`)}</ul>
    </nav>

    <div class="header__actions">
      <a class="icon-btn lang-btn" href="${url(alt, current === 'home' ? '' : '')}"
         hreflang="${alt}" lang="${alt}" data-locale-switch="${alt}"
         aria-label="${esc(localeMeta[alt].label)}">${esc(t.langSwitch)}</a>

      <a class="icon-btn" href="${url(locale, routes.cart.path)}" aria-label="${esc(t.cart)}">
        ${icons.cart(20)}<span class="cart-count" data-cart-count data-count="0" aria-hidden="true">0</span>
      </a>

      <a class="btn header__cta" href="${url(locale, routes.shop.path)}">
        ${esc(t.startCta)} ${icons.arrow(16)}
      </a>

      <button class="icon-btn menu-btn" type="button"
              aria-label="${esc(t.menu)}" aria-expanded="false" aria-controls="drawer"
              data-drawer-open>${icons.menu(22)}</button>
    </div>
  </div>
</header>

<div class="drawer" id="drawer" hidden>
  <div class="drawer__scrim" data-drawer-close></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-label="${esc(t.menu)}">
    <div class="drawer__head">
      <span class="brand__name">${esc(site.brand.name[locale])}</span>
      <button class="icon-btn" type="button" aria-label="${esc(t.close)}" data-drawer-close>${icons.close(20)}</button>
    </div>
    <div class="drawer__body">
      <ul class="drawer__list">
        ${each(items, (i) => `<li>${link(i, 'drawer__link')}</li>`)}
        <li><a class="drawer__link" href="${url(locale, routes.faq.path)}">${esc(t.faq)}${icons.arrow(16)}</a></li>
        <li><a class="drawer__link" href="${url(locale, routes.contact.path)}">${esc(t.contact)}${icons.arrow(16)}</a></li>
      </ul>
      <a class="btn btn--block" href="${url(locale, routes.shop.path)}">${esc(t.startCta)} ${icons.arrow(16)}</a>
      <a class="chip" href="${url(alt, '')}" hreflang="${alt}" lang="${alt}" data-locale-switch="${alt}">
        ${icons.globe(16)} ${esc(localeMeta[alt].label)}
      </a>
    </div>
  </div>
</div>`;
}

/* ---------------------------------------------------------------- footer -- */
export function footer(locale) {
  const c = copy[locale];
  const t = c.footer;
  const cats = activeCategories();
  const wa = waLink();
  const year = new Date().getFullYear();

  const li = (label, path) => `<li><a href="${url(locale, path)}">${esc(label)}</a></li>`;

  return `
<footer class="footer">
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__brand">
        <img src="/assets/img/logo-mark-128.png" width="62" height="62" alt="" loading="lazy">
        <p class="footer__about">${esc(t.about)}</p>
      </div>

      <div>
        <h2>${esc(t.shop)}</h2>
        <ul class="footer__list">
          ${li(c.shop.all, routes.shop.path)}
          ${each(cats, (x) => li(x.t[locale].name, categoryPath(x.slug)))}
        </ul>
      </div>

      <div>
        <h2>${esc(t.info)}</h2>
        <ul class="footer__list">
          ${li(c.nav.how, routes.how.path)}
          ${li(c.nav.about, routes.about.path)}
          ${li(c.nav.faq, routes.faq.path)}
          ${li(c.nav.contact, routes.contact.path)}
        </ul>
      </div>

      <div>
        <h2>${esc(t.legal)}</h2>
        <ul class="footer__list">
          ${li(c.pages.privacy.title, routes.privacy.path)}
          ${li(c.pages.terms.title, routes.terms.path)}
          ${li(c.pages.shipping.title, routes.shipping.path)}
        </ul>
        ${(wa || site.instagram) ? `
        <h2 style="margin-block-start:var(--s-5)">${esc(t.follow)}</h2>
        <div class="social">
          ${wa ? `<a href="${wa}" rel="noopener" aria-label="WhatsApp">${icons.whatsapp(20)}</a>` : ''}
          ${site.instagram ? `<a href="${esc(site.instagram)}" rel="noopener" aria-label="Instagram">${icons.instagram(20)}</a>` : ''}
        </div>` : `<p class="footer__note" style="margin-block-start:var(--s-5)">${esc(t.pendingContact)}</p>`}
      </div>
    </div>

    <div class="footer__bottom">
      <span>© ${year} ${esc(site.brand.name[locale])}. ${esc(t.rights)}</span>
      <a href="${url(other(locale), '')}" hreflang="${other(locale)}" lang="${other(locale)}">${esc(localeMeta[other(locale)].label)}</a>
    </div>
  </div>
</footer>`;
}

/* -------------------------------------------------------------- document -- */
export function document_({ locale, title, description, path, current, body, ogImage }) {
  const m = localeMeta[locale];
  return `<!doctype html>
<html lang="${m.htmlLang}" dir="${m.dir}" class="no-js">
<head>
${head({ locale, title, description, path, ogImage })}
<script>document.documentElement.classList.remove('no-js');document.documentElement.classList.add('js');</script>
</head>
<body>
${loader(locale)}
<a class="skip-link" href="#main">${esc(copy[locale].nav.skip)}</a>
${header(locale, current)}
<main id="main">
${body}
</main>
${footer(locale)}
<script src="/assets/js/app.js" defer></script>
</body>
</html>`;
}
