// Cart validation and order creation. This module is the authority on price
// and on whether an order may be created at all. Part 2 §6, §22, §30, §35.

import { db, getSettings, newOrderNumber, saveOrder, audit, allProducts } from './db.js';
import { unitPrice, lineTotal, clampQuantity, missingRequired, selectedOptions } from '../../src/lib/pricing.js';
import { clean, cleanMultiline, randomKey } from './validate.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Re-validate every cart line against current product configuration and
 * recompute its price. Returns authoritative lines plus any issues the
 * customer must resolve. Nothing is silently corrected. Part 2 §22, §44, §45.
 */
export async function validateCart(items, locale = 'ar') {
  const issues = [];
  const lines = [];
  if (!Array.isArray(items) || items.length === 0) {
    return { lines: [], subtotal: 0, issues: [{ code: 'empty_cart' }] };
  }
  if (items.length > 40) {
    return { lines: [], subtotal: 0, issues: [{ code: 'too_many_items' }] };
  }

  const products = await allProducts();

  for (const raw of items) {
    const lineId = clean(raw.lineId, 64) || randomKey(8);
    const product = products.find((p) => p.id === raw.productId || p.slug === raw.productSlug);

    if (!product) {
      issues.push({ lineId, code: 'product_missing' });
      continue;
    }
    if (product.status !== 'active') {
      // Part 2 §44: block this line, keep the rest of the cart intact.
      issues.push({ lineId, code: 'product_unavailable', productName: product.t[locale]?.name });
      continue;
    }

    const answers = sanitiseAnswers(product, raw.answers || {});

    // Every selected option must still exist and still be active. §45
    let optionProblem = null;
    for (const field of product.fields || []) {
      if (!field.active || !field.options) continue;
      const picked = answers[field.key];
      if (picked == null || picked === '') continue;
      for (const key of Array.isArray(picked) ? picked : [picked]) {
        const opt = field.options.find((o) => o.key === key);
        if (!opt) optionProblem = { code: 'option_missing', field: field.key };
        else if (!opt.active) optionProblem = { code: 'option_unavailable', field: field.key, label: opt.t[locale]?.label };
      }
    }
    if (optionProblem) {
      issues.push({ lineId, productName: product.t[locale]?.name, ...optionProblem });
      continue;
    }


    // Quantity is snapped to the product's supported increment. §46
    const quantity = clampQuantity(product, raw.quantity);
    if (Number(raw.quantity) !== quantity) {
      issues.push({ lineId, code: 'quantity_adjusted', from: raw.quantity, to: quantity, productName: product.t[locale]?.name });
    }

    const unit = unitPrice(product, answers);
    const total = lineTotal(product, answers, quantity);
    if (unit == null || total == null) {
      issues.push({ lineId, code: 'price_unavailable', productName: product.t[locale]?.name });
      continue;
    }

    // The client's displayed price is compared, never trusted. §6, §22
    const claimed = Number(raw.displayPrice);
    if (Number.isFinite(claimed) && round2(claimed) !== total) {
      issues.push({
        lineId, code: 'price_changed', from: round2(claimed), to: total,
        productName: product.t[locale]?.name,
      });
    }

    // Resolve the photo before checking required fields: the upload is carried
    // as a token rather than an answer, so it is folded into the answers here
    // and then validated by the same required-field rule as everything else.
    let uploadRef = null;
    const photoField = (product.fields || []).find((f) => f.active && f.type === 'image_upload');
    if (photoField) {
      const token = clean(raw.uploadToken, 96);
      const rec = token ? await db.uploads.get(token) : null;
      const usable = rec && rec.state !== 'deleted'
        && !(rec.state === 'attached' && rec.lineId !== lineId);
      if (usable) {
        uploadRef = token;
        answers[photoField.key] = token;
      } else if (photoField.required) {
        issues.push({ lineId, code: 'upload_missing', productName: product.t[locale]?.name });
        continue;
      }
    }

    // Required fields must all be answered. §49
    const missing = missingRequired(product, answers);
    if (missing.length) {
      issues.push({ lineId, code: 'missing_required', fields: missing, productName: product.t[locale]?.name });
      continue;
    }

    lines.push({ lineId, product, answers, quantity, unitPrice: unit, lineTotal: total, uploadRef });
  }

  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  return { lines, subtotal, issues };
}

/** Keep only answers for fields the product actually declares. §49 (mass assignment) */
function sanitiseAnswers(product, input) {
  const out = {};
  for (const field of product.fields || []) {
    if (!field.active) continue;
    const v = input[field.key];
    if (v == null) continue;
    if (field.type === 'long_text') out[field.key] = cleanMultiline(v);
    else if (field.type === 'number') {
      const n = Number(v);
      if (Number.isFinite(n)) out[field.key] = n;
    } else if (Array.isArray(v)) out[field.key] = v.slice(0, 20).map((x) => clean(x, 80));
    else out[field.key] = clean(v, 400);
  }
  return out;
}

/**
 * Build the immutable record of one order line. Part 2 §35, §38, §39:
 * labels and prices are frozen here so later Admin edits never rewrite history.
 */
function snapshotLine(line, locale) {
  const { product, answers, quantity } = line;
  const fields = [];

  for (const field of (product.fields || []).filter((f) => f.active).sort((a, b) => a.order - b.order)) {
    const v = answers[field.key];
    if (v == null || v === '') continue;
    const entry = {
      key: field.key,
      type: field.type,
      label: { ar: field.t.ar.label, en: field.t.en.label },
      value: field.type === 'image_upload' ? '[photo]' : v,
    };
    if (field.options) {
      const keys = Array.isArray(v) ? v : [v];
      entry.options = keys.map((k) => {
        const o = field.options.find((x) => x.key === k);
        return o ? {
          key: o.key,
          label: { ar: o.t.ar.label, en: o.t.en.label },
          priceOverride: o.priceOverride ?? null,
          priceModifier: o.priceModifier ?? null,
        } : { key: k, label: { ar: k, en: k } };
      });
    }
    fields.push(entry);
  }

  return {
    lineId: line.lineId,
    productId: product.id,
    productSlug: product.slug,
    productAsset: product.asset,
    productName: { ar: product.t.ar.name, en: product.t.en.name },
    quantityLabel: { ar: product.quantity?.t?.ar || '', en: product.quantity?.t?.en || '' },
    unitPrice: line.unitPrice,
    quantity,
    lineTotal: line.lineTotal,
    fields,
    childName: answers.child_name || null,
    photo: line.uploadRef ? { uploadToken: line.uploadRef, state: 'attached' } : null,
  };
}

/**
 * Create exactly one order. Part 2 §30, §31, §43.
 * `idempotencyKey` makes a retry - a double tap, or a lost response - return
 * the order that already exists rather than creating a second one.
 */
export async function createOrder({ customer, items, locale = 'ar', idempotencyKey }) {
  const key = clean(idempotencyKey, 96);
  if (key) {
    const prior = await db.idem.get(key);
    if (prior?.orderId) {
      const existing = await db.orders.get(prior.orderId);
      if (existing) return { order: existing, replayed: true };
    }
    // Claim the key before doing any work, so concurrent submits collapse.
    await db.idem.set(key, { claimedAt: new Date().toISOString() });
  }

  const { lines, subtotal, issues } = await validateCart(items, locale);
  // Only price_changed and quantity_adjusted are advisory; the rest block. §22
  const blocking = issues.filter((i) => !['price_changed', 'quantity_adjusted'].includes(i.code));
  if (blocking.length || !lines.length) {
    if (key) await db.idem.del(key);
    return { error: 'cart_invalid', issues };
  }
  // A changed price must be acknowledged by the customer, never charged silently.
  if (issues.some((i) => i.code === 'price_changed')) {
    if (key) await db.idem.del(key);
    return { error: 'price_changed', issues };
  }

  const settings = await getSettings();
  const now = new Date().toISOString();
  const id = randomKey(16);
  const orderNumber = await newOrderNumber();
  const confirmToken = randomKey(24);

  const order = {
    id,
    orderNumber,
    confirmToken,
    locale,
    currency: settings.currency || 'USD',

    customer: {
      name: customer.name, phone: customer.phone, email: customer.email || null,
      country: customer.country, city: customer.city,
      address: customer.address, addressNotes: customer.addressNotes || null,
    },

    items: lines.map((l) => snapshotLine(l, locale)),
    productsSubtotal: subtotal,
    // Part 2 §25/§26: shipping is unknown, not zero.
    shippingCost: null,
    finalTotal: null,

    paymentMethod: customer.paymentMethod,
    paymentStatus: customer.paymentMethod === 'cod' ? 'cod' : 'pending',
    productionStatus: 'new',

    createdAt: now,
    updatedAt: now,
    completedAt: null,
    photoDeletionScheduledFor: null,
    photosDeletedAt: null,
  };

  await saveOrder(order);

  // Part 2 §12/§40: bind each upload to its exact order item.
  for (const line of lines) {
    if (!line.uploadRef) continue;
    const rec = await db.uploads.get(line.uploadRef);
    if (rec) {
      await db.uploads.set(line.uploadRef, {
        ...rec, state: 'attached', orderId: id, lineId: line.lineId, attachedAt: now,
      });
    }
  }

  if (key) await db.idem.set(key, { orderId: id, at: now });
  await audit('order_created', { orderId: id, orderNumber, subtotal, items: lines.length }, 'customer');

  return { order, replayed: false };
}

/** The customer-safe view: no internal ids, no upload keys. Part 2 §50. */
export function publicOrder(order) {
  return {
    orderNumber: order.orderNumber,
    locale: order.locale,
    currency: order.currency,
    createdAt: order.createdAt,
    customerName: order.customer.name,
    items: order.items.map((i) => ({
      productName: i.productName,
      quantity: i.quantity,
      quantityLabel: i.quantityLabel,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      childName: i.childName,
      hasPhoto: Boolean(i.photo),
      fields: i.fields
        .filter((f) => f.type !== 'image_upload')
        .map((f) => ({ label: f.label, value: f.value, options: f.options })),
    })),
    productsSubtotal: order.productsSubtotal,
    shippingCost: order.shippingCost,
    finalTotal: order.finalTotal,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    productionStatus: order.productionStatus,
  };
}
