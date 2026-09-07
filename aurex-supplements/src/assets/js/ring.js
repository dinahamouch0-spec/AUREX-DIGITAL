/* The rotating product ring.

   Momentum lives in one number: `vel`, degrees per frame. Idle drift, drag
   and the flick that follows all write to it, so there is a single source of
   truth for where the ring is pointing and no two systems to keep in sync. */
export function ring() {
  const stage = document.getElementById('stage');
  const el = document.getElementById('ring');
  if (!stage || !el) return;

  const faces = [...el.querySelectorAll('.ring__face')];
  const n = faces.length;
  if (!n) return;

  const step = 360 / n;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DRIFT = reduced ? 0 : -0.055;      // degrees per frame, anticlockwise
  const nameEl = document.getElementById('stage-name');
  const metaEl = document.getElementById('stage-meta');
  const meta = faces.map((f) => f.getAttribute('aria-label') || '');

  let spin = 0, vel = DRIFT, front = -1, dragging = false, lastX = 0, lastT = 0;

  /* Fit the ring to the band rather than guessing. For n faces of width w on
     a cylinder, r = (w/2) / tan(pi/n), and the ring spans 2r + w. Solving for
     the widest face that still fits the stage gives w = S / (1/tan(pi/n) + 1);
     height caps it too, since a face is square. */
  const measure = () => {
    const t = Math.tan(Math.PI / n);
    const byWidth = (stage.clientWidth * 0.92) / (1 / t + 1);
    const byHeight = stage.clientHeight * 0.86;
    const w = Math.max(120, Math.min(byWidth, byHeight));
    el.style.setProperty('--fw', Math.round(w) + 'px');
    el.style.setProperty('--r', Math.round((w / 2) / t) + 'px');
  };

  const paint = () => {
    el.style.setProperty('--spin', spin.toFixed(2) + 'deg');
    /* Which face is nearest the camera, and how far each has turned away. */
    let best = 0, bestC = -2;
    for (let i = 0; i < n; i++) {
      const a = ((i * step + spin) % 360 + 360) % 360;
      const c = Math.cos(a * Math.PI / 180);
      faces[i].style.setProperty('--o', (0.34 + 0.66 * (c + 1) / 2).toFixed(3));
      if (c > bestC) { bestC = c; best = i; }
    }
    if (best !== front) {
      faces[front]?.classList.remove('is-front');
      faces[best].classList.add('is-front');
      front = best;
      const [name, rest] = (meta[best] || '').split(' — ');
      if (nameEl) nameEl.textContent = name || '';
      if (metaEl && rest) metaEl.textContent = rest;
    }
  };

  const frame = () => {
    if (!dragging) {
      vel += (DRIFT - vel) * 0.02;          // ease back to the idle drift
      spin += vel;
      paint();
    }
    requestAnimationFrame(frame);
  };

  /* --- drag ------------------------------------------------------------- */
  const down = (x) => { dragging = true; lastX = x; lastT = performance.now(); stage.classList.add('dragging'); };
  const move = (x) => {
    if (!dragging) return;
    const dx = x - lastX, dt = Math.max(1, performance.now() - lastT);
    spin += dx * 0.3;
    vel = (dx * 0.3) / dt * 16;             // carry the throw into momentum
    lastX = x; lastT = performance.now();
    paint();
  };
  const up = () => { dragging = false; stage.classList.remove('dragging'); };

  stage.addEventListener('pointerdown', (e) => { down(e.clientX); stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', (e) => move(e.clientX));
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  /* A drag should not also open the product it started on. */
  stage.addEventListener('click', (e) => {
    if (Math.abs(vel) > 0.6) e.preventDefault();
  }, true);

  /* Keyboard: the ring is a list, so arrows step it face by face. */
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { spin += step; paint(); }
    if (e.key === 'ArrowRight') { spin -= step; paint(); }
  });

  addEventListener('resize', measure, { passive: true });
  measure();
  stage.classList.add('ready');
  paint();
  requestAnimationFrame(frame);
}
