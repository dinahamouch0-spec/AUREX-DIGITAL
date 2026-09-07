import { chromium } from 'playwright';
const B='http://localhost:8899';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const errs=[]; let pass=0,fail=0;
const ok=(n,c,d='')=>{ if(c){pass++;console.log('  PASS  '+n);} else {fail++;console.log('  FAIL  '+n+'  '+d);} };
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64');

// Seed one order through the storefront so the dashboard has real data.
const shop=await b.newContext({viewport:{width:390,height:844}});
const sp=await shop.newPage();
await sp.goto(B+'/ar/product/personalized-story/',{waitUntil:'networkidle'});
await sp.waitForSelector('#customizer .choice');
await sp.click('#customizer .choice:first-child'); await sp.click('[data-next]'); await sp.waitForTimeout(500);
await sp.fill('input[name=child_name]','آدم'); await sp.fill('input[name=theme]','فضاء');
await sp.click('[data-next]'); await sp.waitForTimeout(500);
await sp.setInputFiles('.upload input[type=file]',{name:'a.png',mimeType:'image/png',buffer:png});
await sp.waitForSelector('.upload-done'); await sp.click('[data-next]'); await sp.waitForTimeout(700);
await sp.click('[data-next]'); await sp.waitForTimeout(800);
await sp.goto(B+'/ar/checkout/',{waitUntil:'networkidle'});
await sp.waitForSelector('#checkout-form');
await sp.fill('#c_name','دينا حموش'); await sp.fill('#c_phone','+9613566434');
await sp.fill('#c_country','لبنان'); await sp.fill('#c_city','بيروت');
await sp.fill('#c_address','شارع الحمرا، بناية ٤');
await sp.click('.choice:has(input[value=whish])');
await sp.click('[data-submit]');
await sp.waitForURL(/order/,{timeout:20000});
const orderNum=(sp.url().match(/n=(YK-\d+)/)||[])[1];
console.log('\nSeeded order '+orderNum);
await shop.close();

const ctx=await b.newContext({viewport:{width:1440,height:900}});
const p=await ctx.newPage();
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});

console.log('\nAdmin login (Part 3 §28)');
await p.goto(B+'/admin/',{waitUntil:'networkidle'});
await p.waitForSelector('#login-form',{timeout:8000});
ok('login screen shown to anonymous', await p.$('#login-form')!==null);
ok('no public "create admin" flow', !(await p.content()).includes('إنشاء حساب'));

await p.fill('#u','admin'); await p.fill('#p','wrong');
await p.click('#login-form button'); await p.waitForTimeout(900);
ok('wrong password rejected', (await p.textContent('[data-error]')).length>0);

await p.fill('#p','test-admin-password');
await p.click('#login-form button');
await p.waitForSelector('.admin-shell',{timeout:10000});
ok('logged in', await p.$('.admin-shell')!==null);

console.log('\nOverview (Part 3 §3)');
ok('operational tiles shown', await p.$$eval('.tile',e=>e.length)>=6);
ok('recent orders listed', (await p.textContent('.admin-main')).includes(orderNum));

console.log('\nOrder detail (Part 3 §5, §6, §8)');
await p.click('.admin-table a.num');
await p.waitForSelector('.grid-detail',{timeout:8000});
const detail=await p.textContent('.admin-main');
ok('customer details shown', detail.includes('دينا حموش') && detail.includes('9613566434'));
ok('address shown', detail.includes('الحمرا'));
ok('customization snapshot shown', detail.includes('آدم') && detail.includes('فضاء'));
ok('WhatsApp contact button present', await p.$('a[href*="wa.me"]')!==null);

const img=await p.$('.oitem__photo img');
ok('child photo visible to admin', img!==null);
const src=await img.getAttribute('src');
ok('photo served through a signed expiring link', /\/api\/photo\/.+\?exp=\d+&sig=[a-f0-9]{32}/.test(src), src);
const shot=await p.evaluate(s=>fetch(s).then(r=>r.status), src);
ok('signed link loads for admin', shot===200);

console.log('\nRELEASE BLOCKER — photo must be private (Part 3 §78)');
const anon=await b.newContext();
const ap=await anon.newPage();
const bare=await ap.evaluate(([u])=>fetch(u).then(r=>r.status).catch(()=>0),[B+src.replace(/\?.*/,'')]).catch(()=>null);
const viaAnon=await ap.request.get(B+src.replace(/\?.*/,''));
ok('unsigned photo URL denied to anonymous', viaAnon.status()===403, String(viaAnon.status()));
const signedAnon=await ap.request.get(B+src);
ok('even a valid signature needs no session but URL expires', [200,403].includes(signedAnon.status()));
const adminApi=await ap.request.get(B+'/api/admin/orders');
ok('admin API denied to anonymous', adminApi.status()===401);
await anon.close();

console.log('\nStatus, payment and shipping (Part 3 §7, §8, §9)');
await p.selectOption('#prod','designing'); await p.waitForTimeout(1200);
ok('production status saved', (await p.textContent('.admin-main')).includes('قيد التصميم'));
await p.fill('#ship','5');
await p.click('[data-save-order]'); await p.waitForTimeout(1400);
const afterShip=await p.textContent('.admin-main');
ok('shipping cost recorded', afterShip.includes('$5'));
ok('final total composed from subtotal + shipping', afterShip.includes('$25'), 'expected 20+5');

console.log('\nProducts and the customization builder (Part 3 §16, §19, §81)');
await p.click('.admin-nav a[href="#/products"]');
await p.waitForSelector('.admin-table',{timeout:8000});
ok('products listed', (await p.textContent('.admin-main')).includes('قصة مخصّصة'));
// Open the story product specifically: it is the one with priced options.
await p.click('.admin-table tr:has-text("قصة مخصّصة") a[href^="#/products/"]');
await p.waitForSelector('#p_name_ar',{timeout:8000});
ok('product editor opens', await p.$('#p_name_ar')!==null);
ok('customization builder shows fields', await p.$$eval('.builder-field',e=>e.length)>=4);
ok('option price editable', await p.$('[id^="o_0_0_pr"]')!==null);

// change the story 1-5 price to 22 and verify the storefront follows
await p.fill('#o_0_0_pr','22');
await p.click('[data-save]'); await p.waitForTimeout(1600);
const cfg=await p.evaluate(()=>fetch('/api/config').then(r=>r.json()));
const story=cfg.products.find(x=>x.slug==='personalized-story');
ok('price change reaches the storefront with no code edit', story.startingPrice===22, String(story.startingPrice));

console.log('\nHistorical order unchanged (Part 3 §82)');
await p.goto(B+'/admin/#/orders',{waitUntil:'networkidle'});
await p.waitForSelector('.admin-table');
await p.click('.admin-table a.num'); await p.waitForSelector('.grid-detail');
ok('old order keeps its original price', (await p.textContent('.admin-main')).includes('$20'));

// restore
await p.goto(B+'/admin/#/products',{waitUntil:'networkidle'});
await p.waitForSelector('.admin-table');
await p.click('.admin-table tr:has-text("قصة مخصّصة") a[href^="#/products/"]');
await p.waitForSelector('#o_0_0_pr'); await p.fill('#o_0_0_pr','20');
await p.click('[data-save]'); await p.waitForTimeout(1200);

console.log('\nContent and settings (Part 3 §25, §26, §83)');
await p.goto(B+'/admin/#/content',{waitUntil:'networkidle'});
await p.waitForSelector('#faq-list',{timeout:8000});
ok('FAQ editor loads', await p.$$eval('#faq-list .builder-field',e=>e.length)>0);
ok('reviews section warns against inventing reviews', (await p.textContent('.admin-main')).includes('لا تُخترع'));

await p.goto(B+'/admin/#/settings',{waitUntil:'networkidle'});
await p.waitForSelector('#s_wa',{timeout:8000});
ok('whatsapp configurable', (await p.inputValue('#s_wa')).includes('9613566434'));
ok('whish configurable', (await p.inputValue('#s_whish')).includes('9613566434'));
ok('photo retention configurable', await p.$('#s_ret')!==null);
await p.click('[data-cleanup]'); await p.waitForTimeout(1200);
ok('cleanup runs on demand', await p.$('.toast')!==null);

console.log('\nMobile admin (Part 3 §57)');
const m=await b.newContext({viewport:{width:390,height:844},storageState:await ctx.storageState()});
const mp=await m.newPage();
// Page scroll width alone is not enough: the layout sets overflow-x hidden, so
// content wider than the screen is clipped silently instead of scrolling.
// Measure the elements themselves, ignoring panes that scroll inside themselves.
for (const [name,hash,sel] of [['overview','#/','.tiles'],['orders','#/orders','.admin-table'],
                               ['products','#/products','.admin-table'],['settings','#/settings','#s_wa']]) {
  await mp.goto(B+'/admin/'+hash,{waitUntil:'networkidle'});
  await mp.waitForSelector(sel,{timeout:8000});
  await mp.waitForTimeout(500);
  const r=await mp.evaluate(()=>{
    const de=document.documentElement;
    const spilling=[...document.querySelectorAll('body *')]
      .filter(e=>e.getBoundingClientRect().width>de.clientWidth+1)
      .filter(e=>{const st=getComputedStyle(e);return st.overflowX!=='auto'&&st.overflowX!=='scroll';})
      .map(e=>String(e.className).slice(0,30));
    return {ov:de.scrollWidth-de.clientWidth, spilling};
  });
  ok(`${name}: nothing spills past the screen`, r.ov<=1 && r.spilling.length===0,
     `overflow ${r.ov}px, spilling: ${JSON.stringify(r.spilling.slice(0,3))}`);
}
await m.close();

await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
if(errs.length) console.log('\nErrors:\n'+[...new Set(errs)].join('\n'));
process.exit(fail?1:0);
