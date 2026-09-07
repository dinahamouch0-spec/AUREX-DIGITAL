/* The boot sequence. Holds for the briefed 2.5s, counts honestly against that
   clock, then hands the page over. Fonts and the first stage images are given
   that window to arrive, so the hero lands complete rather than reflowing. */
const M = window.AUREX_MOTION || { loaderMs: 2500 };

export function boot() {
  const el = document.getElementById('boot');
  if (!el) return Promise.resolve();
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
      el.hidden = true;
      document.documentElement.dataset.boot = '0';
      el.addEventListener('transitionend', () => el.remove(), { once: true });
      setTimeout(() => el.remove(), 900);
      done();
    };
    raf = requestAnimationFrame(tick);
  });
}
