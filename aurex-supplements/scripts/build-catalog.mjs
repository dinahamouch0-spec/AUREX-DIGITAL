#!/usr/bin/env node
/* Turns the priced CSV export into the storefront catalogue.
   102 source collections are noisy for navigation, so they fold into 11
   shopping groups here; the raw collections stay on the product as filters. */
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = process.argv[2] || 'data/AUREX_priced.csv';

/* --- the shopping hierarchy: group -> source collections ----------------- */
const GROUPS = [
  ['protein', 'Protein', ['Whey protein','Isolate','Whey protein concentrate','Hydrolyzed','Casein','Vegan','Beef']],
  ['creatine', 'Creatine', ['Creatine','Unflavored Creatine','Flavored Creatine','Creatine HCL','creatine capsules','Blend creatine','gummies creatine','UBSA Creatine']],
  ['pre-workout', 'Pre-Workout', ['Pre workouts','Pre Workout Stim','Pre Workout non-stim','Nitric Oxide','Caffeine Pills']],
  ['amino-acids', 'Amino Acids', ['Amino acids','Bcaa','Eaa','Amino acid pills','Amino Acid Complex Powder','Arginine','L-citrulline']],
  ['mass-gainers', 'Mass Gainers', ['Mass gainers']],
  ['carbs', 'Carbs & Performance', ['Carbs','Carbs complex powder','Cream Of Rice','Glutamine','Electrolytes','Hmb','Beta Alanine']],
  ['vitamins', 'Vitamins & Health', ['Vitamins','Multi Vitamin','Minerals','Vitamin B','Vitamin C','Vitamin D','Vitamin E','Magnesium','Zinc','Calcium','Selenium','Fish Oil','Coq10','Biotin','Chromium','boron','Fibers','Digestive Enzymes','Liver Support','kidney support','Joint Support','Glucosamine','Melatonin','L-Theanine','5-HTP','Inositol','Ashwagandha','Lions mane','Astragalus','mct oil','Moringa','matcha','Dandelion','Apple Cider Vinegar','Berberine']],
  ['fat-burners', 'Fat Burners', ['Fat burners','Thermogenic Fat Burner','fat burner non-stim','L-Carnitine','Cla','Glucomannan']],
  ['testosterone', 'Testosterone', ['Testo booster','Complex Testo Booster','Tribulus','Turkesterone','Shilajit','Fadogia agrestits','Horny goat weed','Saw Palmetto','Fenugreek','Yohimbine','Maca','Ginsing','dopa mucuna','Tongkat ali']],
  ['beauty', 'Beauty & Wellness', ['Beauty Care','Anti Aging','Glutathione','Collagen']],
  ['snacks', 'Snacks & Bars', ['Snacks','protein bars']],
  ['accessories', 'Accessories', ['Accessories']],
];
const groupOf = new Map();
for (const [slug, , cols] of GROUPS) for (const c of cols) if (!groupOf.has(c)) groupOf.set(c, slug);

/* --- CSV --------------------------------------------------------------- */
function parseCsv(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
    else if (c !== '\r') cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift().map((h) => h.replace(/^﻿/, ''));
  return rows.filter((r) => r.length === head.length)
             .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const rows = parseCsv(readFileSync(SRC, 'utf8'));
const byProduct = new Map();

for (const r of rows) {
  const id = r.product_id;
  if (!byProduct.has(id)) {
    const cols = r.categories.split(' | ').filter(Boolean);
    const groups = [...new Set(cols.map((c) => groupOf.get(c)).filter(Boolean))];
    byProduct.set(id, {
      id, name: r.title, slug: slugify(r.title) + '-' + id.slice(-5),
      brand: r.brand, collections: cols,
      groups: groups.length ? groups : ['vitamins'],
      image: r.image, variants: [],
    });
  }
  const p = byProduct.get(id);
  p.variants.push({
    id: r.variant_id,
    label: r.variant || 'Standard',
    price: +r.new_price_usd,
    was: +r.old_price_usd,
    available: r.available === 'True',
    sku: r.sku || null,
  });
}

const products = [...byProduct.values()].map((p) => {
  const prices = p.variants.map((v) => v.price);
  return { ...p, priceMin: Math.min(...prices), priceMax: Math.max(...prices),
           available: p.variants.some((v) => v.available) };
});

const count = (fn) => products.reduce((n, p) => n + (fn(p) ? 1 : 0), 0);
const groups = GROUPS.map(([slug, name]) => ({
  slug, name, count: count((p) => p.groups.includes(slug)),
})).filter((g) => g.count > 0);

const brandCount = new Map();
for (const p of products) brandCount.set(p.brand, (brandCount.get(p.brand) || 0) + 1);
const brands = [...brandCount].map(([name, count]) => ({ name, slug: slugify(name), count }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

const catalog = { currency: 'USD', generated: new Date().toISOString(), groups, brands, products };
writeFileSync('src/data/catalog.json', JSON.stringify(catalog));

console.log(`products ${products.length} | variants ${rows.length} | groups ${groups.length} | brands ${brands.length}`);
console.log(`file ${(JSON.stringify(catalog).length / 1024 / 1024).toFixed(2)} MB`);
for (const g of groups) console.log(`  ${String(g.count).padStart(4)}  ${g.name}`);
const orphan = products.filter((p) => !p.groups.length).length;
console.log(`ungrouped: ${orphan}`);
