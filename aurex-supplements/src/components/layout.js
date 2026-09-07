import { site, motion, whatsapp } from '../data/site.js';
import { routes } from '../lib/routes.js';
import { esc } from '../lib/format.js';
import { chevron, barbell } from './mark.js';
import { icons } from './icons.js';
import { groups } from '../lib/catalog.js';

const FONTS = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Barlow:wght@300;400;500;600&display=swap';

/* The boot sequence. Held for exactly motion.loaderMs, then the hero takes
   over — the brief asked for 2.5s before the 3D lands. */
const boot = () => `
<div class="boot" id="boot" role="status" aria-live="polite">
  <div class="boot__inner">
    ${chevron({ id: 'boot', cls: 'boot__mark', title: 'AUREX' })}
    <div class="boot__word chrome">AUREX</div>
    <div class="boot__bar"><i></i></div>
    <div class="boot__pct" id="boot-pct">0%</div>
  </div>
</div>`;

const header = (active) => `
<header class="hdr" id="hdr">
  <div class="wrap hdr__in">
    <a class="hdr__mark" href="${routes.home()}" aria-label="AUREX Supplements — home">
      ${chevron({ id: 'hdr' })}<b class="chrome">AUREX</b>
    </a>
    <nav class="nav" id="nav" aria-label="Main">
      <a href="${routes.shop()}"${active === 'shop' ? ' aria-current="page"' : ''}>Shop</a>
      ${groups.slice(0, 4).map((g) =>
        `<a href="${routes.group(g.slug)}"${active === g.slug ? ' aria-current="page"' : ''}>${esc(g.name)}</a>`).join('')}
      <a href="${routes.brands()}"${active === 'brands' ? ' aria-current="page"' : ''}>Brands</a>
    </nav>
    <div class="hdr__acts">
      <button class="icon-btn" id="search-open" aria-label="Search products">${icons.search}</button>
      <a class="icon-btn" href="${routes.cart()}" aria-label="Cart" id="cart-link">
        ${icons.cart}<span class="icon-btn__n" id="cart-n" hidden>0</span>
      </a>
      <button class="icon-btn burger" id="burger" aria-label="Menu" aria-expanded="false"
              aria-controls="nav">${icons.menu}</button>
    </div>
  </div>
</header>`;

const footer = () => `
<footer class="ftr">
  <div class="wrap ftr__in">
    <div class="ftr__cols">
      <div>
        <a class="hdr__mark" href="${routes.home()}" style="margin-bottom:14px">
          ${chevron({ id: 'ftr' })}<b class="chrome">AUREX</b>
        </a>
        <p style="color:var(--text-dim);max-width:34ch">${esc(site.description)}</p>
        <div style="color:var(--arc);margin-top:16px;width:64px">${barbell()}</div>
      </div>
      <div>
        <h4>Shop</h4>
        <ul>${groups.slice(0, 6).map((g) =>
          `<li><a href="${routes.group(g.slug)}">${esc(g.name)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4>More</h4>
        <ul>${groups.slice(6).map((g) =>
          `<li><a href="${routes.group(g.slug)}">${esc(g.name)}</a></li>`).join('')}
          <li><a href="${routes.brands()}">All brands</a></li></ul>
      </div>
      <div>
        <h4>Talk to us</h4>
        <ul>
          <li><a class="ftr__ct" href="tel:${site.contact.dial}">
            ${icons.phone}<span>${site.contact.display}</span></a></li>
          <li><a class="ftr__ct ftr__ct--wa" href="${whatsapp(`Hi ${site.name}, I have a question.`)}"
                 target="_blank" rel="noopener">
            ${icons.whatsapp}<span>WhatsApp</span></a></li>
          <li><a href="${routes.cart()}">Your cart</a></li>
          <li><a href="${routes.shop()}">Everything</a></li>
        </ul>
      </div>
    </div>
    <div class="ftr__note">
      <span>&copy; ${new Date().getFullYear()} ${esc(site.legalName)}. Prices in ${site.currency}.</span>
      <span>Built by <a href="${site.builtBy.url}">${esc(site.builtBy.name)}</a></span>
    </div>
  </div>
</footer>`;

export const document_ = ({ title, description, body, active, css, js, canonical, jsonLd }) => `<!doctype html>
<html lang="${site.locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || site.description)}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description || site.description)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#05070A">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${css}">
<!-- Fonts load without blocking. A stylesheet in the head also blocks every
     script after it, so a slow font host would hold up the whole page, not
     just its type. The body stack carries the page until they land. -->
<link rel="stylesheet" href="${FONTS}" media="print" onload="this.media='all'">
<noscript><link rel="stylesheet" href="${FONTS}"></noscript>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<script>document.documentElement.dataset.boot='1'</script>
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${boot()}
${header(active)}
<main id="main">${body}</main>
<dialog class="searchdlg" id="search-dlg" aria-label="Search products">
  <div class="searchdlg__box">
    <div class="searchdlg__bar">
      ${icons.search}
      <input type="search" id="search-q" placeholder="Search products or brands…"
             autocomplete="off" aria-label="Search products or brands">
      <span class="searchdlg__n" id="search-n"></span>
      <button type="button" id="search-close" aria-label="Close search">${icons.close}</button>
    </div>
    <div class="searchdlg__out" id="search-out"></div>
  </div>
</dialog>
${footer()}
<script>window.AUREX_MOTION=${JSON.stringify(motion)}</script>
<script src="${js}" defer></script>
</body>
</html>`;
