// Central business configuration.
// Part 3 §26 / §99: every business value lives here, never scattered through
// components. Anything not yet supplied is marked CONTENT REQUIRED and renders
// as a graceful fallback instead of invented copy.

export const site = {
  brand: {
    name: { en: 'Ya 7kayti', ar: 'يا حكايتي' },
    tagline: { en: 'Stories told with love', ar: 'قِصَصٌ تُحكَى بِحُبّ' },
  },

  // --- Contact / operations -------------------------------------------------
  // whish + whatsapp supplied (same number). instagram / email: CONTENT REQUIRED.
  // These are overridden at runtime by Admin → Settings once saved.
  whish: '+9613566434',
  whatsapp: '9613566434',  // digits only, international format, no + or 00
  instagram: null,         // CONTENT REQUIRED — e.g. 'https://instagram.com/ya7kayti'
  email: null,             // CONTENT REQUIRED — business email for order notifications

  // --- Business rules -------------------------------------------------------
  currency: 'USD',
  currencySymbol: '$',
  productionDays: { min: 2, max: 5 },   // PRODUCTION time, never delivery time
  defaultLocale: 'ar',
  locales: ['ar', 'en'],

  // --- Deployment -----------------------------------------------------------
  // Set to the real domain before launch so canonicals/hreflang/OG resolve.
  baseUrl: 'https://ya7kayti.com',
};

export const localeMeta = {
  ar: { dir: 'rtl', label: 'العربية', htmlLang: 'ar', altLabel: 'English' },
  en: { dir: 'ltr', label: 'English', htmlLang: 'en', altLabel: 'العربية' },
};

/** WhatsApp deep link, or null when no number is configured yet. */
export function waLink(message = '') {
  if (!site.whatsapp) return null;
  const n = String(site.whatsapp).replace(/\D/g, '');
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

export const money = (n) =>
  `${site.currencySymbol}${Number(n).toFixed(2).replace(/\.00$/, '')}`;
