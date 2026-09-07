#!/usr/bin/env node
/* AUREX Supplements build.

   Renders every page to static HTML, bundles the client JS, concatenates and
   hashes the CSS, and derives responsive WebP for the category art. Output is
   plain files — Netlify serves them, the functions handle orders. */
import { mkdir, writeFile, rm, cp, readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import * as esbuild from 'esbuild';

import { site } from './src/data/site.js';
import { routes } from './src/lib/routes.js';
import { products, groups, brands, byBrand, inGroup } from './src/lib/catalog.js';
import { document_ } from './src/components/layout.js';
import { home } from './src/pages/home.js';
import { shop } from './src/pages/shop.js';
import { product as productPage } from './src/pages/product.js';
import { brandsPage, cartPage, notFound } from './src/pages/misc.js';
import { adminPage } from './src/pages/admin.js';
import { count } from './src/lib/format.js';

const DIST = 'dist';
const CSS_ORDER = ['00-tokens', '01-base', '02-components', '03-shell', '04-home',
                   '05-ring', '06-shop', '07-product', '08-admin'];

const hash = (s) => createHash('sha256').update(s).digest('hex').slice(0, 8);

async function page(route, html) {
  const dir = path.join(DIST, route);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html);
}

async function main() {
  const t0 = Date.now();
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  /* --- css: one file, hashed ------------------------------------------- */
  let css = '';
  for (const name of CSS_ORDER) {
    const f = `src/assets/css/${name}.css`;
    if (existsSync(f)) css += `/* ${name} */\n` + await readFile(f, 'utf8') + '\n';
  }
  const cssName = `/assets/app.${hash(css)}.css`;
  await mkdir(path.join(DIST, 'assets'), { recursive: true });
  await writeFile(path.join(DIST, cssName), css);

  /* --- js: bundled, hashed ---------------------------------------------- */
  const out = await esbuild.build({
    entryPoints: ['src/assets/js/app.js'],
    bundle: true, format: 'esm', target: 'es2020', minify: true,
    write: false, sourcemap: false,
  });
  const js = out.outputFiles[0].text;
  const jsName = `/assets/app.${hash(js)}.js`;
  await writeFile(path.join(DIST, jsName), js);

  const shell = (o) => document_({ ...o, css: cssName, js: jsName });

  /* --- pages ------------------------------------------------------------- */
  await page('', shell({
    title: `${site.name} Supplements — ${site.tagline}`,
    description: site.description,
    body: home(), active: 'home', canonical: site.url + '/',
    jsonLd: { '@context': 'https://schema.org', '@type': 'Store', name: site.legalName,
              description: site.description, url: site.url,
              address: { '@type': 'PostalAddress', addressCountry: 'LB' } },
  }));

  await page('shop', shell({
    title: `Shop all ${count(products.length)} products — ${site.name}`,
    description: `Every product AUREX carries: ${count(products.length)} across ${count(brands.length)} brands.`,
    body: shop({ list: products, title: 'Everything',
                 lede: `${count(products.length)} products from ${count(brands.length)} brands.` }),
    active: 'shop', canonical: site.url + '/shop/',
  }));

  for (const g of groups) {
    const list = inGroup(g.slug);
    await page(`shop/${g.slug}`, shell({
      title: `${g.name} — ${site.name} Supplements`,
      description: `${count(list.length)} ${g.name.toLowerCase()} products, priced in ${site.currency}.`,
      body: shop({ list, title: g.name, activeGroup: g.slug, hero: g.slug,
                   lede: `${count(list.length)} products.` }),
      active: g.slug, canonical: `${site.url}/shop/${g.slug}/`,
    }));
  }

  for (const p of products) {
    await page(`product/${p.slug}`, shell({
      title: `${p.name} — ${p.brand} | ${site.name}`,
      description: `${p.name} by ${p.brand}. ${p.variants.length} option${p.variants.length > 1 ? 's' : ''} from $${p.priceMin}.`,
      body: productPage(p), active: p.groups[0], canonical: `${site.url}/product/${p.slug}/`,
      jsonLd: { '@context': 'https://schema.org', '@type': 'Product', name: p.name,
                brand: { '@type': 'Brand', name: p.brand }, image: p.image,
                offers: { '@type': 'AggregateOffer', priceCurrency: 'USD',
                          lowPrice: p.priceMin, highPrice: p.priceMax,
                          offerCount: p.variants.length,
                          availability: p.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } },
    }));
  }

  await page('brands', shell({ title: `All brands — ${site.name}`,
    description: `${count(brands.length)} supplement brands.`, body: brandsPage(),
    active: 'brands', canonical: site.url + '/brands/' }));

  for (const b of brands) {
    const list = byBrand(b.name);
    await page(`brands/${b.slug}`, shell({
      title: `${b.name} — ${site.name}`,
      description: `${count(list.length)} products by ${b.name}.`,
      body: shop({ list, title: b.name, lede: `${count(list.length)} products by ${b.name}.` }),
      active: 'brands', canonical: `${site.url}/brands/${b.slug}/`,
    }));
  }

  await page('cart', shell({ title: `Your cart — ${site.name}`, description: 'Your AUREX cart.',
    body: cartPage(), active: 'cart' }));
  await page('admin', shell({ title: `Admin — ${site.name}`, description: 'AUREX admin.',
    body: adminPage(), active: 'admin' }));

  await writeFile(path.join(DIST, '404.html'), shell({
    title: `Not found — ${site.name}`, description: 'Page not found.', body: notFound() }));

  /* --- static assets ----------------------------------------------------- */
  await cp('src/assets/img', path.join(DIST, 'assets/img'), { recursive: true });
  await rm(path.join(DIST, 'assets/img/products/_incoming'), { recursive: true, force: true });

  await writeFile(path.join(DIST, 'favicon.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 92">
<rect width="100" height="92" fill="#05070A"/>
<path fill="#E8ECEF" d="M50 10 92 84H70L50 46 30 84H8Z"/>
<path fill="#35A7DF" d="M49 52 34 84H21L44 46Z"/></svg>`);

  /* --- cart index: variant -> what the cart needs to draw and price a line.
     Shipped separately so 488 products never load just to show three rows. */
  const cartIndex = {};
  for (const p of products)
    for (const v of p.variants)
      cartIndex[v.id] = {
        name: p.name, brand: p.brand, label: v.label === 'Standard' ? '' : v.label,
        price: v.price, slug: p.slug, stage: Boolean(p.stage),
        img: p.stage ? `/assets/img/products/${p.stage}@500.webp` : p.image,
      };
  await writeFile(path.join(DIST, 'assets/cart-index.json'), JSON.stringify(cartIndex));

  /* --- sitemap, robots, headers ------------------------------------------ */
  const urls = [
    '/', '/shop/', '/brands/',
    ...groups.map((g) => `/shop/${g.slug}/`),
    ...brands.map((b) => `/brands/${b.slug}/`),
    ...products.map((p) => `/product/${p.slug}/`),
  ];
  await writeFile(path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `<url><loc>${site.url}${u}</loc></url>`).join('\n') + '\n</urlset>\n');

  await writeFile(path.join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${site.url}/sitemap.xml\n`);

  await writeFile(path.join(DIST, '_headers'),
    `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n\n` +
    `/*.html\n  Cache-Control: public, max-age=0, must-revalidate\n`);

  await writeFile(path.join(DIST, '_redirects'), `/api/*  /.netlify/functions/api/:splat  200\n`);

  const files = await countFiles(DIST);
  console.log(`\n✔ ${files} files in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log(`  ${urls.length} routes · css ${(css.length / 1024).toFixed(0)}KB · js ${(js.length / 1024).toFixed(0)}KB`);
}

async function countFiles(dir) {
  let n = 0;
  for (const e of await readdir(dir, { withFileTypes: true }))
    n += e.isDirectory() ? await countFiles(path.join(dir, e.name)) : 1;
  return n;
}

main().catch((e) => { console.error(e); process.exit(1); });
