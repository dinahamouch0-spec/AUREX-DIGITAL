/* The section opening.

   Adds one class and sets, per card, the offset back to the tub it came out
   of. The animation itself is CSS; this only measures, because where the tub
   sits depends on the viewport and hard-coding that would break the illusion
   at the first breakpoint.

   Runs once per section per visit. No overlay, nothing blocked: the page is
   readable from the first frame whether this runs or not. */
const KEY = 'aurex.open.';

export function sectionOpen() {
  const tub = document.getElementById('tub');
  const grid = document.getElementById('grid');
  if (!tub || !grid) return;

  const slug = location.pathname.split('/').filter(Boolean).pop() || 'all';
  try {
    if (sessionStorage.getItem(KEY + slug) === '1') return;
    sessionStorage.setItem(KEY + slug, '1');
  } catch { /* private mode: it plays each time, which is harmless */ }

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const from = tub.getBoundingClientRect();
  const ox = from.left + from.width / 2;
  const oy = from.top + from.height / 2;

  /* Only the cards on screen are worth animating — the rest are scrolled to
     later, by which time the moment has passed. */
  const cards = [...grid.children].slice(0, 12);
  cards.forEach((card, i) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--tx', `${Math.round(ox - (r.left + r.width / 2))}px`);
    card.style.setProperty('--ty', `${Math.round(oy - (r.top + r.height / 2))}px`);
    card.style.setProperty('--i', i);
  });

  document.body.classList.add('open');
  /* Clear the inline offsets once it is over so a later reflow cannot leave a
     card sitting on a stale transform. */
  setTimeout(() => {
    document.body.classList.remove('open');
    cards.forEach((c) => {
      c.style.removeProperty('--tx');
      c.style.removeProperty('--ty');
      c.style.removeProperty('--i');
    });
  }, 2200);
}
