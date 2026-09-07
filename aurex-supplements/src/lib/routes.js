export const url = (p = '') => '/' + String(p).replace(/^\/+|\/+$/g, '');
export const routes = {
  home: () => '/',
  shop: () => '/shop/',
  group: (slug) => `/shop/${slug}/`,
  product: (slug) => `/product/${slug}/`,
  brands: () => '/brands/',
  brand: (slug) => `/brands/${slug}/`,
  cart: () => '/cart/',
  admin: () => '/admin/',
};
export const absUrl = (base, p) => new URL(p, base).href;
