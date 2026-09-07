/* Admin client. Every view refetches from the API; nothing is cached across
   a sign-out, and no write happens here that the API does not re-check. */
const api = async (path, opts = {}) => {
  const r = await fetch('/api/' + path, {
    headers: { 'content-type': 'application/json' }, credentials: 'same-origin', ...opts,
  });
  if (!r.ok) throw Object.assign(new Error(r.statusText), { status: r.status });
  return r.status === 204 ? null : r.json();
};

export function admin() {
  const root = document.getElementById('admin');
  if (!root) return;

  const login = document.getElementById('alogin');
  const shell = document.getElementById('ashell');

  const show = (signedIn) => { login.hidden = signedIn; shell.hidden = !signedIn; };

  /* --- session ----------------------------------------------------------- */
  api('admin/me').then(() => { show(true); load(); }).catch(() => show(false));

  document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = document.getElementById('login-err');
    err.hidden = true;
    try {
      await api('admin/login', { method: 'POST', body: JSON.stringify({ password: document.getElementById('pw').value }) });
      show(true); load();
    } catch {
      err.textContent = 'That password was not accepted.';
      err.hidden = false;
    }
  });

  document.getElementById('logout')?.addEventListener('click', async () => {
    try { await api('admin/logout', { method: 'POST' }); } catch { /* already gone */ }
    show(false);
  });

  /* --- views ------------------------------------------------------------- */
  root.querySelectorAll('.aside__nav button').forEach((b) => {
    b.addEventListener('click', () => {
      root.querySelectorAll('.aside__nav button').forEach((x) => x.classList.toggle('is-on', x === b));
      root.querySelectorAll('.aview').forEach((v) => { v.hidden = v.dataset.view !== b.dataset.view; });
    });
  });

  /* --- products table ---------------------------------------------------- */
  let rows = [];
  async function load() {
    try {
      const data = await api('admin/overview');
      document.getElementById('s-orders').textContent = data.ordersToday ?? 0;
      document.getElementById('recent').innerHTML = data.recent?.length
        ? data.recent.map((o) => `<p>${o.number} — ${o.total}</p>`).join('')
        : '<p class="ahint">No orders yet.</p>';
    } catch {
      document.getElementById('recent').innerHTML = '<p class="ahint">The orders API is not reachable yet.</p>';
    }
    try {
      rows = (await api('admin/products?limit=2000')).products || [];
    } catch {
      rows = [];
    }
    paint();
  }

  const tbody = document.querySelector('#p-table tbody');
  const q = document.getElementById('p-q');
  const gsel = document.getElementById('p-group');

  function paint() {
    if (!tbody) return;
    const term = (q?.value || '').trim().toLowerCase();
    const g = gsel?.value || '';
    const list = rows.filter((p) =>
      (!term || p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term)) &&
      (!g || (p.groups || []).includes(g)));
    document.getElementById('p-n').textContent = `${list.length} shown`;
    tbody.innerHTML = list.slice(0, 300).map((p) => `
      <tr><td><b>${p.name}</b></td><td>${p.brand}</td><td>${p.variants}</td>
      <td class="r">$${p.priceMin}${p.priceMin !== p.priceMax ? '–$' + p.priceMax : ''}</td>
      <td class="r">${p.available ? '✓' : '—'}</td></tr>`).join('')
      || '<tr><td colspan="5" class="ahint" style="padding:20px">Nothing matches.</td></tr>';
  }
  q?.addEventListener('input', paint);
  gsel?.addEventListener('change', paint);

  /* --- prices -------------------------------------------------------------
     A change is written the moment the field is left, one variant at a time,
     and the row reflects what the server accepted rather than what was typed. */
  let prices = [];
  const prBody = document.querySelector('#pr-table tbody');
  const prQ = document.getElementById('pr-q');
  const prOnly = document.getElementById('pr-only');

  const money = (n) => (Number.isInteger(n) ? '$' + n : '$' + n.toFixed(2));

  async function loadPrices() {
    if (prices.length) return;
    try { prices = (await api('admin/prices')).prices || []; } catch { prices = []; }
    paintPrices();
  }

  function paintPrices() {
    if (!prBody) return;
    const term = (prQ?.value || '').trim().toLowerCase();
    const rows = prices.filter((r) =>
      (!term || r.name.toLowerCase().includes(term) || r.brand.toLowerCase().includes(term)) &&
      (!prOnly?.checked || r.overridden));
    document.getElementById('pr-n').textContent = `${rows.length} shown`;
    prBody.innerHTML = rows.slice(0, 250).map((r) => `
      <tr data-v="${r.variantId}">
        <td><b>${r.name}</b><br><span style="color:var(--chrome-600)">${r.brand}</span></td>
        <td>${r.option}</td>
        <td class="r listed">${money(r.listed)}</td>
        <td class="r"><input class="pedit${r.overridden ? ' is-over' : ''}" type="number"
             step="0.5" min="0.5" max="2000" value="${r.price}"></td>
        <td class="r">${r.overridden ? '<button type="button" class="pclear">clear</button>' : ''}</td>
      </tr>`).join('') || '<tr><td colspan="5" class="ahint" style="padding:20px">Nothing matches.</td></tr>';
  }

  async function writePrice(variantId, price) {
    const row = prices.find((r) => r.variantId === variantId);
    try {
      await api('admin/prices', { method: 'PATCH', body: JSON.stringify({ variantId, price }) });
      if (row) {
        row.price = price === null ? row.listed : price;
        row.overridden = price !== null;
      }
    } catch { /* leave the row showing the last accepted value */ }
    paintPrices();
  }

  prBody?.addEventListener('change', (e) => {
    if (!e.target.matches('.pedit')) return;
    const tr = e.target.closest('tr');
    writePrice(tr.dataset.v, Number(e.target.value));
  });
  prBody?.addEventListener('click', (e) => {
    if (!e.target.matches('.pclear')) return;
    writePrice(e.target.closest('tr').dataset.v, null);
  });
  prQ?.addEventListener('input', paintPrices);
  prOnly?.addEventListener('change', paintPrices);

  /* --- orders ------------------------------------------------------------- */
  let orders = [];
  const oHost = document.getElementById('orders');
  const oStatus = document.getElementById('o-status');

  async function loadOrders() {
    try { orders = (await api('admin/orders')).orders || []; }
    catch { oHost.innerHTML = '<p class="ahint">Could not reach the orders API.</p>'; return; }
    paintOrders();
  }

  function paintOrders() {
    const f = oStatus?.value || '';
    const rows = orders.filter((o) => !f || o.status === f);
    document.getElementById('o-n').textContent = `${rows.length} of ${orders.length}`;
    oHost.innerHTML = rows.length ? rows.map((o) => `
      <article class="ord" data-num="${o.number}">
        <div class="ord__hd">
          <span class="ord__num">${o.number}</span>
          <span class="st st-${o.status}">${o.status}</span>
          <span class="ord__when">${new Date(o.placed).toLocaleString('en-GB')}</span>
        </div>
        <p class="ord__who"><b>${o.customer.name}</b> · ${o.customer.phone}<br>${o.customer.address}
          ${o.customer.note ? '<br><i>' + o.customer.note + '</i>' : ''}</p>
        <div class="ord__lines">
          ${o.lines.map((l) => `<span><span>${l.qty} × ${l.name}${l.option ? ' — ' + l.option : ''}</span>
            <span>${money(l.total)}</span></span>`).join('')}
        </div>
        <div class="ord__foot">
          <select class="ord__set">
            ${['new', 'packing', 'sent', 'done', 'cancelled'].map((s) =>
              `<option value="${s}"${s === o.status ? ' selected' : ''}>${s}</option>`).join('')}
          </select>
          <span class="ord__total">${money(o.subtotal)}</span>
        </div>
      </article>`).join('') : '<p class="ahint">No orders with that status.</p>';
  }

  oHost?.addEventListener('change', async (e) => {
    if (!e.target.matches('.ord__set')) return;
    const num = e.target.closest('.ord').dataset.num;
    const status = e.target.value;
    try {
      await api(`admin/orders/${num}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      const row = orders.find((o) => o.number === num);
      if (row) row.status = status;
      paintOrders();
    } catch { /* the select snaps back on the next paint */ }
  });
  oStatus?.addEventListener('change', paintOrders);

  /* --- settings ----------------------------------------------------------- */
  const sForm = document.getElementById('settings-form');
  async function loadSettings() {
    try {
      const s2 = await api('admin/settings');
      for (const k of ['deliveryNote', 'phone', 'whatsapp'])
        if (sForm?.elements[k]) sForm.elements[k].value = s2[k] || '';
    } catch { /* leave the form empty */ }
  }
  sForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const el = document.getElementById('set-status');
    try {
      await api('admin/settings', { method: 'PUT',
        body: JSON.stringify(Object.fromEntries(new FormData(sForm).entries())) });
      el.textContent = 'Saved'; el.dataset.ok = '1';
    } catch {
      el.textContent = 'Could not save'; el.dataset.ok = '0';
    }
    setTimeout(() => (el.textContent = ''), 2600);
  });

  /* Each tab loads its own data the first time it is opened. */
  root.querySelectorAll('.aside__nav button').forEach((b) => b.addEventListener('click', () => {
    if (b.dataset.view === 'prices') loadPrices();
    if (b.dataset.view === 'orders') loadOrders();
    if (b.dataset.view === 'settings') loadSettings();
  }));
}
