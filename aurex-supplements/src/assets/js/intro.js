/* The category opening.

   Plays once per section per visit. Any input — click, key, scroll, touch —
   ends it immediately: the sequence is a welcome, not a turnstile, and the
   second time someone comes back to a shelf they want the shelf. */
const KEY = 'aurex.intro.';

export function intro({ afterFullBoot = false } = {}) {
  const el = document.getElementById('intro');
  if (!el) return;

  const slug = el.dataset.group;
  const seen = () => { try { return sessionStorage.getItem(KEY + slug) === '1'; } catch { return false; } };
  const remember = () => { try { sessionStorage.setItem(KEY + slug, '1'); } catch { /* private mode */ } };

  /* Landing straight on a section from a cold start already spent 2.5s on the
     loader. Following it with the opening makes four seconds before the shelf
     appears — two arrival moments back to back is one too many. The loader
     was the arrival; the opening waits for the next section. */
  if (seen() || afterFullBoot) {
    /* Mark it either way. Landing cold on a section still counts as arriving
       at it, and coming back to a shelf you have already stood in front of
       should be instant — the opening is for finding a section, not for
       every return trip to one. */
    remember();
    el.remove();
    return;
  }
  remember();
  el.classList.add('play');          // the boot sequence is done; go

  /* The page underneath must not scroll while the overlay is up, or a stray
     wheel event leaves the visitor part-way down a list they cannot see. */
  const html = document.documentElement;
  const prev = html.style.overflow;
  html.style.overflow = 'hidden';

  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    html.style.overflow = prev;
    el.classList.add('skip');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 600);
    for (const [type, fn] of listeners) removeEventListener(type, fn, true);
  };

  const listeners = [['pointerdown', end], ['keydown', end], ['wheel', end], ['touchstart', end]];
  for (const [type, fn] of listeners) addEventListener(type, fn, true);

  /* The CSS finishes on its own; this is the cleanup that follows it. */
  setTimeout(end, 2000);
}
