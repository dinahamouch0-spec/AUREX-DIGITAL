// Order notifications. Part 3 §41, §42, §43.
//
// Two rules shape this module:
//   - A child's photo is never attached to any email.
//   - Email is secondary: a delivery failure never invalidates an order that
//     was already created. Failures are logged and swallowed.
//
// Delivery goes through Resend when RESEND_API_KEY is configured. Without it
// the module is a no-op that records the intent, so the site runs correctly
// with no mail provider at all.

import { getSettings, audit } from './db.js';

const escapeHtml = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const money = (n) => (n == null ? '—' : '$' + Number(n).toFixed(2).replace(/\.00$/, ''));

async function send({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'Ya 7kayti <onboarding@resend.dev>';
  if (!key || !to) return { skipped: true, reason: key ? 'no_recipient' : 'no_provider' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) throw new Error(`mail_failed_${res.status}`);
  return { sent: true };
}

const shell = (title, rows, footer) => `
<div style="font-family:system-ui,-apple-system,sans-serif;background:#fffcf8;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #f0e6dd;border-radius:16px;padding:24px">
    <h1 style="margin:0 0 16px;font-size:20px;color:#10103a">${escapeHtml(title)}</h1>
    <table style="width:100%;border-collapse:collapse;font-size:14px;color:#4b4a72">${rows}</table>
    ${footer || ''}
  </div>
</div>`;

const row = (k, v) => `<tr>
  <td style="padding:6px 0;color:#7d7c9c">${escapeHtml(k)}</td>
  <td style="padding:6px 0;text-align:right;color:#10103a;font-weight:600">${escapeHtml(v)}</td>
</tr>`;

/** Notify the business that an order arrived. Never blocks order creation. */
export async function notifyNewOrder(order, baseUrl = '') {
  try {
    const settings = await getSettings();
    if (!settings.email) return { skipped: true, reason: 'no_business_email' };

    const items = order.items
      .map((i) => row(
        `${i.productName.ar || i.productName.en}${i.childName ? ` — ${i.childName}` : ''} × ${i.quantity}`,
        money(i.lineTotal)))
      .join('');

    const link = baseUrl ? `${baseUrl.replace(/\/$/, '')}/admin/#/orders/${order.id}` : '';

    await send({
      to: settings.email,
      subject: `طلب جديد ${order.orderNumber} — ${order.customer.name}`,
      html: shell(`طلب جديد: ${order.orderNumber}`,
        row('العميل', order.customer.name)
        + row('الهاتف', order.customer.phone)
        + row('المدينة', `${order.customer.city}, ${order.customer.country}`)
        + items
        + row('مجموع المنتجات', money(order.productsSubtotal))
        + row('التوصيل', 'يُحدَّد لاحقًا')
        + row('طريقة الدفع', order.paymentMethod === 'cod' ? 'عند الاستلام' : 'Whish Money'),
        link
          ? `<p style="margin:20px 0 0"><a href="${escapeHtml(link)}"
               style="display:inline-block;background:#f0609f;color:#fff;text-decoration:none;
               padding:10px 20px;border-radius:999px;font-weight:700">فتح الطلب في لوحة التحكم</a></p>`
          : ''),
    });
    await audit('email_sent', { orderId: order.id, kind: 'new_order' });
    return { sent: true };
  } catch (err) {
    // §43: the order stands regardless.
    console.error('[mail] new order notification failed', err.message);
    await audit('email_failed', { orderId: order.id, kind: 'new_order', reason: err.message }).catch(() => {});
    return { failed: true };
  }
}

/** Confirmation to the customer, when they gave an email. Photo never attached. */
export async function notifyCustomer(order) {
  try {
    if (!order.customer.email) return { skipped: true, reason: 'no_customer_email' };
    const ar = order.locale === 'ar';

    const items = order.items
      .map((i) => row(
        `${i.productName[order.locale] || i.productName.ar}${i.childName ? ` — ${i.childName}` : ''} × ${i.quantity}`,
        money(i.lineTotal)))
      .join('');

    await send({
      to: order.customer.email,
      subject: ar ? `تم استلام طلبك ${order.orderNumber} ✨` : `We received your order ${order.orderNumber} ✨`,
      html: shell(
        ar ? `تم استلام طلبك! ${order.orderNumber}` : `Order received — ${order.orderNumber}`,
        items
        + row(ar ? 'مجموع المنتجات' : 'Products subtotal', money(order.productsSubtotal))
        + row(ar ? 'التوصيل' : 'Delivery', ar ? 'يُحدَّد لاحقًا' : 'To be confirmed')
        + row(ar ? 'طريقة الدفع' : 'Payment',
              order.paymentMethod === 'cod' ? (ar ? 'عند الاستلام' : 'Cash on delivery') : 'Whish Money'),
        `<p style="margin:20px 0 0;font-size:13px;color:#7d7c9c">${escapeHtml(ar
          ? 'سنتواصل معك لتأكيد الدفع والتوصيل والخطوات التالية. مدة التنفيذ عادةً من ٢ إلى ٥ أيام، ومدة التوصيل منفصلة.'
          : 'We’ll contact you to confirm payment, delivery and next steps. Production usually takes 2–5 days; delivery time is separate.')}</p>`),
    });
    await audit('email_sent', { orderId: order.id, kind: 'customer_confirmation' });
    return { sent: true };
  } catch (err) {
    console.error('[mail] customer confirmation failed', err.message);
    await audit('email_failed', { orderId: order.id, kind: 'customer_confirmation', reason: err.message }).catch(() => {});
    return { failed: true };
  }
}
