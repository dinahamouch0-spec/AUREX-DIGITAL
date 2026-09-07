/* The boot sequence. Holds for the briefed 2.5s, counts honestly against that
   clock, then hands the page over. Fonts and the first stage images are given
   that window to arrive, so the hero lands complete rather than reflowing.

   It runs once per visit, not once per page. A shop is navigated — category,
   product, back, product — and 2.5 seconds in front of every one of those
   turns the signature moment into a toll gate. The flag lives in
   sessionStorage, so it returns for a genuinely new visit. */
const M = window.AUREX_MOTION || { loaderMs: 2500 };
const SEEN = 'aurex.booted';

const alreadyBooted = () => {
  try { return sessionStorage.getItem(SEEN) === '1'; } catch { return false; }
};
const remember = () => {
  try { sessionStorage.setItem(SEEN, '1'); } catch { /* private mode: boot each time */ }
};

export function boot() {
  const el = document.getElementById('boot');
  if (!el) return Promise.resolve();

  if (alreadyBooted()) {
    el.remove();
    document.documentElement.dataset.boot = '0';
    return Promise.resolve();
  }

  const pct = document.getElementById('boot-pct');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hold = reduced ? 400 : M.loaderMs;
  const t0 = performance.now();

  return new Promise((done) => {
    let raf;
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / hold);
      if (pct) pct.textContent = Math.round(p * 100) + '%';
      if (p < 1) { raf = requestAnimationFrame(tick); return; }
      cancelAnimationFrame(raf);
      remember();
      el.hidden = true;
      document.documentElement.dataset.boot = '0';
      el.addEventListener('transitionend', () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 900);
      done();
    };
    raf = requestAnimationFrame(tick);
  });
}
