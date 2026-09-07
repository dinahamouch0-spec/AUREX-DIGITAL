/* Search across the whole catalogue.

   The index is fetched once, on first open — 488 rows is small, and loading
   it on every page would tax the 99% of visits that never search. Matching is
   a scored substring pass: a name that starts with the term beats one that
   merely contains it, which is what people expect when they type "iso". */
let index = null;
let loading = null;

const load = () => (loading ||= fetch('/assets/search-index.json')
  .then((r) => r.json())
  .then((rows) => (index = rows))
  .catch(() => (index = [])));

function score(row, q) {
  const name = row[1].toLowerCase();
  const brand = row[2].toLowerCase();
  if (name.startsWith(q)) return 100;
  if (brand.startsWith(q)) return 80;
  const i = name.indexOf(q);
  if (i === 0) return 90;
  if (i > 0) return 60 - Math.min(i, 30);
  if (brand.includes(q)) return 40;
  /* every word must appear somewhere, so "gold whey" finds Gold Standard Whey */
  const hay = name + ' ' + brand;
  return q.split(/\s+/).every((w) => hay.includes(w)) ? 20 : 0;
}

export function search() {
  const open = document.getElementById('search-open');
  if (!open) return;

  const dlg = document.getElementById('search-dlg');
  const input = document.getElementById('search-q');
  const out = document.getElementById('search-out');
  const count = document.getElementById('search-n');

  const money = (n) => (Number.isInteger(n) ? '$' + n : '$' + n.toFixed(2));

  const run = () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { out.innerHTML = ''; count.textContent = ''; return; }
    if (!index) { out.innerHTML = '<p class="sr-note">Loading the catalogue…</p>'; return; }

    const hits = index.map((r) => [score(r, q), r]).filter(([s]) => s > 0)
      .sort((a, b) => b[0] - a[0] || a[1][1].localeCompare(b[1][1]))
      .slice(0, 24);

    count.textContent = hits.length ? `${hits.length}${hits.length === 24 ? '+' : ''} found` : '';
    out.innerHTML = hits.length
      ? hits.map(([, r]) => `
        <a class="sr" href="/product/${r[0]}/">
          <img src="${r[4]}" alt="" width="52" height="52" loading="lazy">
          <span><b>${r[1]}</b><i>${r[2]}</i></span>
          <em>${money(r[3])}</em>
        </a>`).join('')
      : `<p class="sr-note">Nothing matches “${input.value.trim()}”.</p>`;
  };

  open.addEventListener('click', async () => {
    dlg.showModal();
    input.focus();
    await load();
    run();
  });
  document.getElementById('search-close')?.addEventListener('click', () => dlg.close());
  input.addEventListener('input', run);
  /* Enter on a single result goes straight there. */
  input.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const first = out.querySelector('.sr');
    if (first) { e.preventDefault(); location.href = first.href; }
  });
}
