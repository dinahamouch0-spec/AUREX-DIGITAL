import { esc, j, each } from '../lib/html.js';
import { icons } from '../components/icons.js';
import { copy } from '../data/copy.js';
import { site, waLink, money } from '../data/site.js';
import { url, routes, categoryPath, productPath } from '../lib/routes.js';
import {
  activeCategories, activeProducts, productsInCategory,
  categoryBySlug, productBySlug,
} from '../data/catalog.js';
import { policies, publishedFaqs } from '../data/content.js';
import { startingPrice } from '../lib/pricing.js';
import {
  assetPicture, sectionHead, productGrid, emptyState, pageHero, crumbs,
  priceDisplay, availabilityBadge, productionNote, privacyNote,
} from '../components/ui.js';
import {
  hero, howItWorks, featured, categoryFeature, creationsSection,
  why, moment, reviewsSection, faqSection, finalCta,
} from '../components/sections.js';

/* ================================= HOME ================================== */
export function homePage(locale) {
  const c = copy[locale];
  return {
    current: 'home',
    path: routes.home.path,
    title: '',
    description: c.hero.lead,
    body: j(
      hero(locale),
      howItWorks(locale),
      featured(locale),
      each(activeCategories(), (cat, i) => categoryFeature(cat, locale, i)),
      creationsSection(locale),
      why(locale),
      moment(locale),
      reviewsSection(locale),
      faqSection(locale, { limit: 5, showAll: true }),
      finalCta(locale),
    ),
  };
}

/* ================================= SHOP ================================== */
export function shopPage(locale) {
  const c = copy[locale];
  const cats = activeCategories();
  const products = activeProducts();

  return {
    current: 'shop',
    path: routes.shop.path,
    title: c.shop.title,
    description: c.shop.lead,
    body: j(
      pageHero({
        title: c.shop.title, lead: c.shop.lead,
        crumbItems: [{ label: c.nav.home, href: url(locale, '') }, { label: c.shop.title }],
      }),
      `<section class="section">
        <div class="wrap">
          <nav class="filters" aria-label="${esc(c.shop.title)}">
            <a class="chip" href="${url(locale, routes.shop.path)}" aria-current="true">${esc(c.shop.all)}</a>
            ${each(cats, (x) => `<a class="chip" href="${url(locale, categoryPath(x.slug))}">${esc(x.t[locale].name)}</a>`)}
          </nav>
          <h2 class="sr-only">${esc(c.shop.all)}</h2>
          ${productGrid(products, locale, c.shop.empty)}
          <div style="margin-block-start:var(--s-7)">${productionNote(locale)}</div>
        </div>
      </section>`,
      finalCta(locale),
    ),
  };
}

/* ============================== CATEGORY ================================= */
export function categoryPage(category, locale) {
  const c = copy[locale];
  const cat = category.t[locale];
  const products = productsInCategory(category.id);

  return {
    current: category.slug,
    path: categoryPath(category.slug),
    title: cat.name,
    description: cat.desc,
    ogImage: `/assets/img/${category.asset}-1100.jpg`,
    body: j(
      pageHero({
        title: cat.name, lead: cat.desc,
        crumbItems: [
          { label: c.nav.home, href: url(locale, '') },
          { label: c.shop.title, href: url(locale, routes.shop.path) },
          { label: cat.name },
        ],
      }),
      `<section class="section">
        <div class="wrap">
          <nav class="filters" aria-label="${esc(c.shop.title)}">
            <a class="chip" href="${url(locale, routes.shop.path)}">${esc(c.shop.all)}</a>
            ${each(activeCategories(), (x) => `<a class="chip" href="${url(locale, categoryPath(x.slug))}"${x.id === category.id ? ' aria-current="true"' : ''}>${esc(x.t[locale].name)}</a>`)}
          </nav>
          <h2 class="sr-only">${esc(cat.name)}</h2>
          ${productGrid(products, locale, c.shop.emptyCat)}
          <div class="showcase" style="margin-block-start:var(--s-8)">
            ${assetPicture(category.asset, { alt: cat.name, sizes: '(min-width:1180px) 1100px, 92vw' })}
          </div>
          <div style="margin-block-start:var(--s-6)">${productionNote(locale)}</div>
        </div>
      </section>`,
      finalCta(locale),
    ),
  };
}

/* =============================== PRODUCT ================================= */
/**
 * Part 1 §26: the production-quality shell the Part 2 customizer drops into.
 * The field checklist is rendered from the product's own configuration, so the
 * page already reflects whatever fields Admin defines later.
 */
export function productPage(product, locale) {
  const c = copy[locale];
  const t = c.product;
  const p = product.t[locale];
  const cat = activeCategories().find((x) => x.id === product.categoryId);
  const related = activeProducts().filter((x) => x.id !== product.id);
  const from = startingPrice(product);
  const isUnit = product.pricing?.type === 'unit';
  const fields = (product.fields || []).filter((f) => f.active).sort((a, b) => a.order - b.order);

  const fieldIcon = { image_upload: 'camera', radio: 'list', select: 'list', number: 'box', long_text: 'pencil', short_text: 'pencil' };

  return {
    current: cat?.slug || 'shop',
    path: productPath(product.slug),
    title: p.name,
    description: p.short,
    ogImage: `/assets/img/${product.asset}-1100.jpg`,
    body: j(
      `<section class="section section--tight">
        <div class="wrap">
          ${crumbs([
            { label: c.nav.home, href: url(locale, '') },
            { label: c.shop.title, href: url(locale, routes.shop.path) },
            ...(cat ? [{ label: cat.t[locale].name, href: url(locale, categoryPath(cat.slug)) }] : []),
            { label: p.name },
          ])}
          <div class="pdp">
            <div class="pdp__media">
              <figure class="pdp__gallery" style="margin:0">
                ${assetPicture(product.asset, {
                  alt: locale === 'ar' ? `نماذج من ${p.name} من يا حكايتي` : `Examples of ${p.name} by Ya 7kayti`,
                  sizes: '(min-width:940px) 580px, 92vw', loading: 'eager', fetchpriority: 'high',
                })}
                <figcaption>${esc(t.gallery)}</figcaption>
              </figure>
            </div>

            <div>
              <div class="pdp__meta">
                ${availabilityBadge(product, locale)}
                ${cat ? `<span class="badge">${esc(cat.t[locale].name)}</span>` : ''}
              </div>
              <h1 class="pdp__title">${esc(p.name)}</h1>
              <p class="pdp__desc">${esc(p.desc)}</p>

              <div class="pdp__price">
                ${!isUnit ? `<span class="price__from">${esc(t.from)}</span>` : ''}
                <span class="price__value">${from != null ? esc(money(from)) : '—'}</span>
                <span class="price__unit">${esc(isUnit ? t.each : `/ ${product.quantity.t[locale]}`)}</span>
              </div>

              <div class="panel">
                <h2>${esc(t.personalize)}</h2>
                <ul class="field-list">
                  ${each(fields, (f) => `
                    <li>
                      <span class="field-list__ico">${icons[fieldIcon[f.type] || 'pencil'](17)}</span>
                      <span class="field-list__txt">
                        <strong>${esc(f.t[locale].label)}<span class="req${f.required ? '' : ' req--opt'}">${esc(f.required ? t.required : t.optional)}</span></strong>
                        <span>${esc(f.t[locale].help)}</span>
                        ${f.options ? `<span style="display:block;margin-block-start:4px">${each(f.options.filter(o => o.active), (o) =>
                          `<span class="badge badge--gold" style="margin-inline-end:6px">${esc(o.t[locale].label)}${o.priceOverride != null ? ` — ${esc(money(o.priceOverride))}` : ''}</span>`)}</span>` : ''}
                      </span>
                    </li>`)}
                </ul>
              </div>

              <div style="margin-block-start:var(--s-4)">${privacyNote(locale)}</div>

              <!-- Customization + add-to-cart container.
                   Part 2 mounts the dynamic customizer here; Part 1 ships the
                   shell and an honest state rather than a non-functional form. -->
              <div class="panel" id="customizer" data-product="${esc(product.slug)}">
                <div class="note-inline">${icons.info(18)}<span>${esc(t.soon)}</span></div>
                <div style="margin-block-start:var(--s-4);display:flex;gap:var(--s-3);flex-wrap:wrap">
                  ${waLink(locale === 'ar'
                      ? `مرحبًا يا حكايتي ✨ أرغب بطلب: ${p.name}`
                      : `Hello Ya 7kayti ✨ I'd like to order: ${p.name}`)
                    ? `<a class="btn" href="${waLink(locale === 'ar' ? `مرحبًا يا حكايتي ✨ أرغب بطلب: ${p.name}` : `Hello Ya 7kayti ✨ I'd like to order: ${p.name}`)}" rel="noopener">${icons.whatsapp(18)} ${esc(c.finalCta.secondary)}</a>`
                    : `<a class="btn" href="${url(locale, routes.contact.path)}">${esc(c.nav.contact)} ${icons.arrow(16)}</a>`}
                  <a class="btn btn--ghost" href="${url(locale, routes.how.path)}">${esc(c.nav.how)}</a>
                </div>
              </div>

              <div style="margin-block-start:var(--s-4)">${productionNote(locale)}</div>
            </div>
          </div>
        </div>
      </section>`,

      related.length ? `
      <section class="section section--alt" aria-labelledby="rel-h">
        <div class="wrap">
          ${sectionHead({ title: t.related, center: true, id: 'rel-h' })}
          ${productGrid(related, locale, c.shop.empty)}
        </div>
      </section>` : '',

      finalCta(locale),
    ),
  };
}

/* ============================= HOW IT WORKS ============================== */
export function howPage(locale) {
  const c = copy[locale];
  const t = c.pages.how;
  return {
    current: 'how', path: routes.how.path, title: t.title, description: t.lead,
    body: j(
      pageHero({
        title: t.title, lead: t.lead,
        crumbItems: [{ label: c.nav.home, href: url(locale, '') }, { label: t.title }],
      }),
      `<section class="section">
        <div class="wrap wrap--narrow">
          <div class="flow">
            ${each(t.steps, (s, i) => `
            <article class="flow__item reveal">
              <span class="flow__n" aria-hidden="true">${i + 1}</span>
              <div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>
            </article>`)}
          </div>
          <div style="margin-block-start:var(--s-6);display:grid;gap:var(--s-4)">
            <div class="note-inline">${icons.whatsapp(18)}<span>${esc(t.approval)}</span></div>
            ${productionNote(locale)}
            ${privacyNote(locale)}
          </div>
        </div>
      </section>`,
      creationsSection(locale),
      finalCta(locale),
    ),
  };
}

/* ================================ ABOUT ================================== */
export function aboutPage(locale) {
  const c = copy[locale];
  const t = c.pages.about;
  return {
    current: 'about', path: routes.about.path, title: t.title, description: t.lead,
    body: j(
      pageHero({
        title: t.title, lead: t.lead,
        crumbItems: [{ label: c.nav.home, href: url(locale, '') }, { label: t.title }],
      }),
      `<section class="section">
        <div class="wrap wrap--narrow prose">
          ${each(t.body, (p) => `<p class="lead">${esc(p)}</p>`)}
          <div class="note-inline" style="margin-block-start:var(--s-6)">${icons.info(18)}<span>${esc(t.pending)}</span></div>
        </div>
      </section>`,
      why(locale),
      moment(locale),
      finalCta(locale),
    ),
  };
}

/* =============================== CONTACT ================================= */
export function contactPage(locale) {
  const c = copy[locale];
  const t = c.pages.contact;
  const wa = waLink(locale === 'ar' ? 'مرحبًا يا حكايتي ✨' : 'Hello Ya 7kayti ✨');
  const has = wa || site.instagram;

  return {
    current: 'contact', path: routes.contact.path, title: t.title, description: t.lead,
    body: j(
      pageHero({
        title: t.title, lead: t.lead,
        crumbItems: [{ label: c.nav.home, href: url(locale, '') }, { label: t.title }],
      }),
      `<section class="section">
        <div class="wrap wrap--narrow">
          ${has ? `
          <div class="contact-grid">
            ${wa ? `<a class="contact-card" href="${wa}" rel="noopener">
              <span class="contact-card__ico">${icons.whatsapp(20)}</span>
              <span><h3>${esc(t.wa)}</h3><p>${esc(t.hours)}</p></span></a>` : ''}
            ${site.instagram ? `<a class="contact-card" href="${esc(site.instagram)}" rel="noopener">
              <span class="contact-card__ico">${icons.instagram(20)}</span>
              <span><h3>${esc(t.ig)}</h3><p>@${esc(String(site.instagram).split('/').filter(Boolean).pop())}</p></span></a>` : ''}
          </div>` : emptyState({ title: t.pending })}
          <div style="margin-block-start:var(--s-6)">${productionNote(locale)}</div>
        </div>
      </section>`,
      faqSection(locale, { limit: 4, showAll: true }),
    ),
  };
}

/* ================================= FAQ =================================== */
export function faqPage(locale) {
  const c = copy[locale];
  const t = c.pages.faq;
  return {
    current: 'faq', path: routes.faq.path, title: t.title, description: t.lead,
    body: j(
      pageHero({
        title: t.title, lead: t.lead,
        crumbItems: [{ label: c.nav.home, href: url(locale, '') }, { label: t.title }],
      }),
      faqSection(locale, {}),
      finalCta(locale),
    ),
  };
}

/* =============================== POLICIES ================================ */
export function policyPage(kind, locale) {
  const c = copy[locale];
  const t = c.pages[kind];
  const doc = policies[kind];
  return {
    current: kind, path: routes[kind].path, title: t.title,
    description: metaFor(kind, locale),
    body: j(
      pageHero({
        title: t.title,
        crumbItems: [{ label: c.nav.home, href: url(locale, '') }, { label: t.title }],
      }),
      `<section class="section">
        <div class="wrap wrap--narrow prose">
          <div class="doc-note">${icons.info(18)}<span>${esc(doc.reviewNote[locale])}</span></div>
          ${each(doc[locale], (s) => `<h2>${esc(s.h)}</h2>${each(s.p, (x) => `<p>${esc(x)}</p>`)}`)}
        </div>
      </section>`,
    ),
  };
}

/* ================================= CART ================================== */
/** Part 1 §26 shell. Part 2 replaces the empty state with real cart lines. */
export function cartPage(locale) {
  const c = copy[locale];
  const t = c.pages.cart;
  return {
    current: 'cart', path: routes.cart.path, title: t.title,
    description: metaFor('cart', locale),
    body: j(
      pageHero({
        title: t.title,
        crumbItems: [{ label: c.nav.home, href: url(locale, '') }, { label: t.title }],
      }),
      `<section class="section">
        <div class="wrap wrap--narrow">
          <div id="cart-root" data-cart-root>
            ${emptyState({
              title: t.empty, level: 2,
              action: `<p style="margin-block-start:var(--s-5)"><a class="btn" href="${url(locale, routes.shop.path)}">${esc(t.browse)} ${icons.arrow(16)}</a></p>`,
            })}
          </div>
        </div>
      </section>`,
    ),
  };
}

/* ================================== 404 ================================== */
export function notFoundPage(locale) {
  const c = copy[locale];
  const t = c.pages.notFound;
  return {
    current: '', path: '404', title: t.title,
    description: metaFor('notFound', locale), noindex: true,
    body: `<section class="section">
      <div class="wrap wrap--narrow center" style="padding-block:var(--s-9)">
        <div class="state__ico">${icons.box(26)}</div>
        <h1>${esc(t.title)}</h1>
        <p class="lead">${esc(t.lead)}</p>
        <p style="margin-block-start:var(--s-6)">
          <a class="btn" href="${url(locale, '')}">${esc(t.home)} ${icons.arrow(16)}</a>
        </p>
      </div>
    </section>`,
  };
}


/* Meta descriptions for pages whose on-page copy is too short to double as one.
   Part 1 §35: every page gets a real, localized description. */
function metaFor(kind, locale) {
  const brand = site.brand.name[locale];
  const M = {
    ar: {
      privacy:  `كيف تجمع ${brand} بيانات الطلب وصورة الطفل، وأين تُحفظ، ومن يصل إليها، ومتى تُحذف — وفصل التسويق تمامًا عن تنفيذ الطلبات.`,
      terms:    `شروط الطلب والتصميم والمراجعة والتعديل والأسعار والدفع في ${brand}، لمنتجات تُصنع خصيصًا لكل طفل.`,
      shipping: `مدة التنفيذ من ٢ إلى ٥ أيام، وكيف تُحدَّد تكلفة التوصيل ومدّته بالتنسيق معكم مباشرةً بعد تأكيد الطلب.`,
      cart:     `سلة الطلبات في ${brand} — راجعوا المنتجات التي اخترتموها لتخصيصها لطفلكم قبل إتمام الطلب.`,
      notFound: `الصفحة التي تبحثون عنها غير متاحة. عودوا إلى الرئيسية لتصفّح منتجات ${brand} المخصّصة.`,
    },
    en: {
      privacy:  `How ${brand} collects order details and your child’s photo, where it is stored, who can access it, when it is deleted — and why marketing is kept entirely separate from fulfilment.`,
      terms:    `Ordering, design, review, changes, pricing and payment terms for ${brand} products, each made to order for one child.`,
      shipping: `Production takes 2–5 days, and how delivery cost and timing are agreed with you directly after your order is confirmed.`,
      cart:     `Your ${brand} cart — review the products you've chosen to personalize for your child before completing your order.`,
      notFound: `The page you’re looking for isn’t available. Head back home to browse ${brand} personalized products.`,
    },
  };
  return M[locale][kind] || '';
}
