#!/usr/bin/env node
// Storefront audit: link integrity, assets, accessibility, SEO, responsive.
import { chromium } from 'playwright';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const B='http://localhost:8899';
const issues=[]; const add=(k,m)=>issues.push(`[${k}] ${m}`);

async function walk(d){ const out=[]; for(const e of await readdir(d,{withFileTypes:true})){
  const p=path.join(d,e.name); if(e.isDirectory()) out.push(...await walk(p));
  else if(e.name==='index.html') out.push(p); } return out; }
const files = await walk('dist');
const routes = new Set(files.map(f=>'/'+path.relative('dist',f).replace(/index\.html$/,'').replace(/\\/g,'/')));

let linkCount=0;
for (const f of files){
  const html = await readFile(f,'utf8');
  const from = '/'+path.relative('dist',f).replace(/index\.html$/,'');
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)){
    const href=m[1]; linkCount++;
    if (href.startsWith('/assets/')) continue;
    const norm = href.endsWith('/')?href:href+'/';
    if (!routes.has(norm) && !routes.has(href)) add('LINK',`${from} -> ${href}`);
  }
}

const missing=new Set();
for (const f of files){
  const html=await readFile(f,'utf8');
  for(const m of html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)){
    try{ await readFile(path.join('dist',m[1])); }catch{ missing.add(m[1]); }
  }
  for(const m of html.matchAll(/srcset="([^"]+)"/g)){
    for(const part of m[1].split(',')){
      const u=part.trim().split(/\s+/)[0];
      if(u.startsWith('/assets/')){ try{ await readFile(path.join('dist',u)); }catch{ missing.add(u); } }
    }
  }
}
missing.forEach(u=>add('ASSET',`missing ${u}`));

const browser = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium' });
const sample = ['/ar/','/en/','/ar/shop/','/en/shop/stories/','/ar/product/personalized-story/',
                '/en/product/personalized-stickers/','/ar/faq/','/en/privacy-policy/','/ar/cart/',
                '/en/checkout/','/ar/how-it-works/','/en/404/'];
for (const url of sample){
  for (const vp of [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:1440,height:900}]){
    const ctx=await browser.newContext({viewport:vp});
    const p=await ctx.newPage();
    p.on('pageerror',e=>add('JS',`${url} ${e.message}`));
    p.on('console',m=>{ if(m.type()==='error' && !m.text().includes('401')) add('CONSOLE',`${url} ${m.text()}`); });
    const resp=await p.goto(B+url,{waitUntil:'networkidle'});
    if(!resp.ok()) add('HTTP',`${url} ${resp.status()}`);
    await p.waitForTimeout(500);
    const r=await p.evaluate(()=>({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      dir: document.documentElement.dir,
      h1: document.querySelectorAll('h1').length,
      imgNoAlt: [...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length,
      desc: document.querySelector('meta[name=description]')?.content?.length||0,
      canonical: !!document.querySelector('link[rel=canonical]'),
      hreflang: document.querySelectorAll('link[rel=alternate][hreflang]').length,
      skips: (()=>{const hs=[...document.querySelectorAll('h1,h2,h3,h4')].map(h=>+h.tagName[1]);
              return hs.filter((v,i)=>i>0 && v-hs[i-1]>1).length;})(),
    }));
    const tag=`${url}@${vp.width}`;
    if(r.overflow>1) add('OVERFLOW',`${tag} by ${r.overflow}px`);
    if(r.h1!==1) add('H1',`${tag} has ${r.h1}`);
    if(r.imgNoAlt) add('ALT',`${tag} ${r.imgNoAlt} without alt`);
    if(r.skips) add('HEADING',`${tag} ${r.skips} level skips`);
    if(!r.canonical) add('SEO',`${tag} no canonical`);
    if(r.hreflang<3) add('SEO',`${tag} hreflang ${r.hreflang}`);
    if(r.desc<40) add('SEO',`${tag} description ${r.desc} chars`);
    if(r.dir!==(url.startsWith('/ar')?'rtl':'ltr')) add('DIR',`${tag} ${r.dir}`);
    await ctx.close();
  }
}

// noindex on private surfaces
for (const u of ['/ar/cart/','/en/checkout/','/ar/order/','/admin/']){
  const ctx=await browser.newContext(); const p=await ctx.newPage();
  await p.goto(B+u,{waitUntil:'domcontentloaded'});
  const robots=await p.evaluate(()=>document.querySelector('meta[name=robots]')?.content||'');
  if(!/noindex/.test(robots)) add('PRIVACY',`${u} is indexable (robots="${robots}")`);
  await ctx.close();
}

// keyboard
const ctx=await browser.newContext({viewport:{width:390,height:844}});
const p=await ctx.newPage();
await p.goto(B+'/ar/',{waitUntil:'networkidle'});
await p.keyboard.press('Tab');
if(!(await p.evaluate(()=>document.activeElement?.className||'')).includes('skip-link'))
  add('A11Y','first tab stop is not the skip link');
await p.click('[data-drawer-open]'); await p.waitForTimeout(500);
if(!(await p.evaluate(()=>!!document.activeElement?.closest('#drawer')))) add('A11Y','focus not moved into drawer');
await p.keyboard.press('Escape'); await p.waitForTimeout(400);
if(!(await p.evaluate(()=>!document.getElementById('drawer').classList.contains('is-open')))) add('A11Y','Escape did not close drawer');
await browser.close();

console.log(`checked ${files.length} pages, ${linkCount} links`);
console.log(issues.length ? 'ISSUES:\n'+[...new Set(issues)].join('\n') : '✓ no issues found');
process.exit(issues.length?1:0);
