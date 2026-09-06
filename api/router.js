// HTTP API. One router shared by the Netlify function and the local dev
// server, so what is tested locally is exactly what ships.

import { db, getSettings, saveSettings, ensureSeeded, allProducts, allCategories,
         listOrders, getOrder, audit, orderTimeline } from './_lib/db.js';
import { validateCart, createOrder, publicOrder } from './_lib/orders.js';
import { unitPrice, lineTotal, clampQuantity, startingPrice } from '../src/lib/pricing.js';
import { clean, cleanMultiline, sniffImage, randomKey, validateCustomer } from './_lib/validate.js';
import { login, logout, requireAdmin, sessionFrom, sessionCookie, clearCookie,
         ensureAdmin, loginLocked, signPhoto, verifyPhotoSignature, json } from './_lib/auth.js';
import { runRetention } from './_lib/retention.js';
import { notifyNewOrder, notifyCustomer } from './_lib/mail.js';

const PRODUCTION_STATUSES = ['new', 'designing', 'waiting_approval', 'revision_requested',
                             'approved', 'printing', 'ready', 'shipped', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'pending_verification', 'confirmed', 'cod', 'failed'];

/** Body parser that never throws on malformed input. */
async function body(request) {
  try { return await request.json(); } catch { return {}; }
}

export async function router(request) {
  const url = new URL(request.url);
  let path = url.pathname.replace(/^\/api\/?/, '').replace(/\/$/, '');
  const method = request.method.toUpperCase();

  try {
    await ensureSeeded();

    /* =============================== PUBLIC =============================== */

    // Storefront bootstrap: settings plus the catalog as the customer sees it.
    if (path === 'config' && method === 'GET') {
      const s = await getSettings();
      const products = (await allProducts()).filter((p) => p.status === 'active');
      const categories = (await allCategories()).filter((c) => c.status === 'active');
      return json({
        settings: {
          businessName: s.businessName, whatsapp: s.whatsapp, whish: s.whish,
          instagram: s.instagram, currency: s.currency,
          productionMinDays: s.productionMinDays, productionMaxDays: s.productionMaxDays,
          maxUploadMb: s.maxUploadMb,
        },
        categories,
        products: products.map((p) => ({ ...p, startingPrice: startingPrice(p) })),
      });
    }

    // Authoritative price for one configuration. The customizer displays its
    // own instant estimate; this is what the server actually believes. §6
    if (path === 'price' && method === 'POST') {
      const b = await body(request);
      const product = (await allProducts()).find((p) => p.slug === b.productSlug && p.status === 'active');
      if (!product) return json({ error: 'product_unavailable' }, 404);
      const qty = clampQuantity(product, b.quantity);
      return json({
        unitPrice: unitPrice(product, b.answers || {}),
        lineTotal: lineTotal(product, b.answers || {}, qty),
        quantity: qty,
      });
    }

    if (path === 'cart/validate' && method === 'POST') {
      const b = await body(request);
      const r = await validateCart(b.items || [], b.locale === 'en' ? 'en' : 'ar');
      return json({
        subtotal: r.subtotal,
        issues: r.issues,
        lines: r.lines.map((l) => ({
          lineId: l.lineId, productSlug: l.product.slug,
          unitPrice: l.unitPrice, lineTotal: l.lineTotal, quantity: l.quantity,
        })),
      });
    }

    // Private upload. Stored in the private blob store under a random key;
    // no public URL exists for it at any point. §14, Part 3 §30/§32
    if (path === 'upload' && method === 'POST') {
      const s = await getSettings();
      const maxBytes = (s.maxUploadMb || 12) * 1024 * 1024;

      let file = null;
      try {
        const form = await request.formData();
        file = form.get('photo');
      } catch { return json({ error: 'bad_request' }, 400); }
      if (!file || typeof file.arrayBuffer !== 'function') return json({ error: 'no_file' }, 400);
      if (file.size > maxBytes) return json({ error: 'too_large', maxMb: s.maxUploadMb }, 413);

      const buf = Buffer.from(await file.arrayBuffer());
      if (buf.length > maxBytes) return json({ error: 'too_large', maxMb: s.maxUploadMb }, 413);

      const kind = sniffImage(buf);
      if (!kind) return json({ error: 'unsupported_type' }, 415);

      const token = randomKey(24);
      const storageKey = `${token}.${kind.ext}`;
      await db.files.put(storageKey, buf, { mime: kind.mime });
      await db.uploads.set(token, {
        token, storageKey, mime: kind.mime, bytes: buf.length,
        state: 'temporary', createdAt: new Date().toISOString(),
        orderId: null, lineId: null,
      });
      await audit('upload_created', { token, bytes: buf.length, mime: kind.mime }, 'customer');
      // The token is a handle, not a URL. It cannot be used to fetch the image.
      return json({ token, mime: kind.mime, bytes: buf.length });
    }

    if (path.startsWith('upload/') && method === 'DELETE') {
      const token = clean(path.split('/')[1], 96);
      const rec = await db.uploads.get(token);
      // Only an unattached upload may be removed by the customer.
      if (rec && rec.state === 'temporary') {
        await db.files.del(rec.storageKey);
        await db.uploads.set(token, { ...rec, state: 'deleted', deletedAt: new Date().toISOString() });
        await audit('upload_deleted', { token }, 'customer');
      }
      return json({ ok: true });
    }

    if (path === 'order' && method === 'POST') {
      const b = await body(request);
      const c = validateCustomer(b.customer || {});
      if (!c.ok) return json({ error: 'invalid_customer', errors: c.errors }, 422);

      const result = await createOrder({
        customer: c.value,
        items: b.items || [],
        locale: b.locale === 'en' ? 'en' : 'ar',
        idempotencyKey: b.idempotencyKey,
      });

      if (result.error) return json({ error: result.error, issues: result.issues }, 409);

      // The order is already stored. Notifications are best-effort and are
      // deliberately not awaited into the response. Part 3 §43.
      if (!result.replayed) {
        const origin = new URL(request.url).origin;
        Promise.allSettled([
          notifyNewOrder(result.order, origin),
          notifyCustomer(result.order),
        ]).catch(() => {});
      }

      return json({
        orderNumber: result.order.orderNumber,
        token: result.order.confirmToken,
        replayed: result.replayed,
      }, result.replayed ? 200 : 201);
    }

    // Confirmation. The order number alone proves nothing: the token does. §51
    if (path.startsWith('order/') && method === 'GET') {
      const number = clean(decodeURIComponent(path.split('/')[1]), 32);
      const token = clean(url.searchParams.get('token'), 96);
      const idx = await db.orderIndex.get(number);
      if (!idx || !token || token !== idx.token) return json({ error: 'not_found' }, 404);
      const order = await getOrder(idx.id);
      if (!order) return json({ error: 'not_found' }, 404);
      return json({ order: publicOrder(order) });
    }

    // Signed, short-lived photo delivery. Used by the admin UI as an <img> src.
    if (path.startsWith('photo/') && method === 'GET') {
      const token = clean(path.split('/')[1], 96);
      const exp = url.searchParams.get('exp');
      const sig = url.searchParams.get('sig');
      if (!verifyPhotoSignature(token, exp, sig)) return json({ error: 'forbidden' }, 403);
      const rec = await db.uploads.get(token);
      if (!rec || rec.state === 'deleted') return json({ error: 'not_found' }, 404);
      const bytes = await db.files.get(rec.storageKey);
      if (!bytes) return json({ error: 'not_found' }, 404);
      return new Response(bytes, {
        headers: {
          'content-type': rec.mime,
          'cache-control': 'private, no-store',
          'content-disposition': 'inline',
          'x-content-type-options': 'nosniff',
          'x-robots-tag': 'noindex, nofollow',
        },
      });
    }

    /* ================================ ADMIN =============================== */

    if (path === 'admin/login' && method === 'POST') {
      const b = await body(request);
      if (await loginLocked()) return json({ error: 'locked' }, 429);
      const r = await login(b.username, b.password);
      if (r.error) return json({ error: r.error }, r.error === 'locked' ? 429 : 401);
      return json({ ok: true }, 200, { 'set-cookie': sessionCookie(r.token, r.expiresHours) });
    }

    if (path === 'admin/logout' && method === 'POST') {
      await logout(request);
      return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
    }

    if (path === 'admin/me' && method === 'GET') {
      const s = await sessionFrom(request);
      const configured = Boolean(await ensureAdmin());
      if (!s) return json({ authenticated: false, configured }, 200);
      return json({ authenticated: true, configured, username: s.username });
    }

    // Everything below requires a valid session.
    if (path.startsWith('admin/')) {
      const guard = await requireAdmin(request);
      if (!guard.ok) return guard.response;
      const actor = guard.session.username;

      if (path === 'admin/overview' && method === 'GET') {
        const orders = await listOrders();
        const count = (f) => orders.filter(f).length;
        return json({
          counts: {
            new: count((o) => o.productionStatus === 'new'),
            designing: count((o) => o.productionStatus === 'designing'),
            waiting_approval: count((o) => o.productionStatus === 'waiting_approval'),
            ready: count((o) => o.productionStatus === 'ready'),
            shipped: count((o) => o.productionStatus === 'shipped'),
            payment_followup: count((o) => ['pending', 'pending_verification'].includes(o.paymentStatus)
              && o.productionStatus !== 'cancelled'),
          },
          recent: orders.slice(0, 12).map(adminOrderRow),
        });
      }

      if (path === 'admin/orders' && method === 'GET') {
        const q = clean(url.searchParams.get('q'), 80).toLowerCase();
        const ps = clean(url.searchParams.get('production'), 40);
        const pay = clean(url.searchParams.get('payment'), 40);
        let orders = await listOrders();
        if (q) orders = orders.filter((o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          String(o.customer.phone).includes(q));
        if (ps) orders = orders.filter((o) => o.productionStatus === ps);
        if (pay) orders = orders.filter((o) => o.paymentStatus === pay);
        return json({ orders: orders.map(adminOrderRow), total: orders.length });
      }

      if (path.startsWith('admin/orders/') && method === 'GET') {
        const order = await getOrder(clean(path.split('/')[2], 64));
        if (!order) return json({ error: 'not_found' }, 404);
        // Signed, expiring links for each attached photo. §6, §31
        const items = order.items.map((i) => {
          if (!i.photo || i.photo.state !== 'attached') return i;
          const { exp, sig } = signPhoto(i.photo.uploadToken);
          return { ...i, photo: { ...i.photo, url: `/api/photo/${i.photo.uploadToken}?exp=${exp}&sig=${sig}` } };
        });
        return json({ order: { ...order, items, confirmToken: undefined },
                      timeline: await orderTimeline(order.id) });
      }

      if (path.startsWith('admin/orders/') && method === 'PATCH') {
        const id = clean(path.split('/')[2], 64);
        const order = await getOrder(id);
        if (!order) return json({ error: 'not_found' }, 404);
        const b = await body(request);
        const next = { ...order, updatedAt: new Date().toISOString() };
        const events = [];

        if (b.productionStatus && PRODUCTION_STATUSES.includes(b.productionStatus)
            && b.productionStatus !== order.productionStatus) {
          next.productionStatus = b.productionStatus;
          events.push(['production_status_changed', { from: order.productionStatus, to: b.productionStatus }]);
          // Part 3 §34: completion starts the photo retention clock.
          if (b.productionStatus === 'completed') {
            const s = await getSettings();
            next.completedAt = next.updatedAt;
            next.photoDeletionScheduledFor =
              new Date(Date.now() + (s.photoRetentionHours || 24) * 3600_000).toISOString();
            events.push(['photo_deletion_scheduled', { at: next.photoDeletionScheduledFor }]);
          }
        }

        if (b.paymentStatus && PAYMENT_STATUSES.includes(b.paymentStatus)
            && b.paymentStatus !== order.paymentStatus) {
          next.paymentStatus = b.paymentStatus;
          events.push(['payment_status_changed', { from: order.paymentStatus, to: b.paymentStatus }]);
        }

        if (b.shippingCost !== undefined) {
          const v = b.shippingCost === null || b.shippingCost === '' ? null : Number(b.shippingCost);
          if (v !== null && (!Number.isFinite(v) || v < 0 || v > 10000)) {
            return json({ error: 'invalid_shipping' }, 422);
          }
          next.shippingCost = v === null ? null : Math.round(v * 100) / 100;
          // Product prices are never rewritten; only the total is composed. §8
          next.finalTotal = next.shippingCost === null
            ? null
            : Math.round((order.productsSubtotal + next.shippingCost) * 100) / 100;
          events.push(['shipping_cost_set', { value: next.shippingCost }]);
        }

        await db.orders.set(id, next);
        for (const [e, d] of events) await audit(e, { orderId: id, orderNumber: order.orderNumber, ...d }, actor);
        return json({ ok: true, order: { ...next, confirmToken: undefined } });
      }

      // Immediate, irreversible photo deletion. §36
      if (path.startsWith('admin/photo/') && method === 'DELETE') {
        const token = clean(path.split('/')[2], 96);
        const rec = await db.uploads.get(token);
        if (!rec) return json({ error: 'not_found' }, 404);
        if (rec.state !== 'deleted') {
          await db.files.del(rec.storageKey);
          await db.uploads.set(token, { ...rec, state: 'deleted', deletedAt: new Date().toISOString() });
          await audit('photo_deleted_manually', { token, orderId: rec.orderId }, actor);
        }
        return json({ ok: true });
      }

      if (path === 'admin/products' && method === 'GET') {
        return json({ products: await allProducts(), categories: await allCategories() });
      }

      if (path === 'admin/products' && method === 'POST') {
        const b = await body(request);
        const product = b.product;
        const invalid = validateProduct(product);
        if (invalid.length) return json({ error: 'invalid_product', problems: invalid }, 422);
        product.id = product.id || `prd_${randomKey(6)}`;
        await db.products.set(product.id, product);
        await audit('product_saved', { productId: product.id, slug: product.slug }, actor);
        return json({ ok: true, product });
      }

      if (path.startsWith('admin/products/') && method === 'DELETE') {
        // Part 3 §13: archive, never destroy - orders reference these.
        const id = clean(path.split('/')[2], 64);
        const p = await db.products.get(id);
        if (!p) return json({ error: 'not_found' }, 404);
        await db.products.set(id, { ...p, status: 'archived' });
        await audit('product_archived', { productId: id }, actor);
        return json({ ok: true });
      }

      if (path === 'admin/categories' && method === 'POST') {
        const b = await body(request);
        const c = b.category;
        if (!c?.slug || !c?.t?.ar?.name || !c?.t?.en?.name) {
          return json({ error: 'invalid_category' }, 422);
        }
        c.id = c.id || `cat_${randomKey(6)}`;
        await db.categories.set(c.id, c);
        await audit('category_saved', { categoryId: c.id }, actor);
        return json({ ok: true, category: c });
      }

      if (path.startsWith('admin/content/') && method === 'GET') {
        const kind = clean(path.split('/')[2], 32);
        return json({ items: (await db.content.get(kind))?.items || [] });
      }

      if (path.startsWith('admin/content/') && method === 'POST') {
        const kind = clean(path.split('/')[2], 32);
        if (!['faqs', 'creations', 'reviews'].includes(kind)) return json({ error: 'unknown' }, 404);
        const b = await body(request);
        if (!Array.isArray(b.items)) return json({ error: 'invalid' }, 422);
        await db.content.set(kind, { items: b.items.slice(0, 200) });
        await audit('content_saved', { kind, count: b.items.length }, actor);
        return json({ ok: true });
      }

      if (path === 'admin/settings' && method === 'GET') return json({ settings: await getSettings() });

      if (path === 'admin/settings' && method === 'POST') {
        const b = await body(request);
        const p = b.settings || {};
        const next = await saveSettings({
          businessName: clean(p.businessName, 80) || undefined,
          whatsapp: clean(p.whatsapp, 32),
          whish: clean(p.whish, 32),
          instagram: clean(p.instagram, 200),
          email: clean(p.email, 160),
          productionMinDays: Math.max(0, Math.min(60, Number(p.productionMinDays) || 2)),
          productionMaxDays: Math.max(0, Math.min(90, Number(p.productionMaxDays) || 5)),
          photoRetentionHours: Math.max(1, Math.min(720, Number(p.photoRetentionHours) || 24)),
          abandonedUploadHours: Math.max(1, Math.min(720, Number(p.abandonedUploadHours) || 48)),
          maxUploadMb: Math.max(1, Math.min(40, Number(p.maxUploadMb) || 12)),
        });
        await audit('settings_saved', {}, actor);
        return json({ ok: true, settings: next });
      }

      if (path === 'admin/audit' && method === 'GET') {
        const all = await db.audit.all();
        return json({ events: all.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 200) });
      }

      if (path === 'admin/cleanup' && method === 'POST') {
        return json(await runRetention(actor));
      }
    }

    return json({ error: 'not_found', path }, 404);
  } catch (err) {
    // Part 3 §54/§89: customers never see stack traces or storage errors.
    console.error('[api]', path, err);
    return json({ error: 'server_error' }, 500);
  }
}

function adminOrderRow(o) {
  return {
    id: o.id, orderNumber: o.orderNumber, createdAt: o.createdAt,
    customerName: o.customer.name, phone: o.customer.phone,
    city: o.customer.city, country: o.customer.country,
    itemCount: o.items.length, productsSubtotal: o.productsSubtotal,
    shippingCost: o.shippingCost, finalTotal: o.finalTotal,
    paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
    productionStatus: o.productionStatus, locale: o.locale,
    photosDeletedAt: o.photosDeletedAt || null,
    photoDeletionScheduledFor: o.photoDeletionScheduledFor || null,
  };
}

/** Part 3 §19: publishing is blocked with a message naming what to fix. */
function validateProduct(p) {
  const problems = [];
  if (!p) return ['missing'];
  if (!p.slug) problems.push('slug_required');
  if (!p.categoryId) problems.push('category_required');
  if (!p.t?.ar?.name) problems.push('arabic_name_required');
  if (!p.t?.en?.name) problems.push('english_name_required');

  const type = p.pricing?.type;
  if (!['fixed', 'unit', 'option_override'].includes(type)) problems.push('pricing_type_invalid');
  if (['fixed', 'unit'].includes(type) && !(Number(p.pricing?.basePrice) >= 0)) problems.push('base_price_required');

  if (type === 'option_override') {
    const driver = (p.fields || []).find((f) => f.key === p.pricing?.driverField);
    if (!driver) problems.push('driver_field_missing');
    else if (!(driver.options || []).some((o) => o.active && o.priceOverride != null)) {
      problems.push('driver_field_needs_priced_option');
    }
  }

  for (const f of p.fields || []) {
    if (!f.key) problems.push('field_key_required');
    if (!f.t?.ar?.label || !f.t?.en?.label) problems.push(`field_labels_required:${f.key || '?'}`);
    if (f.options) {
      for (const o of f.options) {
        if (!o.key) problems.push(`option_key_required:${f.key}`);
        if (!o.t?.ar?.label || !o.t?.en?.label) problems.push(`option_labels_required:${f.key}`);
      }
    }
  }
  return problems;
}
