import data from '../data/catalog.json' with { type: 'json' };

export const catalog = data;
export const products = data.products;
export const groups = data.groups;
export const brands = data.brands;

const bySlug = new Map(products.map((p) => [p.slug, p]));
export const productBySlug = (s) => bySlug.get(s);

export const groupBySlug = (s) => groups.find((g) => g.slug === s);
export const inGroup = (slug) => products.filter((p) => p.groups.includes(slug));
export const byBrand = (name) => products.filter((p) => p.brand === name);

/* The eighteen products with their own photographed stage. They lead the
   home carousel and get the 3D treatment; everything else uses the grid. */
export const HERO_IDS = [
  '8765877158106', '8764911091930', '9279886196954', '8754273157338',
  '8774298796250', '8774295224538', '8774321373402', '8770327970010',
];
export const heroProducts = () => {
  const seen = new Set();
  return products.filter((p) => {
    if (!p.stage || seen.has(p.id)) return false;
    seen.add(p.id); return true;
  });
};

/* Cheapest-first inside a group reads as "what can I afford", which is how
   people actually shop a supplement aisle; featured overrides it. */
export const sorters = {
  featured: (a, b) => (b.stage ? 1 : 0) - (a.stage ? 1 : 0) || a.name.localeCompare(b.name),
  'price-asc': (a, b) => a.priceMin - b.priceMin,
  'price-desc': (a, b) => b.priceMax - a.priceMax,
  name: (a, b) => a.name.localeCompare(b.name),
  brand: (a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name),
};
