#!/usr/bin/env node
/* Turns the priced CSV export into the storefront catalogue.
   102 source collections are noisy for navigation, so they fold into 11
   shopping groups here; the raw collections stay on the product as filters. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

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


/* --- the eighteen photographed stages, matched to catalogue products ----- */
/* The brand column arrived from a longest-prefix pass over product titles,
   which swallows a leading product word when the brand is short: "Dymatize
   Iso 100" became the brand "Dymatize Iso". These are the nine it got wrong. */
const BRAND_FIX = {
  'Dymatize Iso': 'Dymatize',
  'MuscleTech Amino': 'MuscleTech',
  'MuscleTech Hydroxycut': 'MuscleTech',
  'Scivation Xtend': 'Scivation',
  'UBSA Creatine': 'UBSA',
  'Vital Protein': 'Vital Proteins',
  'Quest Protein': 'Quest Nutrition',
  'Bpi Best': 'BPI Sports',
  'Doctors BEST': "Doctor's Best",
};

const STAGE = [
  ['01-dymatize-iso100',          'Dymatize Iso 100'],
  ['02-muscletech-nitrotech',     'Muscletech Nitrotech Whey Gold'],
  ['03-on-gold-standard',         'Optimum Nutrition Gold Standard'],
  ['04-ubsa-creatine',            'UBSA Creatine Monohydrate'],
  ['05-levrone-gold-creatine',    'Kevin Levrone Gold Creatine'],
  ['06-abe-pre-workout',          'ABE Ultimate Pre Workouts'],
  ['07-xtend-eaa',                'Scivation Xtend EAA'],
  ['08-muscletech-amino-build',   'MuscleTech Amino Build'],
  ['09-applied-amino-fuel',       'Applied Nutrition Amino Fuel'],
  ['10-on-serious-mass',          'Optimum Nutrition Serious Mass'],
  ['11-biotech-hyper-mass',       'Biotech Usa Hyper Mass'],
  ['12-biotech-carbox',           'Biotech Usa Carbox'],
  ['13-muscletech-hydroxycut',    'MuscleTech Hydroxycut Hardcore'],
  ['14-bpi-cla-carnitine',        'Bpi Cla+l-Carnitine'],
  ['15-vital-collagen-peptides',  'Vital Protein Collagen Peptides'],
  ['16-now-omega3',               'Now Omega 3 Fish Oil'],
  ['17-applied-zma',              'Applied Nutrition ZMA'],
  ['18-on-tribulus',              'Optimum Nutrition Tribulus'],
];

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
      brand: BRAND_FIX[r.brand] || r.brand, collections: cols,
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

/* Attach each photographed stage to its product. An unmatched entry is a
   build error rather than a silent miss — a hero image that quietly stops
   appearing is exactly the kind of regression nobody notices. */
const unmatched = [];
for (const [file, title] of STAGE) {
  const hit = products.find((p) => p.name.toLowerCase() === title.toLowerCase())
           || products.find((p) => p.name.toLowerCase().includes(title.toLowerCase()));
  if (!hit) { unmatched.push(`${file} -> ${title}`); continue; }
  hit.stage = file;
}
if (unmatched.length) {
  console.error('\nUnmatched product stages:\n  ' + unmatched.join('\n  '));
  process.exit(1);
}

const count = (fn) => products.reduce((n, p) => n + (fn(p) ? 1 : 0), 0);
const groups = GROUPS.map(([slug, name]) => ({
  slug, name, count: count((p) => p.groups.includes(slug)),
})).filter((g) => g.count > 0);

const brandCount = new Map();
for (const p of products) brandCount.set(p.brand, (brandCount.get(p.brand) || 0) + 1);
const brands = [...brandCount].map(([name, count]) => ({ name, slug: slugify(name), count }))
  .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

/* Point every product at our own copy of its supplier shot. Serving a shop
   from someone else's CDN means a file they delete becomes a hole on our
   shelf, so fetch-images.mjs pulls them in and this rewrites the paths.
   A product whose local copy is missing keeps the remote URL rather than
   rendering nothing. */
let localised = 0;
for (const p of products) {
  if (!p.image) continue;
  const ext = (p.image.split('?')[0].match(/\.(jpe?g|png|webp|avif)$/i)?.[1] || 'jpg').toLowerCase();
  const stem = createHash('sha1').update(p.image).digest('hex').slice(0, 12);
  if (existsSync(`src/assets/img/supplier/${stem}.webp`)) {
    p.remote = p.image;
    p.image = `/assets/img/supplier/${stem}.webp`;
    p.thumb = `/assets/img/supplier/${stem}@350.webp`;
    localised++;
  }
}

const catalog = { currency: 'USD', generated: new Date().toISOString(), groups, brands, products };
writeFileSync('src/data/catalog.json', JSON.stringify(catalog));

console.log(`staged ${products.filter((p) => p.stage).length} of ${STAGE.length} · self-hosted images ${localised}/${products.length}`);
console.log(`products ${products.length} | variants ${rows.length} | groups ${groups.length} | brands ${brands.length}`);
console.log(`file ${(JSON.stringify(catalog).length / 1024 / 1024).toFixed(2)} MB`);
for (const g of groups) console.log(`  ${String(g.count).padStart(4)}  ${g.name}`);
const orphan = products.filter((p) => !p.groups.length).length;
console.log(`ungrouped: ${orphan}`);
