/* Client-side filtering over the rendered grid. Every card carries its own
   facts as data attributes at build time, so filtering never needs the
   catalogue shipped twice. */
export function shop() {
  const grid = document.getElementById('grid');
  if (!grid) return;

  const cards = [...grid.children];
  const nEl = document.getElementById('grid-n');
  const empty = document.getElementById('grid-empty');
  const priceEl = document.getElementById('f-price');
  const priceOut = document.getElementById('f-price-v');
  const stockEl = document.getElementById('f-stock');
  const sortEl = document.getElementById('sort');
  const brandBox = document.getElementById('f-brands');

  const state = { brands: new Set(), max: Infinity, stock: false, sort: 'featured' };

  const apply = () => {
    let shown = 0;
    for (const c of cards) {
      const ok =
        (!state.brands.size || state.brands.has(c.dataset.brand)) &&
        Number(c.dataset.min) <= state.max &&
        (!state.stock || c.dataset.stock === '1');
      c.hidden = !ok;
      if (ok) shown++;
    }
    nEl.textContent = shown.toLocaleString('en-US');
    empty.hidden = shown > 0;
  };

  const sort = () => {
    const key = state.sort;
    const val = (c) => ({
      featured: () => (c.dataset.stage === '1' ? 0 : 1) + c.dataset.name.toLowerCase(),
      'price-asc': () => Number(c.dataset.min),
      'price-desc': () => -Number(c.dataset.max),
      name: () => c.dataset.name.toLowerCase(),
      brand: () => c.dataset.brand.toLowerCase() + c.dataset.name.toLowerCase(),
    })[key]();
    const sorted = [...cards].sort((a, b) => {
      const x = val(a), y = val(b);
      return typeof x === 'number' ? x - y : String(x).localeCompare(String(y));
    });
    grid.append(...sorted);
  };

  brandBox?.addEventListener('change', (e) => {
    const cb = e.target;
    if (cb.name !== 'brand') return;
    cb.checked ? state.brands.add(cb.value) : state.brands.delete(cb.value);
    document.getElementById('f-brand-n').textContent = state.brands.size ? `(${state.brands.size})` : '';
    apply();
  });

  document.getElementById('f-brand-q')?.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    for (const l of brandBox.querySelectorAll('.fcheck'))
      l.hidden = q && !l.textContent.toLowerCase().includes(q);
  });

  priceEl?.addEventListener('input', () => {
    const v = Number(priceEl.value);
    state.max = v >= Number(priceEl.max) ? Infinity : v;
    priceOut.textContent = state.max === Infinity ? 'any' : '$' + v;
    apply();
  });

  stockEl?.addEventListener('change', () => { state.stock = stockEl.checked; apply(); });
  sortEl?.addEventListener('change', () => { state.sort = sortEl.value; sort(); });

  const clear = () => {
    state.brands.clear(); state.max = Infinity; state.stock = false;
    brandBox?.querySelectorAll('input').forEach((i) => (i.checked = false));
    if (priceEl) { priceEl.value = priceEl.max; priceOut.textContent = 'any'; }
    if (stockEl) stockEl.checked = false;
    document.getElementById('f-brand-n').textContent = '';
    apply();
  };
  document.getElementById('f-clear')?.addEventListener('click', clear);
  document.getElementById('f-clear-2')?.addEventListener('click', clear);

  document.getElementById('f-toggle')?.addEventListener('click', () => {
    document.getElementById('filters').classList.toggle('open');
  });

  sort();
  apply();
}
