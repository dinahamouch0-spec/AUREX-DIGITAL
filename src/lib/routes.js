// Localized routing. Part 1 §7/§35: every page exists at /ar/… and /en/…,
// business entities are never duplicated per locale — only the URL prefix is.
import { site } from '../data/site.js';

/** Build a localized path: url('ar','shop/stories') -> '/ar/shop/stories/' */
export function url(locale, path = '') {
  const clean = String(path).replace(/^\/+|\/+$/g, '');
  return clean ? `/${locale}/${clean}/` : `/${locale}/`;
}

export const absUrl = (locale, path = '') =>
  `${site.baseUrl.replace(/\/$/, '')}${url(locale, path)}`;

/** Every page in the site, in one table: routing, SEO and the sitemap share it. */
export const routes = {
  home:      { path: '',                    changefreq: 'weekly',  priority: 1.0 },
  shop:      { path: 'shop',                changefreq: 'weekly',  priority: 0.9 },
  how:       { path: 'how-it-works',        changefreq: 'monthly', priority: 0.7 },
  about:     { path: 'about',               changefreq: 'monthly', priority: 0.6 },
  contact:   { path: 'contact',             changefreq: 'monthly', priority: 0.6 },
  faq:       { path: 'faq',                 changefreq: 'monthly', priority: 0.6 },
  cart:      { path: 'cart',                changefreq: 'never',   priority: 0.3, noindex: true },
  privacy:   { path: 'privacy-policy',      changefreq: 'yearly',  priority: 0.3 },
  terms:     { path: 'terms',               changefreq: 'yearly',  priority: 0.3 },
  shipping:  { path: 'shipping-policy',     changefreq: 'yearly',  priority: 0.3 },
};

export const categoryPath = (slug) => `shop/${slug}`;
export const productPath  = (slug) => `product/${slug}`;
