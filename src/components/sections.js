import { esc, j, each } from '../lib/html.js';
import { icons } from './icons.js';
import { copy } from '../data/copy.js';
import { site, waLink } from '../data/site.js';
import { url, routes, categoryPath, productPath } from '../lib/routes.js';
import { activeCategories, featuredProducts, productsInCategory } from '../data/catalog.js';
import { publishedFaqs, publishedCreations, publishedReviews } from '../data/content.js';
import { assetPicture, sectionHead, productGrid, emptyState, priceDisplay } from './ui.js';

/* --------------------------------------------------------------- hero ---- */
export function hero(locale) {
  const c = copy[locale];
  const t = c.hero;
  return `
<section class="hero">
  <span class="sparkle sparkle--a" aria-hidden="true">${icons.sparkle(20)}</span>
  <span class="sparkle sparkle--b" aria-hidden="true">${icons.sparkle(14)}</span>
  <span class="sparkle sparkle--c" aria-hidden="true">${icons.sparkle(17)}</span>
  <div class="wrap hero__grid">
    <div>
      <p class="eyebrow">${icons.sparkle(12)} ${esc(t.eyebrow)}</p>
      <h1 class="hero__title">${heroTitle(locale, t.title)}</h1>
      <p class="hero__lead">${esc(t.lead)}</p>
      <div class="hero__actions">
        <a class="btn btn--lg" href="${url(locale, routes.shop.path)}">${esc(t.primary)} ${icons.arrow(18)}</a>
        <a class="btn btn--lg btn--ghost" href="${url(locale, routes.how.path)}">${esc(t.secondary)}</a>
      </div>
      <div class="hero__trust">
        <span>${icons.check(15)} ${esc(c.why.items[0].title)}</span>
        <span>${icons.check(15)} ${esc(c.why.items[1].title)}</span>
        <span>${icons.check(15)} ${esc(c.product.production)}</span>
      </div>
    </div>
    <div class="hero__media">
      <div class="showcase">
        ${assetPicture('stories', {
          alt: locale === 'ar'
            ? 'نماذج من قصص يا حكايتي المخصّصة، كل غلاف يحمل صورة طفل مختلف'
            : 'Examples of Ya 7kayti personalized stories, each cover featuring a different child',
          sizes: '(min-width:940px) 560px, 92vw',
          loading: 'eager', fetchpriority: 'high',
        })}
      </div>
      <span class="hero__badge">${icons.star(14)} ${esc(t.badge)}</span>
    </div>
  </div>
</section>`;
}

// Emphasise the emotional core of the headline in each language.
function heroTitle(locale, title) {
  if (locale === 'ar') return `طفلك <span class="accent">بطل حكايته</span>`;
  return `Your child. <span class="accent">Their story.</span> Their world.`;
}

/* ------------------------------------------------------- how it works ---- */
export const howItWorks = (locale) => {
  const t = copy[locale].how;
  return `
<section class="section section--alt" aria-labelledby="how-h">
  <div class="wrap">
    ${sectionHead({ eyebrow: t.eyebrow, title: t.title, lead: t.lead, center: true, id: 'how-h' })}
    <div class="steps">
      ${each(t.steps, (s) => `
      <article class="step reveal">
        <span class="step__n" aria-hidden="true">${esc(s.n)}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
      </article>`)}
    </div>
  </div>
</section>`;
};

/* --------------------------------------------------------- featured ------ */
export const featured = (locale) => {
  const c = copy[locale];
  const items = featuredProducts();
  return `
<section class="section" aria-labelledby="feat-h">
  <div class="wrap">
    ${sectionHead({ eyebrow: c.featured.eyebrow, title: c.featured.title, lead: c.featured.lead, center: true, id: 'feat-h' })}
    ${productGrid(items, locale, c.shop.empty)}
  </div>
</section>`;
};

/* ------------------------------------------------- category feature ------ */
/**
 * One alternating editorial block per category, each carrying its approved
 * promotional asset. Part 1 §14-16.
 */
export function categoryFeature(category, locale, index) {
  const c = copy[locale];
  const cat = category.t[locale];
  const flip = index % 2 === 1;
  const products = productsInCategory(category.id);
  const price = products[0] ? priceDisplay(products[0], locale) : '';
  const ctaLabels = {
    stories:   { ar: 'اكتشف القصص', en: 'Explore stories' },
    stickers:  { ar: 'صمّم ستيكراتهم', en: 'Create their stickers' },
    notebooks: { ar: 'خصّص دفتره', en: 'Personalize a notebook' },
  };
  const cta = ctaLabels[category.slug]?.[locale] || c.product.customize;
  const alts = {
    stories:   { ar: 'نماذج من قصص مخصّصة من يا حكايتي', en: 'Examples of Ya 7kayti personalized stories' },
    stickers:  { ar: 'نماذج من ستيكرات مخصّصة بثيمات متنوّعة', en: 'Examples of personalized stickers across several themes' },
    notebooks: { ar: 'نماذج من أغلفة دفاتر مخصّصة بصور الأطفال', en: 'Examples of personalized notebook covers featuring children’s photos' },
  };

  return `
<section class="section${flip ? ' section--alt' : ''}" aria-labelledby="cat-${esc(category.slug)}-h">
  <div class="wrap">
    <div class="hero__grid" style="${flip ? 'direction:inherit' : ''}">
      <div style="order:${flip ? 2 : 1}">
        <p class="eyebrow">${esc(cat.name)}</p>
        <h2 id="cat-${esc(category.slug)}-h">${esc(cat.name)}</h2>
        <p class="lead">${esc(cat.desc)}</p>
        <ul class="field-list" style="margin-block:var(--s-5)">
          ${each(categoryPoints(category.slug, locale), (p) => `
            <li><span class="field-list__ico">${icons[p.icon](17)}</span>
                <span class="field-list__txt"><strong>${esc(p.title)}</strong><span>${esc(p.text)}</span></span></li>`)}
        </ul>
        <div class="hero__actions">
          <a class="btn" href="${url(locale, categoryPath(category.slug))}">${esc(cta)} ${icons.arrow(16)}</a>
          ${price ? `<span style="display:inline-flex;align-items:center">${price}</span>` : ''}
        </div>
      </div>
      <div style="order:${flip ? 1 : 2}">
        <div class="showcase reveal">
          ${assetPicture(category.asset, {
            alt: alts[category.slug]?.[locale] || cat.name,
            sizes: '(min-width:940px) 560px, 92vw',
          })}
        </div>
      </div>
    </div>
  </div>
</section>`;
}

function categoryPoints(slug, locale) {
  const P = {
    stories: [
      { icon: 'camera', ar: ['صورة طفلك داخل القصة', 'يظهر كبطل داخل الرسومات نفسها.'], en: ['Their photo inside the story', 'They appear as the hero within the artwork itself.'] },
      { icon: 'wand',   ar: ['ثيمات وشخصيات متعدّدة', 'اختاروا العالم الذي يحبّه طفلك.'], en: ['Many themes and characters', 'Choose the world your child loves.'] },
      { icon: 'globe',  ar: ['بالعربية أو الإنجليزية', 'حسب ما يناسب طفلك.'], en: ['In Arabic or English', 'Whichever suits your child.'] },
      { icon: 'gift',   ar: ['طباعة عالية الجودة', 'كتاب يُحفظ، لا يُقرأ مرة ويُنسى.'], en: ['High-quality print', 'A book that’s kept, not read once and forgotten.'] },
    ],
    stickers: [
      { icon: 'tag',    ar: ['اسمه وصورته وعالمه', 'على كل ستيكر باسم طفلك وصفّه.'], en: ['Their name, photo and world', 'On every sticker, with their name and class.'] },
      { icon: 'book',   ar: ['للدفاتر والكتب', 'تميّز أغراضه المدرسية بوضوح.'], en: ['For notebooks and books', 'Marks their school things clearly.'] },
      { icon: 'wand',   ar: ['ثيمات متنوّعة', 'رياضة، شخصيات، حيوانات، أميرات.'], en: ['A range of themes', 'Sport, characters, animals, princesses.'] },
      { icon: 'box',    ar: ['باقات من ١٠ ستيكرات', 'تصميمان للباقة أو تصميم لكل ستيكر.'], en: ['Packs of 10 stickers', 'Two designs per pack, or one per sticker.'] },
    ],
    notebooks: [
      { icon: 'camera', ar: ['صورة طفلك على الغلاف', 'مع الشخصية أو العالم الذي يحبّه.'], en: ['Their photo on the cover', 'Alongside the character or world they love.'] },
      { icon: 'pencil', ar: ['مساحة للاسم والصف والمادة', 'جاهزة للتعبئة على الغلاف.'], en: ['Space for name, class and subject', 'Ready to fill in on the cover.'] },
      { icon: 'list',   ar: ['السعر لكل دفتر', 'اختاروا العدد الذي يناسب سنته الدراسية.'], en: ['Priced per notebook', 'Choose the number that suits their school year.'] },
      { icon: 'star',   ar: ['يميّز دفاتره', 'لا يختلط دفتره بدفاتر الصف.'], en: ['Unmistakably theirs', 'Their notebook never gets mixed up with the class’s.'] },
    ],
  };
  return (P[slug] || []).map((p) => ({ icon: p.icon, title: p[locale][0], text: p[locale][1] }));
}

/* ------------------------------------------------ previous creations ----- */
export function creationsSection(locale) {
  const c = copy[locale].creations;
  const items = publishedCreations();
  if (!items.length) return '';
  const alt = {
    stories:   { ar: 'نماذج من قصص يا حكايتي المخصّصة', en: 'Examples of Ya 7kayti personalized stories' },
    stickers:  { ar: 'نماذج من ستيكرات يا حكايتي المخصّصة', en: 'Examples of Ya 7kayti personalized stickers' },
    notebooks: { ar: 'نماذج من أغلفة دفاتر يا حكايتي المخصّصة', en: 'Examples of Ya 7kayti personalized notebook covers' },
  };

  return `
<section class="section section--blush" aria-labelledby="creations-h">
  <div class="wrap">
    ${sectionHead({ eyebrow: c.eyebrow, title: c.title, lead: c.lead, center: true, id: 'creations-h' })}
    <div class="creations">
      ${each(items, (it) => `
      <figure class="creation reveal" style="margin:0">
        ${assetPicture(it.asset, {
          alt: alt[it.asset]?.[locale] || it[locale].caption,
          sizes: '(min-width:1060px) 560px, (min-width:760px) 46vw, 92vw',
        })}
        <figcaption class="creation__cap">
          <h3>${esc(it[locale].caption)}</h3>
          <p>${esc(it[locale].note)}</p>
        </figcaption>
      </figure>`)}
    </div>
    <p class="creations-note">${icons.shield(18)}<span>${esc(c.privacy)}</span></p>
  </div>
</section>`;
}

/* ----------------------------------------------------------------- why --- */
export const why = (locale) => {
  const t = copy[locale].why;
  const ico = ['heart', 'camera', 'wand', 'gift', 'globe'];
  return `
<section class="section" aria-labelledby="why-h">
  <div class="wrap">
    ${sectionHead({ eyebrow: t.eyebrow, title: t.title, center: true, id: 'why-h' })}
    <div class="why-grid">
      ${each(t.items, (i, n) => `
      <article class="why-item reveal">
        <h3>${icons[ico[n] || 'star'](18)} ${esc(i.title)}</h3>
        <p>${esc(i.text)}</p>
      </article>`)}
    </div>
  </div>
</section>`;
};

/* ------------------------------------------------------------- moment ---- */
export const moment = (locale) => {
  const t = copy[locale].moment;
  return `
<section class="moment">
  <div class="wrap">
    <p>${esc(t.line1)}</p>
    <p>${esc(t.line2)}</p>
  </div>
</section>`;
};

/* ------------------------------------------------------------ reviews ---- */
/** Part 1 §20: data-driven, and honest when there is no data yet. */
export function reviewsSection(locale) {
  const t = copy[locale].reviews;
  const items = publishedReviews();
  return `
<section class="section section--alt" aria-labelledby="rev-h">
  <div class="wrap">
    ${sectionHead({ eyebrow: t.eyebrow, title: t.title, center: true, id: 'rev-h' })}
    ${items.length
      ? `<div class="why-grid">${each(items, (r) => `
          <blockquote class="why-item"><p>${esc(r[locale].text)}</p>
          <footer style="font-size:var(--t-sm);color:var(--c-ink-faint)">— ${esc(r[locale].author)}</footer></blockquote>`)}</div>`
      : emptyState({ title: t.empty })}
  </div>
</section>`;
}

/* --------------------------------------------------------------- FAQ ----- */
export function faqSection(locale, { limit = 0, showAll = false } = {}) {
  const c = copy[locale];
  const t = c.faq;
  let items = publishedFaqs();
  if (limit) items = items.slice(0, limit);

  return `
<section class="section" aria-labelledby="faq-h">
  <div class="wrap wrap--narrow">
    ${sectionHead({ eyebrow: t.eyebrow, title: t.title, lead: t.lead, center: true, id: 'faq-h' })}
    <div class="faq-list">
      ${each(items, (f) => `
      <details class="faq-item">
        <summary>${esc(f[locale].q)}<span class="faq-item__icon" aria-hidden="true">${icons.plus(13)}</span></summary>
        <div class="faq-item__body"><p>${esc(f[locale].a)}</p></div>
      </details>`)}
    </div>
    ${showAll ? `<p class="center" style="margin-block-start:var(--s-6)">
      <a class="btn btn--ghost" href="${url(locale, routes.faq.path)}">${esc(t.all)} ${icons.arrow(16)}</a></p>` : ''}
  </div>
</section>`;
}

/* ----------------------------------------------------------- final CTA --- */
export function finalCta(locale) {
  const t = copy[locale].finalCta;
  const wa = waLink(locale === 'ar' ? 'مرحبًا يا حكايتي ✨ أرغب بالاستفسار عن منتجاتكم.' : 'Hello Ya 7kayti ✨ I’d like to ask about your products.');
  return `
<section class="section">
  <div class="wrap">
    <div class="cta-band">
      <h2>${esc(t.title)} ✨</h2>
      <p>${esc(t.lead)}</p>
      <div class="cta-band__actions">
        <a class="btn btn--lg btn--white" href="${url(locale, routes.shop.path)}">${esc(t.primary)} ${icons.arrow(18)}</a>
        ${wa ? `<a class="btn btn--lg btn--ghost" href="${wa}" rel="noopener">${icons.whatsapp(18)} ${esc(t.secondary)}</a>` : ''}
      </div>
    </div>
  </div>
</section>`;
}
