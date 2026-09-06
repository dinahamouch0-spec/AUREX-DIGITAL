import { chromium } from 'playwright';
const B='http://localhost:8899';
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const errs=[]; let pass=0,fail=0;
const ok=(n,c,d='')=>{ if(c){pass++;console.log('  PASS  '+n);} else {fail++;console.log('  FAIL  '+n+'  '+d);} };
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==','base64');

const ctx=await b.newContext({viewport:{width:390,height:844}});
const p=await ctx.newPage();
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text());});

// Build one notebook order (unit pricing) then check out.
console.log('\nNotebook unit pricing (Part 3 §70)');
await p.goto(B+'/en/product/personalized-notebook-cover/',{waitUntil:'networkidle'});
await p.waitForSelector('#customizer input[name=child_name]',{timeout:8000});
await p.fill('input[name=child_name]','Eva');
await p.fill('input[name=theme]','Unicorns');
await p.click('[data-next]'); await p.waitForTimeout(600);
await p.setInputFiles('.upload input[type=file]',{name:'eva.png',mimeType:'image/png',buffer:png});
await p.waitForSelector('.upload-done');
// quantity stepper appears on the last input step
const qty = await p.$('[data-qty-input]');
if (qty){ await p.click('[data-qty="1"]'); await p.click('[data-qty="1"]'); await p.click('[data-qty="1"]'); }
await p.waitForTimeout(300);
const railTxt = await p.textContent('.price-rail__value');
ok('4 notebooks = $10', railTxt.includes('$10'), railTxt);
await p.click('[data-next]'); await p.waitForTimeout(700);
await p.click('[data-next]'); await p.waitForTimeout(900);
ok('added to cart', await p.$('.alert--success')!==null);

console.log('\nCheckout (Part 2 §23-30)');
await p.goto(B+'/en/checkout/',{waitUntil:'networkidle'});
await p.waitForSelector('#checkout-form',{timeout:8000});
ok('guest checkout, no account needed', (await p.$('input[name=password]'))===null);
ok('COD and Whish offered', (await p.textContent('#checkout-form')).includes('Whish'));
ok('whish number shown', (await p.textContent('#checkout-form')).includes('9613566434'));

// submit empty -> field level errors, not just a banner
await p.click('[data-submit]'); await p.waitForTimeout(400);
const errCount = await p.$$eval('[data-error]', els=>els.filter(e=>e.textContent.trim()).length);
ok('per-field validation errors shown', errCount>=5, 'count='+errCount);

await p.fill('#c_name','Dina Hamouch');
await p.fill('#c_phone','+9613566434');
await p.fill('#c_country','Lebanon');
await p.fill('#c_city','Beirut');
await p.fill('#c_address','Hamra street, building 4');
await p.click('.choice:has(input[value=whish])');
await p.waitForTimeout(200);

// double-click Place Order to prove idempotency (§31)
await p.click('[data-submit]');
await p.click('[data-submit]').catch(()=>{});
await p.waitForURL(/\/order\//,{timeout:15000});
ok('redirected to confirmation', /\/en\/order\//.test(p.url()));

await p.waitForSelector('[data-confirm-root] h1',{timeout:8000});
const conf = await p.textContent('[data-confirm-root]');
const num = (p.url().match(/n=(YK-\d+)/)||[])[1];
ok('order number issued', /^YK-\d+$/.test(num||''), num);
ok('confirmation shows order number', conf.includes(num));
ok('shipping to be confirmed on confirmation', conf.includes('To be confirmed'));
ok('payment method shown', conf.includes('Whish'));
const waHref = await p.getAttribute('[data-confirm-root] a[href*="wa.me"]','href');
ok('WhatsApp handoff prefilled with order number', waHref && decodeURIComponent(waHref).includes(num), waHref);
ok('WhatsApp uses the configured number', waHref && waHref.includes('9613566434'));
ok('cart cleared after order', (await p.evaluate(()=>JSON.parse(localStorage.getItem('yk_cart')||'{"items":[]}').items.length))===0);

// only one order created despite double click
const r = await fetch(B+'/api/config'); // warm
console.log('\nDuplicate protection (Part 3 §76)');
const login = await fetch(B+'/api/admin/login',{method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({username:'admin',password:'test-admin-password'})});
const cookie = login.headers.get('set-cookie').split(';')[0];
const orders = await (await fetch(B+'/api/admin/orders',{headers:{cookie}})).json();
const matching = orders.orders.filter(o=>o.orderNumber===num);
ok('exactly one order for that number', matching.length===1, 'found '+matching.length);
ok('order total is $10', matching[0]?.productsSubtotal===10, String(matching[0]?.productsSubtotal));

// guessing the order number without a token must fail (§51)
const guess = await fetch(B+`/api/order/${num}`);
ok('order number alone gives no access', guess.status===404);

await b.close();
console.log(`\n  ${pass} passed, ${fail} failed`);
if(errs.length) console.log('\nErrors:\n'+[...new Set(errs)].join('\n'));
process.exit(fail?1:0);
