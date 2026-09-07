/* The API.

   One router, mounted at /api. Public routes price and place orders; the
   admin routes all sit behind a session check performed here, once, so no
   handler can be reached without it by accident. */
import catalog from '../src/data/catalog.json' with { type: 'json' };
import { signIn, signOut, currentSession, cookieHeader, clearCookie } from './_lib/auth.js';
import { validateOrder } from './_lib/validate.js';
import { priceOrder, placeOrder, listOrders, setStatus, priceList,
         invalidateOverrides } from './_lib/orders.js';
import { get, set } from './_lib/store.js';

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

const DEFAULT_SETTINGS = {
  currency: 'USD',
  deliveryNote: 'Delivery is quoted per area and confirmed by phone.',
  phone: '',
  whatsapp: '',
};

export async function route(req) {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/(?:\.netlify\/functions\/)?api\/?/, '').replace(/\/$/, '');
  const method = req.method.toUpperCase();

  const body = async () => {
    try { return await req.json(); } catch { return {}; }
  };

  /* ---------------------------------------------------------- public --- */
  if (path === 'config' && method === 'GET') {
    const s = { ...DEFAULT_SETTINGS, ...(await get('settings')) };
    return json({ currency: s.currency, deliveryNote: s.deliveryNote, phone: s.phone, whatsapp: s.whatsapp });
  }

  /* Re-price a cart on the server. The browser sends variant ids and
     quantities; prices only ever come from here. */
  if (path === 'cart/validate' && method === 'POST') {
    const { lines = [] } = await body();
    const clean = (Array.isArray(lines) ? lines : []).slice(0, 60)
      .map((l) => ({ variantId: String(l?.variantId ?? ''), qty: Math.min(99, Math.max(1, Math.floor(Number(l?.qty)) || 0)) }))
      .filter((l) => l.variantId && l.qty);
    return json(await priceOrder(clean));
  }

  if (path === 'order' && method === 'POST') {
    const { errors, order } = validateOrder(await body());
    if (errors.length) return json({ errors }, 400);
    const result = await placeOrder(order);
    if (result.error) return json({ errors: [result.error], priced: result.priced }, 409);
    return json({ number: result.order.number, subtotal: result.order.subtotal,
                  currency: result.order.currency, lines: result.order.lines }, 201);
  }

  /* ----------------------------------------------------------- admin --- */
  if (path === 'admin/login' && method === 'POST') {
    const { password } = await body();
    const token = await signIn(password);
    if (!token) return json({ error: 'Not accepted' }, 401);
    return json({ ok: true }, 200, { 'set-cookie': cookieHeader(token) });
  }

  if (path === 'admin/logout' && method === 'POST') {
    await signOut(req);
    return json({ ok: true }, 200, { 'set-cookie': clearCookie() });
  }

  if (path.startsWith('admin/')) {
    if (!(await currentSession(req))) return json({ error: 'Sign in required' }, 401);

    if (path === 'admin/me') return json({ ok: true });

    if (path === 'admin/overview') {
      const orders = await listOrders();
      const today = new Date().toISOString().slice(0, 10);
      return json({
        ordersToday: orders.filter((o) => o.placed.startsWith(today)).length,
        ordersTotal: orders.length,
        revenue: +orders.reduce((s, o) => s + o.subtotal, 0).toFixed(2),
        recent: orders.slice(0, 8).map((o) => ({ number: o.number, total: `$${o.subtotal}`, status: o.status })),
      });
    }

    if (path === 'admin/products') {
      const limit = Math.min(2000, Number(url.searchParams.get('limit')) || 200);
      return json({
        total: catalog.products.length,
        products: catalog.products.slice(0, limit).map((p) => ({
          id: p.id, name: p.name, brand: p.brand, groups: p.groups,
          variants: p.variants.length, priceMin: p.priceMin, priceMax: p.priceMax,
          available: p.available,
        })),
      });
    }

    if (path === 'admin/orders' && method === 'GET') return json({ orders: await listOrders() });

    if (path === 'admin/prices' && method === 'GET') return json({ prices: await priceList() });

    /* A price change is one variant at a time and bounded: no negative
       prices, nothing above a sane ceiling, and a null clears the override
       back to the listed price. */
    if (path === 'admin/prices' && method === 'PATCH') {
      const { variantId, price } = await body();
      if (!variantId) return json({ error: 'variantId is required' }, 400);
      const map = { ...((await get('price-overrides')) || {}) };
      if (price === null) delete map[variantId];
      else {
        const n = Number(price);
        if (!Number.isFinite(n) || n < 0.5 || n > 2000)
          return json({ error: 'A price must be between $0.50 and $2000.' }, 400);
        map[variantId] = Math.round(n * 100) / 100;
      }
      await set('price-overrides', map);
      invalidateOverrides();
      return json({ ok: true, overrides: Object.keys(map).length });
    }

    if (path.startsWith('admin/orders/') && method === 'PATCH') {
      const number = path.split('/')[2];
      const { status } = await body();
      if (!['new', 'packing', 'sent', 'done', 'cancelled'].includes(status))
        return json({ error: 'Unknown status' }, 400);
      const row = await setStatus(number, status);
      return row ? json(row) : json({ error: 'No such order' }, 404);
    }

    if (path === 'admin/settings' && method === 'GET')
      return json({ ...DEFAULT_SETTINGS, ...(await get('settings')) });

    if (path === 'admin/settings' && method === 'PUT') {
      const patch = await body();
      const next = { ...DEFAULT_SETTINGS, ...(await get('settings')) };
      for (const k of Object.keys(DEFAULT_SETTINGS))
        if (typeof patch[k] === 'string') next[k] = patch[k].slice(0, 400);
      await set('settings', next);
      return json(next);
    }
  }

  return json({ error: 'No such endpoint' }, 404);
}
