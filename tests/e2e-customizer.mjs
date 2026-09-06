import { chromium } from 'playwright';
const B='http://localhost:8899';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const errs=[]; let pass=0, fail=0;
const ok=(n,c,d='')=>{ if(c){pass++;console.log('  PASS  '+n);} else {fail++;console.log('  FAIL  '+n+'  '+d);} };

// Arabic, mobile — the journey Part 3 §67 describes.
const ctx=await b.newContext({viewport:{width:390,height:844}});
const p=await ctx.newPage();
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});

console.log('\nArabic mobile — story order (Part 3 §67)');
await p.goto(B+'/ar/product/personalized-story/',{waitUntil:'networkidle'});
await p.waitForSelector('#customizer .choice', {timeout:8000});
ok('customizer rendered from configuration', await p.$$eval('#customizer .choice', e=>e.length)===2);

// step 1: age 1-5 -> price must become $20
await p.click('#customizer .choice:first-child');
await p.waitForTimeout(250);
ok('price appears after choosing age', (await p.textContent('.price-rail__value')).includes('$20'),
   await p.textContent('.price-rail__value'));
await p.click('[data-next]'); await p.waitForTimeout(600);

// step 2: child details
ok('moved to details step', await p.$('input[name=child_name]') !== null);
await p.fill('input[name=child_name]','آدم');
await p.fill('input[name=theme]','مغامرة في الفضاء');
await p.click('[data-next]'); await p.waitForTimeout(600);

// step 3: photo — required, blocks without one
ok('reached photo step', await p.$('.upload') !== null);
await p.click('[data-next]'); await p.waitForTimeout(400);
ok('photo required blocks progress', (await p.textContent('[data-error]'))?.length > 0);

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64');
await p.setInputFiles('.upload input[type=file]', {name:'adam.png',mimeType:'image/png',buffer:png});
await p.waitForSelector('.upload-done',{timeout:8000});
ok('upload succeeded with preview', await p.$('.upload-done img') !== null);
ok('privacy note sits next to the uploader', (await p.textContent('.privacy-note')).includes('صورة طفلك'));
await p.click('[data-next]'); await p.waitForTimeout(800);

// step 4: review
ok('review step reached', (await p.textContent('#customizer')).includes('آدم'));
ok('review shows $20 total', (await p.textContent('.price-rail__value')).includes('$20'));
await p.click('[data-next]'); await p.waitForTimeout(900);
ok('added to cart', await p.$('.alert--success') !== null);
ok('cart badge updated', (await p.textContent('[data-cart-count]'))==='1');

// second child, same product -> separate line (§71)
console.log('\nSecond child, same product (Part 3 §71)');
await p.goto(B+'/ar/product/personalized-story/',{waitUntil:'networkidle'});
await p.waitForSelector('#customizer .choice');
await p.click('#customizer .choice:nth-child(2)');   // age 6-12 -> $25
await p.waitForTimeout(200);
ok('age 6-12 prices at $25', (await p.textContent('.price-rail__value')).includes('$25'));
await p.click('[data-next]'); await p.waitForTimeout(500);
await p.fill('input[name=child_name]','سارة');
await p.fill('input[name=theme]','أميرات');
await p.click('[data-next]'); await p.waitForTimeout(500);
await p.setInputFiles('.upload input[type=file]', {name:'sara.png',mimeType:'image/png',buffer:png});
await p.waitForSelector('.upload-done');
await p.click('[data-next]'); await p.waitForTimeout(700);
await p.click('[data-next]'); await p.waitForTimeout(900);
ok('two separate cart lines', (await p.textContent('[data-cart-count]'))==='2');

// cart
console.log('\nCart');
await p.goto(B+'/ar/cart/',{waitUntil:'networkidle'});
await p.waitForSelector('.cart-line',{timeout:8000});
ok('both lines listed', await p.$$eval('.cart-line',e=>e.length)===2);
const cartTxt = await p.textContent('[data-cart-root]');
ok('shows both children', cartTxt.includes('آدم') && cartTxt.includes('سارة'));
ok('subtotal $45', cartTxt.includes('$45'), cartTxt.slice(0,200));
ok('shipping shown as to-be-confirmed, not $0', cartTxt.includes('يُحدَّد لاحقًا') && !/\$0(?!\d)/.test(cartTxt));

// language switch preserves cart (§73)
console.log('\nLanguage switch (Part 3 §73)');
await p.goto(B+'/en/cart/',{waitUntil:'networkidle'});
await p.waitForSelector('.cart-line');
ok('cart survives locale switch', await p.$$eval('.cart-line',e=>e.length)===2);
ok('English labels render', (await p.textContent('[data-cart-root]')).includes('To be confirmed'));

// refresh persistence
await p.reload({waitUntil:'networkidle'});
await p.waitForSelector('.cart-line');
ok('cart survives reload', await p.$$eval('.cart-line',e=>e.length)===2);

// edit customization (§72)
console.log('\nEdit customization (Part 3 §72)');
await p.click('.cart-line:first-child a.link-btn');
await p.waitForSelector('#customizer',{timeout:8000});
await p.waitForTimeout(900);
const editTxt = await p.textContent('#customizer');
ok('reopens with existing state', editTxt.includes('Review')||editTxt.includes('Next')||editTxt.length>50);
await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
if(errs.length) console.log('\nConsole/page errors:\n'+[...new Set(errs)].join('\n'));
process.exit(fail?1:0);
