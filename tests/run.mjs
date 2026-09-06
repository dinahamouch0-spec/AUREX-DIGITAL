#!/usr/bin/env node
// Acceptance tests for the commerce engine and admin API.
// Covers Part 2 §58 and Part 3 §67-§83. Runs the router directly.

process.env.YK_DATA_DIR = process.env.YK_DATA_DIR || '.data-test';
process.env.ADMIN_PASSWORD = 'test-admin-password';
process.env.SESSION_SECRET = 'test-signing-secret';

import { rm } from 'node:fs/promises';
await rm(process.env.YK_DATA_DIR, { recursive: true, force: true });

const { router } = await import('../api/router.js');

let pass = 0, fail = 0;
const failures = [];
function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; failures.push(`${name} ${detail}`); console.log(`  FAIL  ${name}  ${detail}`); }
}
const eq = (name, got, want) =>
  check(name, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
const section = (t) => console.log(`\n${t}`);

const BASE = 'http://localhost/api/';
let cookie = '';

async function api(path, { method = 'GET', body, form, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (cookie) init.headers.cookie = cookie;
  if (form) init.body = form;
  else if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers['content-type'] = 'application/json';
  }
  const res = await router(new Request(BASE + path, init));
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const ct = res.headers.get('content-type') || '';
  const payload = ct.includes('json') ? await res.json() : await res.arrayBuffer();
  return { status: res.status, body: payload, headers: res.headers };
}

/** A real 1x1 PNG, so magic-byte sniffing sees genuine image bytes. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64');

async function uploadPhoto(bytes = PNG, filename = 'child.png') {
  const form = new FormData();
  form.append('photo', new Blob([bytes]), filename);
  const r = await api('upload', { method: 'POST', form });
  return r;
}

/* ===================================================================== */
section('Part 2 §58 - pricing through the server');

const cfg = await api('config');
check('config returns catalog', cfg.body.products.length === 3 && cfg.body.categories.length === 3);
eq('whatsapp configured', cfg.body.settings.whatsapp, '9613566434');

const price = async (slug, answers, quantity) =>
  (await api('price', { method: 'POST', body: { productSlug: slug, answers, quantity } })).body.lineTotal;

eq('story age 1-5 = $20',  await price('personalized-story', { age_group: 'age_1_5' }, 1), 20);
eq('story age 6-12 = $25', await price('personalized-story', { age_group: 'age_6_12' }, 1), 25);
eq('stickers 1 pack / 2 designs = $3',    await price('personalized-stickers', { design_mode: 'two_designs' }, 1), 3);
eq('stickers 1 pack / individual = $5',   await price('personalized-stickers', { design_mode: 'individual' }, 1), 5);
eq('stickers 2 packs / 2 designs = $6',   await price('personalized-stickers', { design_mode: 'two_designs' }, 2), 6);
eq('stickers 2 packs / individual = $10', await price('personalized-stickers', { design_mode: 'individual' }, 2), 10);
eq('notebook x1 = $2.50', await price('personalized-notebook-cover', {}, 1), 2.5);
eq('notebook x4 = $10',   await price('personalized-notebook-cover', {}, 4), 10);

/* ===================================================================== */
section('Upload validation (Part 2 §14 / Part 3 §32)');

const up1 = await uploadPhoto();
check('valid png accepted', up1.status === 200 && Boolean(up1.body.token));
eq('sniffed as png', up1.body.mime, 'image/png');

const php = await uploadPhoto(Buffer.from('<?php system($_GET[0]); ?>' + ' '.repeat(40)), 'evil.jpg');
eq('php renamed .jpg rejected', php.status, 415);

const svg = await uploadPhoto(Buffer.from('<svg onload=alert(1)></svg>' + ' '.repeat(40)), 'x.png');
eq('svg rejected', svg.status, 415);

const tooBig = await uploadPhoto(Buffer.concat([PNG, Buffer.alloc(13 * 1024 * 1024)]), 'big.png');
eq('oversize rejected', tooBig.status, 413);

const noPhoto = await api('upload', { method: 'POST', form: new FormData() });
eq('missing file rejected', noPhoto.status, 400);

/* ===================================================================== */
section('Cart validation (Part 2 §22, §44, §46)');

const photoA = (await uploadPhoto()).body.token;
const photoB = (await uploadPhoto()).body.token;

const lineStory = (token, child, age) => ({
  lineId: `l_${child}`, productSlug: 'personalized-story',
  answers: { age_group: age, child_name: child, theme: 'Space adventure' },
  quantity: 1, uploadToken: token, displayPrice: age === 'age_1_5' ? 20 : 25,
});

const cartOk = await api('cart/validate', { method: 'POST',
  body: { items: [lineStory(photoA, 'Ahmad', 'age_1_5'), lineStory(photoB, 'Sara', 'age_6_12')], locale: 'en' } });
eq('two children stay separate lines', cartOk.body.lines.length, 2);
eq('subtotal 20 + 25', cartOk.body.subtotal, 45);
eq('no issues', cartOk.body.issues.length, 0);

const lying = await api('cart/validate', { method: 'POST',
  body: { items: [{ ...lineStory(photoA, 'Ahmad', 'age_6_12'), displayPrice: 5 }], locale: 'en' } });
eq('client price manipulation caught', lying.body.issues[0].code, 'price_changed');
eq('server price is authoritative', lying.body.lines[0].lineTotal, 25);

const noPhotoLine = await api('cart/validate', { method: 'POST',
  body: { items: [{ ...lineStory(photoA, 'X', 'age_1_5'), uploadToken: '' }], locale: 'en' } });
eq('missing required photo blocked', noPhotoLine.body.issues[0].code, 'upload_missing');

const missingField = await api('cart/validate', { method: 'POST',
  body: { items: [{ lineId: 'm', productSlug: 'personalized-story',
                    answers: { age_group: 'age_1_5' }, quantity: 1, uploadToken: photoA }], locale: 'en' } });
eq('missing required fields blocked', missingField.body.issues[0].code, 'missing_required');

const badQty = await api('cart/validate', { method: 'POST',
  body: { items: [{ lineId: 'q', productSlug: 'personalized-notebook-cover',
                    answers: { child_name: 'A', theme: 'Cats' }, quantity: -5, uploadToken: photoB }], locale: 'en' } });
eq('negative quantity clamped', badQty.body.lines[0].quantity, 1);

/* ===================================================================== */
section('Order creation (Part 2 §30, §31, §32, §43)');

const customer = {
  name: 'Dina Hamouch', phone: '+9613566434', email: 'test@example.com',
  country: 'Lebanon', city: 'Beirut', address: 'Hamra street, building 4',
  addressNotes: 'Third floor', paymentMethod: 'whish',
};

const idem = 'idem-key-001';
const orderPayload = {
  customer, locale: 'en', idempotencyKey: idem,
  items: [lineStory(photoA, 'Ahmad', 'age_1_5'), lineStory(photoB, 'Sara', 'age_6_12')],
};

const created = await api('order', { method: 'POST', body: orderPayload });
eq('order created', created.status, 201);
check('order number looks like YK-####', /^YK-\d+$/.test(created.body.orderNumber), created.body.orderNumber);
check('confirmation token issued', typeof created.body.token === 'string' && created.body.token.length >= 24);

const replay = await api('order', { method: 'POST', body: orderPayload });
eq('duplicate submit returns same order', replay.body.orderNumber, created.body.orderNumber);
eq('duplicate submit flagged as replay', replay.body.replayed, true);

const badCustomer = await api('order', { method: 'POST',
  body: { customer: { name: '', phone: 'x', paymentMethod: 'bitcoin' }, items: orderPayload.items,
          idempotencyKey: 'idem-bad' } });
eq('invalid customer rejected', badCustomer.status, 422);
check('field level errors returned', Boolean(badCustomer.body.errors.name && badCustomer.body.errors.paymentMethod));

/* ===================================================================== */
section('Order confirmation privacy (Part 2 §50 / Part 3 §51)');

const num = created.body.orderNumber;
const tok = created.body.token;

const guess = await api(`order/${num}`);
eq('order number alone is not authorization', guess.status, 404);

const wrongTok = await api(`order/${num}?token=${'0'.repeat(48)}`);
eq('wrong token rejected', wrongTok.status, 404);

const conf = await api(`order/${num}?token=${tok}`);
eq('correct token returns order', conf.status, 200);
eq('shipping is unknown, not zero', conf.body.order.shippingCost, null);
eq('final total unknown until shipping set', conf.body.order.finalTotal, null);
eq('products subtotal correct', conf.body.order.productsSubtotal, 45);
check('photo bytes not exposed', JSON.stringify(conf.body).includes('uploadToken') === false);
check('two personalized lines preserved', conf.body.order.items.length === 2);
eq('child names preserved', conf.body.order.items.map(i => i.childName).sort(), ['Ahmad', 'Sara']);

/* ===================================================================== */
section('Private photo access (Part 3 §78 - RELEASE BLOCKER)');

const unsigned = await api(`photo/${photoA}`);
eq('unsigned photo request denied', unsigned.status, 403);

const forged = await api(`photo/${photoA}?exp=${Math.floor(Date.now()/1000)+300}&sig=${'a'.repeat(32)}`);
eq('forged signature denied', forged.status, 403);

const expired = await api(`photo/${photoA}?exp=${Math.floor(Date.now()/1000)-60}&sig=${'a'.repeat(32)}`);
eq('expired link denied', expired.status, 403);

/* ===================================================================== */
section('Admin authentication (Part 3 §28, §29, §48)');

const anonOrders = await api('admin/orders');
eq('admin API closed to anonymous', anonOrders.status, 401);

const anonPatch = await api(`admin/orders/x`, { method: 'PATCH', body: { productionStatus: 'completed' } });
eq('anonymous cannot change status', anonPatch.status, 401);

const badLogin = await api('admin/login', { method: 'POST', body: { username: 'admin', password: 'wrong' } });
eq('wrong password rejected', badLogin.status, 401);

const goodLogin = await api('admin/login', { method: 'POST',
  body: { username: 'admin', password: 'test-admin-password' } });
eq('correct password accepted', goodLogin.status, 200);
check('session cookie is HttpOnly + SameSite',
  /HttpOnly/.test(goodLogin.headers.get('set-cookie')) && /SameSite=Strict/.test(goodLogin.headers.get('set-cookie')));

const me = await api('admin/me');
eq('session recognised', me.body.authenticated, true);

/* ===================================================================== */
section('Admin order operations (Part 3 §5, §8, §9)');

const list = await api('admin/orders');
eq('orders visible to admin', list.body.orders.length, 1);
const orderId = list.body.orders[0].id;

const detail = await api(`admin/orders/${orderId}`);
eq('order detail loads', detail.status, 200);
check('photo link is signed and expiring',
  /\/api\/photo\/.+\?exp=\d+&sig=[a-f0-9]{32}/.test(detail.body.order.items[0].photo.url),
  detail.body.order.items[0].photo?.url);
check('confirmation token not leaked to admin UI', detail.body.order.confirmToken === undefined);

const signedUrl = detail.body.order.items[0].photo.url.replace('/api/', '');
const signedFetch = await api(signedUrl);
check('signed link serves the image', signedFetch.status === 200 && signedFetch.body.byteLength === PNG.length);

const ship = await api(`admin/orders/${orderId}`, { method: 'PATCH', body: { shippingCost: 5 } });
eq('shipping cost recorded', ship.body.order.shippingCost, 5);
eq('final total composed', ship.body.order.finalTotal, 50);
eq('product subtotal unchanged', ship.body.order.productsSubtotal, 45);

const badShip = await api(`admin/orders/${orderId}`, { method: 'PATCH', body: { shippingCost: -10 } });
eq('negative shipping rejected', badShip.status, 422);

const payd = await api(`admin/orders/${orderId}`, { method: 'PATCH', body: { paymentStatus: 'confirmed' } });
eq('payment status updated', payd.body.order.paymentStatus, 'confirmed');

const badStatus = await api(`admin/orders/${orderId}`, { method: 'PATCH', body: { productionStatus: 'teleported' } });
eq('unknown status ignored', badStatus.body.order.productionStatus, 'new');

/* ===================================================================== */
section('Historical snapshots (Part 2 §35 / Part 3 §82)');

const prods = await api('admin/products');
const story = prods.body.products.find((p) => p.slug === 'personalized-story');
story.fields.find((f) => f.key === 'age_group').options.find((o) => o.key === 'age_1_5').priceOverride = 99;
const saved = await api('admin/products', { method: 'POST', body: { product: story } });
eq('price change saved', saved.status, 200);

eq('new orders use the new price', await price('personalized-story', { age_group: 'age_1_5' }, 1), 99);

const afterChange = await api(`admin/orders/${orderId}`);
const ahmad = afterChange.body.order.items.find((i) => i.childName === 'Ahmad');
eq('historical order price unchanged', ahmad.unitPrice, 20);
eq('historical subtotal unchanged', afterChange.body.order.productsSubtotal, 45);
eq('historical option label preserved',
   ahmad.fields.find((f) => f.key === 'age_group').options[0].label.en, '1–5 years');

// restore
story.fields.find((f) => f.key === 'age_group').options.find((o) => o.key === 'age_1_5').priceOverride = 20;
await api('admin/products', { method: 'POST', body: { product: story } });

/* ===================================================================== */
section('Stale cart and unavailable products (Part 3 §74, §75)');

const st = (await api('admin/products')).body.products.find((p) => p.slug === 'personalized-stickers');
await api('admin/products', { method: 'POST', body: { product: { ...st, status: 'draft' } } });

const photoC = (await uploadPhoto()).body.token;
const mixed = await api('cart/validate', { method: 'POST', body: { locale: 'en', items: [
  lineStory(photoA, 'Ahmad', 'age_1_5'),
  { lineId: 'st1', productSlug: 'personalized-stickers',
    answers: { design_mode: 'individual', child_name: 'Sara', theme: 'Cats' },
    quantity: 1, uploadToken: photoC, displayPrice: 5 },
] } });
eq('unavailable product flagged', mixed.body.issues[0].code, 'product_unavailable');
eq('rest of cart preserved', mixed.body.lines.length, 1);

const blocked = await api('order', { method: 'POST', body: { customer, locale: 'en',
  idempotencyKey: 'idem-blocked', items: [
    { lineId: 'st1', productSlug: 'personalized-stickers',
      answers: { design_mode: 'individual', child_name: 'Sara', theme: 'Cats' },
      quantity: 1, uploadToken: photoC, displayPrice: 5 }] } });
eq('checkout blocked for unavailable item', blocked.status, 409);
await api('admin/products', { method: 'POST', body: { product: { ...st, status: 'active' } } });

/* ===================================================================== */
section('Product builder guardrails (Part 3 §19, §81)');

const invalid = await api('admin/products', { method: 'POST', body: { product: {
  slug: '', pricing: { type: 'nonsense' }, t: { ar: {}, en: {} } } } });
eq('invalid product blocked', invalid.status, 422);
check('problems are specific, not "invalid configuration"',
  invalid.body.problems.includes('slug_required') &&
  invalid.body.problems.includes('category_required') &&
  invalid.body.problems.includes('pricing_type_invalid'), JSON.stringify(invalid.body.problems));

// A brand new product with a different field set, created without code changes.
const custom = {
  slug: 'test-mug', categoryId: 'cat_stories', status: 'active', featured: false, asset: 'stories',
  pricing: { type: 'unit', basePrice: 7.5 },
  quantity: { min: 1, max: 10, step: 1, t: { ar: 'كوب', en: 'mug' } },
  t: { ar: { name: 'كوب مخصّص', short: 'كوب', desc: 'كوب' },
       en: { name: 'Custom mug', short: 'A mug', desc: 'A mug' } },
  fields: [
    { key: 'child_name', type: 'short_text', required: true, active: true, order: 1,
      t: { ar: { label: 'الاسم', help: '', placeholder: '' }, en: { label: 'Name', help: '', placeholder: '' } } },
    { key: 'colour', type: 'radio', required: true, active: true, order: 2,
      t: { ar: { label: 'اللون', help: '', placeholder: '' }, en: { label: 'Colour', help: '', placeholder: '' } },
      options: [
        { key: 'red',  sortOrder: 1, active: true, priceModifier: 0,   t: { ar: { label: 'أحمر' }, en: { label: 'Red' } } },
        { key: 'gold', sortOrder: 2, active: true, priceModifier: 2.5, t: { ar: { label: 'ذهبي' }, en: { label: 'Gold' } } },
      ] },
  ],
};
const madeNew = await api('admin/products', { method: 'POST', body: { product: custom } });
eq('new product with different fields accepted', madeNew.status, 200);
eq('new product priced by the same engine', await price('test-mug', { colour: 'red' }, 2), 15);
eq('price modifier applied', await price('test-mug', { colour: 'gold' }, 2), 20);
await api(`admin/products/${madeNew.body.product.id}`, { method: 'DELETE' });
const archived = (await api('admin/products')).body.products.find(p => p.slug === 'test-mug');
eq('delete archives rather than destroys', archived.status, 'archived');

/* ===================================================================== */
section('Content management (Part 3 §83)');

const faqPost = await api('admin/content/faqs', { method: 'POST', body: { items: [
  { id: 'x', published: true, sortOrder: 1, ar: { q: 'س', a: 'ج' }, en: { q: 'Q', a: 'A' } }] } });
eq('faq saved', faqPost.status, 200);
eq('faq read back', (await api('admin/content/faqs')).body.items.length, 1);

const rev = await api('admin/content/reviews', { method: 'POST', body: { items: [
  { id: 'r1', published: true, rating: 5, ar: { text: 'ممتاز', author: 'أم آدم' }, en: { text: 'Excellent', author: 'Adam’s mother' } }] } });
eq('review saved', rev.status, 200);

/* ===================================================================== */
section('Settings (Part 3 §26)');

const setPost = await api('admin/settings', { method: 'POST', body: { settings: {
  whatsapp: '9613566434', whish: '+9613566434', instagram: 'https://instagram.com/ya7kayti',
  email: 'hello@ya7kayti.com', productionMinDays: 2, productionMaxDays: 5,
  photoRetentionHours: 24, abandonedUploadHours: 48, maxUploadMb: 12 } } });
eq('settings saved', setPost.status, 200);
eq('whish number configurable', setPost.body.settings.whish, '+9613566434');
eq('public config reflects settings', (await api('config')).body.settings.instagram, 'https://instagram.com/ya7kayti');

/* ===================================================================== */
section('Photo retention (Part 3 §34, §35, §79, §80)');

const complete = await api(`admin/orders/${orderId}`, { method: 'PATCH', body: { productionStatus: 'completed' } });
eq('order completed', complete.body.order.productionStatus, 'completed');
check('deletion scheduled on completion', Boolean(complete.body.order.photoDeletionScheduledFor));

// Nothing is deleted while still inside the grace period.
const early = await api('admin/cleanup', { method: 'POST' });
eq('grace period respected', early.body.completedDeleted, 0);

// Wind the clock back past the retention window and past the abandon window.
const { collection } = await import('../api/_lib/store.js');
const ordersCol = collection('orders');
const o = await ordersCol.get(orderId);
await ordersCol.set(orderId, { ...o, photoDeletionScheduledFor: new Date(Date.now() - 1000).toISOString() });

const uploadsCol = collection('uploads');
const old = new Date(Date.now() - 72 * 3600_000).toISOString();
const cRec = await uploadsCol.get(photoC);
await uploadsCol.set(photoC, { ...cRec, createdAt: old });

const cleaned = await api('admin/cleanup', { method: 'POST' });
check('completed order photos deleted', cleaned.body.completedDeleted === 2, JSON.stringify(cleaned.body));
check('abandoned upload deleted', cleaned.body.abandonedDeleted >= 1, JSON.stringify(cleaned.body));

const afterDelete = await api(`admin/orders/${orderId}`);
eq('order still exists after photo deletion', afterDelete.status, 200);
eq('order number preserved', afterDelete.body.order.orderNumber, num);
eq('price history preserved', afterDelete.body.order.productsSubtotal, 45);
eq('photo marked deleted, not broken', afterDelete.body.order.items[0].photo.state, 'deleted');
check('no photo url offered once deleted', !afterDelete.body.order.items[0].photo.url);

const goneSign = await import('../api/_lib/auth.js');
const s2 = goneSign.signPhoto(photoA);
const goneFetch = await api(`photo/${photoA}?exp=${s2.exp}&sig=${s2.sig}`);
eq('deleted photo unreachable even with a valid signature', goneFetch.status, 404);

/* ===================================================================== */
section('Audit trail (Part 3 §11, §44)');

const auditRes = await api('admin/audit');
const events = auditRes.body.events.map((e) => e.event);
for (const e of ['order_created', 'shipping_cost_set', 'payment_status_changed',
                 'production_status_changed', 'photo_deletion_scheduled', 'photo_deleted', 'admin_login']) {
  check(`logged: ${e}`, events.includes(e));
}
check('audit never records image bytes or signatures',
  !JSON.stringify(auditRes.body).match(/iVBORw0|sig=|passwordHash/));

/* ===================================================================== */
section('Logout');
const out = await api('admin/logout', { method: 'POST' });
eq('logout ok', out.status, 200);
cookie = '';
eq('session no longer valid', (await api('admin/orders')).status, 401);

/* ===================================================================== */
console.log(`\n${'='.repeat(58)}`);
console.log(`  ${pass} passed, ${fail} failed`);
if (fail) { console.log('\nFailures:'); failures.forEach((f) => console.log('  - ' + f)); }
console.log('='.repeat(58));
process.exit(fail ? 1 : 0);
