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
}
