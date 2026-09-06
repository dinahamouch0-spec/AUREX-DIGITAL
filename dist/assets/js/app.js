/* Ya 7kayti — storefront behaviour.
   Small, dependency-free and progressive: every feature degrades to working
   HTML if it fails. Part 1 §34.                                              */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------- loader ----- */
  /* Part 1 §9: short, never delays a ready page, and always dismisses — a
     watchdog fires even if an asset hangs or an error is thrown.             */
  (function loader() {
    var el = document.getElementById('loader');
    if (!el) return;

    var done = false;
    function dismiss() {
      if (done) return;
      done = true;
      el.classList.add('is-done');
      // Remove from the a11y tree and layout once the fade finishes.
      window.setTimeout(function () { el.hidden = true; }, reduced ? 0 : 420);
    }

    // Repeat visits within the session skip the animation entirely.
    var seen = false;
    try { seen = sessionStorage.getItem('yk_seen') === '1'; } catch (e) {}
    if (seen) { el.hidden = true; return; }
    try { sessionStorage.setItem('yk_seen', '1'); } catch (e) {}

    var MIN = reduced ? 0 : 420;   // just long enough to read as intentional
    var start = Date.now();
    function finish() {
      var wait = Math.max(0, MIN - (Date.now() - start));
      window.setTimeout(dismiss, wait);
    }

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });

    // Watchdog: nothing keeps the loader up past 2.5s, whatever went wrong.
    window.setTimeout(dismiss, 2500);
    window.addEventListener('error', dismiss, { once: true });
  }());

  /* ------------------------------------------------------ sticky header -- */
  (function stickyHeader() {
    var h = document.getElementById('header');
    if (!h) return;
    var ticking = false;
    function update() {
      h.classList.toggle('is-stuck', window.scrollY > 8);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }());

  /* ------------------------------------------------------ mobile drawer -- */
  (function drawer() {
    var d = document.getElementById('drawer');
    var openBtn = document.querySelector('[data-drawer-open]');
    if (!d || !openBtn) return;

    var lastFocus = null;

    function focusables() {
      return Array.prototype.filter.call(
        d.querySelectorAll('a[href], button:not([disabled])'),
        function (el) { return el.offsetParent !== null; }
      );
    }

    function open() {
      lastFocus = document.activeElement;
      d.hidden = false;
      // Next frame so the transition runs from the closed position.
      window.requestAnimationFrame(function () {
        d.classList.add('is-open');
        openBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
        // Focus only once the panel is actually visible: an element still
        // resolving `visibility: hidden` cannot take focus, so moving it in
        // the same frame as the class silently does nothing.
        window.requestAnimationFrame(function () {
          var f = focusables();
          if (f.length) f[0].focus();
        });
      });
    }

    function close() {
      d.classList.remove('is-open');
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      window.setTimeout(function () { d.hidden = true; }, reduced ? 0 : 300);
      if (lastFocus) lastFocus.focus();
    }

    openBtn.addEventListener('click', open);
    Array.prototype.forEach.call(d.querySelectorAll('[data-drawer-close]'), function (b) {
      b.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (!d.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); return; }
      // Keep focus inside the dialog while it is open. Part 1 §33.
      if (e.key === 'Tab') {
        var f = focusables();
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }());

  /* ------------------------------------------------- locale switching ---- */
  /* Both locales expose identical paths, so switching keeps the visitor on the
     page they were reading instead of dropping them on the home page.        */
  (function localeSwitch() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-locale-switch]'), function (a) {
      var target = a.getAttribute('data-locale-switch');
      var path = window.location.pathname;
      var m = path.match(/^\/(ar|en)(\/.*)?$/);
      if (!m) return;
      var rest = m[2] || '/';
      a.setAttribute('href', '/' + target + rest);
    });
  }());

  /* --------------------------------------------------------- cart count -- */
  /* Reads whatever the Part 2 cart persists; renders 0 and stays silent until
     that exists, rather than guessing at a shape.                            */
  (function cartCount() {
    var els = document.querySelectorAll('[data-cart-count]');
    if (!els.length) return;
    var n = 0;
    try {
      var raw = localStorage.getItem('yk_cart');
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed && parsed.items)) n = parsed.items.length;
        else if (Array.isArray(parsed)) n = parsed.length;
      }
    } catch (e) { n = 0; }
    Array.prototype.forEach.call(els, function (el) {
      el.textContent = String(n);
      el.setAttribute('data-count', String(n));
    });
  }());

  /* ------------------------------------------- failed image fallback ----- */
  /* Part 1 §32: a broken asset shows an intentional box, not a torn icon.   */
  document.addEventListener('error', function (e) {
    var img = e.target;
    if (!img || img.tagName !== 'IMG' || img.dataset.fallbackDone) return;
    img.dataset.fallbackDone = '1';
    var pic = img.closest('picture') || img;
    var box = document.createElement('div');
    box.className = 'img-fallback';
    box.style.aspectRatio = (img.getAttribute('width') || 3) + ' / ' + (img.getAttribute('height') || 2);
    box.textContent = document.documentElement.lang === 'ar'
      ? 'تعذّر تحميل الصورة' : 'Image could not be loaded';
    if (pic.parentNode) pic.parentNode.replaceChild(box, pic);
  }, true);
}());
