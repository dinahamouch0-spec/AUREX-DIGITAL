#!/usr/bin/env node
/* Ya 7kayti static site build.
   Renders every page for every locale into dist/ as plain HTML, copies assets,
   and emits sitemap.xml / robots.txt / _redirects. No runtime dependencies —
   the output is pure static files. */

import { mkdir, writeFile, rm, cp, readdir, readFile, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';

import { site, localeMeta } from './src/data/site.js';
import { url, absUrl, routes, categoryPath, productPath } from './src/lib/routes.js';
import { activeCategories, activeProducts, categoryBySlug } from './src/data/catalog.js';
import { document_ } from './src/components/layout.js';
import { setManifest, asset } from './src/lib/assets.js';
import * as P from './src/pages/index.js';

const DIST = 'dist';
const LOCALES = site.locales;

/* ------------------------------------------------------------- helpers -- */
async function emit(routePath, html) {
  const dir = path.join(DIST, routePath);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html, 'utf8');
  return path.join(routePath, 'index.html');
}

function render(locale, page) {
  return document_({
    locale,
    title: page.title,
    description: page.description,
    path: page.path,
    current: page.current,
    ogImage: page.ogImage,
    scripts: page.scripts || [],
    assetMap: runtimeManifest(),
    body: page.body,
  });
}

/* ---------------------------------------------------------------- build -- */
const written = [];
const sitemapEntries = [];

async function buildPages() {
  for (const locale of LOCALES) {
    const pages = [
      P.homePage(locale),
      P.shopPage(locale),
      P.howPage(locale),
      P.aboutPage(locale),
      P.contactPage(locale),
      P.faqPage(locale),
      P.cartPage(locale),
      P.checkoutPage(locale),
      P.orderPage(locale),
      P.policyPage('privacy', locale),
      P.policyPage('terms', locale),
      P.policyPage('shipping', locale),
      ...activeCategories().map((c) => P.categoryPage(c, locale)),
      ...activeProducts().map((p) => P.productPage(p, locale)),
    ];

    for (const page of pages) {
      const rel = path.join(locale, page.path);
      written.push(await emit(rel, render(locale, page)));

      const noindex = page.noindex
        || Object.values(routes).some((r) => r.noindex && r.path === page.path);
      if (!noindex) {
        sitemapEntries.push({
          loc: absUrl(locale, page.path),
          locale,
          path: page.path,
          priority: routes[Object.keys(routes).find((k) => routes[k].path === page.path)]?.priority
            ?? (page.path.startsWith('product/') ? 0.8 : 0.7),
          changefreq: 'weekly',
        });
      }
    }

    // Localized 404 body, served by the host's error page config.
    written.push(await emit(path.join(locale, '404'), render(locale, P.notFoundPage(locale))));
  }
}

/* ------------------------------------------------------- root redirect -- */
/* A tiny language-aware landing page: honours the browser's preference, and
   still works with JS disabled via the meta refresh + visible links. */
async function buildRoot() {
  const def = site.defaultLocale;
  const html = `<!doctype html>
<html lang="${def}" dir="${localeMeta[def].dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${site.brand.name.en} | ${site.brand.name.ar}</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${absUrl(def, '')}">
<link rel="alternate" hreflang="ar" href="${absUrl('ar', '')}">
<link rel="alternate" hreflang="en" href="${absUrl('en', '')}">
<link rel="alternate" hreflang="x-default" href="${absUrl(def, '')}">
<meta http-equiv="refresh" content="0; url=/${def}/">
<link rel="icon" href="/assets/img/favicon.ico">
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fffcf8;
       font-family:system-ui,sans-serif;color:#10103a;text-align:center;padding:1.5rem}
  img{width:120px;height:120px;border-radius:50%;margin-bottom:1.25rem}
  a{display:inline-block;margin:.35rem;padding:.85rem 1.75rem;border-radius:999px;
    background:#f0609f;color:#fff;text-decoration:none;font-weight:700}
  a.alt{background:#fff;color:#10103a;border:2px solid #f0e6dd}
</style>
</head>
<body>
  <div>
    <img src="${asset('/assets/img/logo-mark-256.png')}" alt="${site.brand.name.en}">
    <p>${site.brand.name.ar} · ${site.brand.name.en}</p>
    <a href="/ar/">العربية</a><a class="alt" href="/en/">English</a>
  </div>
  <script>
    (function(){
      var pref = (navigator.language || 'ar').toLowerCase().indexOf('ar') === 0 ? 'ar' : 'en';
      try { var s = localStorage.getItem('yk_locale'); if (s === 'ar' || s === 'en') pref = s; } catch(e){}
      location.replace('/' + pref + '/');
    }());
  </script>
</body>
</html>`;
  await writeFile(path.join(DIST, 'index.html'), html, 'utf8');
  written.push('index.html');
}

/* -------------------------------------------------------------- admin --- */
/* A single shell document. Everything inside is rendered by the dashboard
   against the API, and the API is the thing that enforces access. §29, §52. */
async function buildAdmin() {
  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>لوحة التحكم — ${site.brand.name.ar}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/assets/img/favicon.ico">
<link rel="stylesheet" href="${asset('/assets/css/styles.css')}">
</head>
<body class="admin">
<div id="admin-app"><div class="admin-main"><div class="state" role="status">جارٍ التحميل…</div></div></div>
<script>window.YK_ASSETS=${JSON.stringify(runtimeManifest())};</script>
<script src="${asset('/assets/js/admin.js')}" defer></script>
<script src="${asset('/assets/js/admin-views.js')}" defer></script>
</body>
</html>`;
  await mkdir(path.join(DIST, 'admin'), { recursive: true });
  await writeFile(path.join(DIST, 'admin', 'index.html'), html, 'utf8');
  written.push('admin/index.html');
}

/* ------------------------------------------------------------ sitemap --- */
async function buildSeo() {
  const body = sitemapEntries.map((e) => {
    const alts = LOCALES.map(
      (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${absUrl(l, e.path)}"/>`
    ).join('\n');
    return `  <url>
    <loc>${e.loc}</loc>
${alts}
    <xhtml:link rel="alternate" hreflang="x-default" href="${absUrl(site.defaultLocale, e.path)}"/>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority.toFixed(1)}</priority>
  </url>`;
  }).join('\n');

  await writeFile(path.join(DIST, 'sitemap.xml'),
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>
`, 'utf8');

  // Part 3 §52: private surfaces stay out of the index.
  await writeFile(path.join(DIST, 'robots.txt'),
`User-agent: *
Allow: /

Disallow: /admin
Disallow: /ar/cart
Disallow: /en/cart
Disallow: /ar/checkout
Disallow: /en/checkout
Disallow: /ar/order
Disallow: /en/order
Disallow: /uploads

Sitemap: ${site.baseUrl.replace(/\/$/, '')}/sitemap.xml
`, 'utf8');

  // Netlify: clean 404s per locale, and a root language redirect fallback.
  await writeFile(path.join(DIST, '_redirects'),
`/ar/*   /ar/404/index.html   404
/en/*   /en/404/index.html   404
`, 'utf8');

  // HTML always revalidates, so a deploy reaches people immediately. Assets
  // may be cached forever precisely because their filenames carry a content
  // hash — change a file and its URL changes with it. A stable filename plus
  // `immutable` would mean an update could never reach a returning browser.
  await writeFile(path.join(DIST, '_headers'),
`/*
  Cache-Control: public, max-age=0, must-revalidate

/assets/css/*
  Cache-Control: public, max-age=31536000, immutable

/assets/js/*
  Cache-Control: public, max-age=31536000, immutable

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/assets/img/*
  Cache-Control: public, max-age=31536000, immutable

# Favicons ship under fixed names, so they revalidate daily instead.
/assets/img/favicon.ico
  Cache-Control: public, max-age=86400

/assets/img/favicon-32.png
  Cache-Control: public, max-age=86400

/assets/img/apple-touch-icon.png
  Cache-Control: public, max-age=86400
`, 'utf8');

  // Keeps GitHub Pages from stripping the underscore-prefixed files.
  await writeFile(path.join(DIST, '.nojekyll'), '', 'utf8');

  written.push('sitemap.xml', 'robots.txt', '_redirects', '_headers', '.nojekyll');
}

/* ------------------------------------------------------------- assets --- */
/* Assets are content-hashed so the immutable one-year cache is actually
   truthful: change a file and its URL changes with it, so a returning visitor
   always gets the new one. Without this, a stable filename plus `immutable`
   means an update can never reach a browser that has already cached it. */

const hash8 = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 8);
const manifest = {};

/** Copy a file into dist under a hashed name and record the mapping. */
async function emitHashed(srcPath, destDir, name, contents) {
  const buf = contents ?? await readFile(srcPath);
  const ext = path.extname(name);
  const base = name.slice(0, -ext.length);
  const hashed = `${base}.${hash8(buf)}${ext}`;
  await mkdir(path.join(DIST, destDir), { recursive: true });
  await writeFile(path.join(DIST, destDir, hashed), buf);
  manifest[`/${destDir}/${name}`] = `/${destDir}/${hashed}`;
  return hashed;
}

async function buildAssets() {
  // 1. Fonts and images first: the stylesheet points at them.
  for (const f of await readdir('src/assets/fonts')) {
    await emitHashed(path.join('src/assets/fonts', f), 'assets/fonts', f);
  }
  for (const f of await readdir('src/assets/img/out')) {
    await emitHashed(path.join('src/assets/img/out', f), 'assets/img', f);
  }

  // 2. One stylesheet, with its font URLs rewritten to the hashed names.
  const cssDir = 'src/assets/css';
  const files = (await readdir(cssDir)).filter((f) => f.endsWith('.css')).sort();
  let css = (await Promise.all(files.map((f) => readFile(path.join(cssDir, f), 'utf8')))).join('\n');
  css = css.replace(/\/assets\/(fonts|img)\/([^)"'\s]+)/g,
                    (m) => manifest[m] || m);
  await emitHashed(null, 'assets/css', 'styles.css', Buffer.from(css, 'utf8'));

  // 3. Client scripts.
  for (const f of ['app.js', 'commerce.js', 'customizer.js', 'shop.js', 'admin.js', 'admin-views.js']) {
    const src = path.join('src/assets/js', f);
    if (existsSync(src)) await emitHashed(src, 'assets/js', f);
  }

  // Favicons are requested by fixed names from the browser and from other
  // tools, so they also ship unhashed alongside the hashed copies.
  for (const f of ['favicon.ico', 'favicon-32.png', 'apple-touch-icon.png']) {
    const src = path.join('src/assets/img/out', f);
    if (existsSync(src)) await cp(src, path.join(DIST, 'assets/img', f));
  }

  setManifest(manifest);
  written.push(`assets (${Object.keys(manifest).length} hashed)`);
}

/* A few asset URLs are assembled in the browser (cart thumbnails, the admin
   logo) and so cannot be resolved at build time. Those entries — and only
   those — are published to the page so the client can resolve them too. */
function runtimeManifest() {
  const wanted = (k) => /-480\.webp$/.test(k) || /logo-mark-(96|128)\.png$/.test(k);
  return Object.fromEntries(Object.entries(manifest).filter(([k]) => wanted(k)));
}

/* ---------------------------------------------------------------- main --- */
const t0 = Date.now();
if (existsSync(DIST)) await rm(DIST, { recursive: true });
await mkdir(DIST, { recursive: true });

await buildAssets();   // first: pages reference the hashed filenames
await buildPages();
await buildRoot();
await buildAdmin();
await buildSeo();

const htmlCount = written.filter((w) => w.endsWith('.html')).length;
console.log(`✓ built ${htmlCount} HTML pages + assets in ${Date.now() - t0}ms`);
console.log(`  locales: ${LOCALES.join(', ')}   sitemap urls: ${sitemapEntries.length}`);
