/* Elevate with Dina: loader, reveals, counters, course orbit, journey progress, tilt, hero dust */
(function () {
  'use strict';
  var doc = document.documentElement;
  var rtl = doc.dir === 'rtl';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Loader ---------- */
  var loader = $('.loader');
  var start = (window.performance && performance.now) ? performance.now() : 0;
  function hideLoader() {
    if (!loader || loader.classList.contains('done')) return;
    loader.classList.add('done');
    doc.classList.add('loaded');
    try { sessionStorage.setItem('ewd-seen', '1'); } catch (e) {}
    setTimeout(function () { if (loader && loader.parentNode) loader.parentNode.removeChild(loader); }, 1200);
  }
  if (loader) {
    if (doc.classList.contains('seen') || reduce) { hideLoader(); }
    else {
      var minShow = 1500;
      var go = function () {
        var elapsed = ((window.performance && performance.now) ? performance.now() : minShow) - start;
        setTimeout(hideLoader, Math.max(0, minShow - elapsed));
      };
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
      setTimeout(hideLoader, 4000); // never trap the page
    }
  } else { doc.classList.add('loaded'); }

  /* ---------- Header + sticky mobile CTA ---------- */
  var header = $('.site-header');
  var onScrollHeader = function () { if (header) header.classList.toggle('scrolled', window.scrollY > 12); };
  onScrollHeader();
  var y = document.getElementById('yr'); if (y) y.textContent = new Date().getFullYear();
  var m = document.getElementById('mcta'), hero = $('.hero'), fin = document.getElementById('claim');
  if ('IntersectionObserver' in window && m && hero && fin) {
    var heroVis = true, finVis = false;
    var upd = function () {
      var show = !heroVis && !finVis;
      m.classList.toggle('show', show);
      m.setAttribute('aria-hidden', String(!show));
      var a = m.querySelector('a'); if (a) a.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(function (e) { heroVis = e[0].isIntersecting; upd(); }).observe(hero);
    new IntersectionObserver(function (e) { finVis = e[0].isIntersecting; upd(); }).observe(fin);
  }

  /* ---------- Scroll reveals (content stays visible without JS) ---------- */
  var groups = [
    '.section-head', '.pain', '.pain-close', '.machine li', '.machine-foot', '.tile', '.about-copy > *',
    '.portrait-wrap', '.quote', '.fit-col', '.faq details', '.opt', '.final-inner > *', '.stat', '.orbit-ui'
  ];
  var revealEls = [];
  groups.forEach(function (sel) {
    $$(sel).forEach(function (el) {
      var sibs = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.classList.add('reveal');
      el.style.setProperty('--d', Math.min(sibs, 6) * 90 + 'ms');
      revealEls.push(el);
    });
  });
  if ('IntersectionObserver' in window && !reduce) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); rio.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealEls.forEach(function (el) { rio.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Count-up numbers ---------- */
  var counters = $$('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    if (reduce) { el.textContent = target; return; }
    var dur = 1800, t0 = null;
    var step = function (t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * e);
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { runCount(en.target); cio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Journey progress line ---------- */
  var journey = $('.machine');
  var stages = journey ? $$('li', journey) : [];
  function updateJourney() {
    if (!journey) return;
    var r = journey.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    var p = (vh * 0.78 - r.top) / Math.max(1, r.height);
    p = Math.max(0, Math.min(1, p));
    journey.style.setProperty('--p', p.toFixed(3));
    stages.forEach(function (li, i) {
      li.classList.toggle('lit', p >= (stages.length > 1 ? i / (stages.length - 1) : 0) - 0.04);
    });
  }

  /* ---------- Hero photo parallax ---------- */
  var heroImg = $('.hero-photo img');
  function updateParallax() {
    if (!heroImg || reduce) return;
    var sy = Math.min(window.scrollY, 900);
    heroImg.style.transform = 'translate3d(0,' + (sy * 0.06).toFixed(1) + 'px,0) scale(1.06)';
  }

  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { onScrollHeader(); updateJourney(); updateParallax(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', updateJourney);
  updateJourney(); updateParallax();

  /* ---------- 3D tilt on cards (mouse only) ---------- */
  if (finePointer && !reduce) {
    $$('.opt, .tile').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, yy = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--rx', (-yy * 7).toFixed(2) + 'deg');
        card.style.setProperty('--ry', (x * 9).toFixed(2) + 'deg');
        card.style.setProperty('--mx', ((x + 0.5) * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((yy + 0.5) * 100).toFixed(1) + '%');
        card.classList.add('tilting');
      });
      card.addEventListener('pointerleave', function () {
        card.classList.remove('tilting');
        card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ---------- Course orbit: items circle an ellipse, always facing the viewer ---------- */
  var stage = $('[data-orbit]');
  if (stage) (function () {
    var items = $$('.orbit-item', stage);
    var N = items.length, step = 360 / N;
    var rot = 0, target = null, auto = !reduce, paused = false, resumeT = null, visible = true;
    var speed = 9; // degrees per second
    var cap = {
      no: $('.oc-no bdi'), title: $('.oc-title'), sub: $('.oc-sub'), book: $('.oc-book span'),
      box: $('.orbit-caption')
    };
    var dotsBox = $('.orbit-dots');
    var dots = [];
    items.forEach(function (it, i) {
      var d = document.createElement('span'); d.className = 'orbit-dot'; dotsBox.appendChild(d); dots.push(d);
      it.querySelector('.orbit-card').addEventListener('click', function () {
        if (dragMoved) return;
        goTo(i);
      });
    });
    var active = -1;
    function setActive(i) {
      if (i === active) return;
      active = i;
      var it = items[i];
      items.forEach(function (x, k) { x.classList.toggle('is-front', k === i); });
      dots.forEach(function (x, k) { x.classList.toggle('on', k === i); });
      cap.box.classList.remove('swap'); void cap.box.offsetWidth; cap.box.classList.add('swap');
      cap.no.textContent = it.getAttribute('data-no');
      cap.title.textContent = it.getAttribute('data-title');
      cap.sub.textContent = it.getAttribute('data-sub');
      cap.book.textContent = it.getAttribute('data-book');
    }
    function layout() {
      var w = stage.clientWidth, h = stage.clientHeight;
      var small = w < 700;
      var rx = small ? w * 0.27 : Math.min(w * 0.36, 540);
      var ry = small ? 30 : 60;
      var dir = rtl ? -1 : 1;
      items.forEach(function (it, i) {
        var a = (i * step - rot) * Math.PI / 180;
        var c = Math.cos(a), s = Math.sin(a);
        var t = (c + 1) / 2; // 1 front, 0 back
        var x = s * rx * dir, yy = (c - 1) * ry;
        var sc = 0.46 + 0.54 * Math.pow(t, 1.6);
        it.style.transform = 'translate(-50%,-50%) translate3d(' + x.toFixed(1) + 'px,' + yy.toFixed(1) + 'px,0) scale(' + sc.toFixed(3) + ')';
        it.style.zIndex = String(Math.round(t * 100));
        it.style.opacity = (0.12 + 0.88 * Math.pow(t, 1.3)).toFixed(3);
        it.style.filter = 'brightness(' + (0.45 + 0.55 * t).toFixed(3) + ') saturate(' + (0.6 + 0.4 * t).toFixed(2) + ')';
      });
      var idx = ((Math.round(rot / step) % N) + N) % N;
      setActive(idx);
    }
    function goTo(i) {
      var cur = rot / step;
      var base = Math.round(cur);
      var curIdx = ((base % N) + N) % N;
      var diff = i - curIdx;
      if (diff > N / 2) diff -= N;
      if (diff < -N / 2) diff += N;
      target = (base + diff) * step;
      holdAuto(7000);
      if (reduce) { rot = target; target = null; layout(); }
    }
    function nudge(d) {
      var base = Math.round(rot / step);
      target = (base + d) * step;
      holdAuto(7000);
      if (reduce) { rot = target; target = null; layout(); }
    }
    function holdAuto(ms) {
      paused = true; clearTimeout(resumeT);
      resumeT = setTimeout(function () { paused = false; }, ms);
    }
    $$('.orbit-nav').forEach(function (b) {
      b.addEventListener('click', function () { nudge(parseInt(b.getAttribute('data-dir'), 10) * (rtl ? -1 : 1)); });
    });
    stage.addEventListener('mouseenter', function () { paused = true; clearTimeout(resumeT); });
    stage.addEventListener('mouseleave', function () { holdAuto(1200); });
    stage.addEventListener('focusin', function () { paused = true; clearTimeout(resumeT); });
    stage.addEventListener('focusout', function () { holdAuto(3000); });

    // drag / swipe
    var dragging = false, dragMoved = false, lastX = 0;
    stage.addEventListener('pointerdown', function (e) {
      dragging = true; dragMoved = false; lastX = e.clientX; target = null; paused = true; clearTimeout(resumeT);
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      if (Math.abs(dx) > 1) dragMoved = true;
      rot -= dx * 0.25 * (rtl ? -1 : 1);
      if (reduce) layout();
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return; dragging = false;
      if (dragMoved) { target = Math.round(rot / step) * step; holdAuto(5000); }
      setTimeout(function () { dragMoved = false; }, 0);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(stage);
    }
    var last = null;
    function frame(t) {
      if (last == null) last = t;
      var dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (visible) {
        if (target != null) {
          var d = target - rot;
          rot += d * Math.min(1, dt * 7);
          if (Math.abs(d) < 0.05) { rot = target; target = null; }
        } else if (auto && !paused && !dragging) {
          rot += speed * dt;
        }
        layout();
      }
      requestAnimationFrame(frame);
    }
    stage.classList.add('is-live');
    layout();
    if (!reduce) requestAnimationFrame(frame);
    window.addEventListener('resize', layout);
  })();

  /* ---------- Hero gold dust ---------- */
  var cv = $('.hero-dust');
  if (cv && cv.getContext && !reduce) (function () {
    var ctx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), parts = [], run = true;
    function size() {
      var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function mk(randomY) {
      return { x: Math.random() * W, y: randomY ? Math.random() * H : H + 10, r: Math.random() * 1.6 + 0.4,
        v: Math.random() * 0.25 + 0.08, a: Math.random() * 0.5 + 0.15, w: Math.random() * Math.PI * 2 };
    }
    size();
    var count = W < 700 ? 26 : 55;
    for (var i = 0; i < count; i++) parts.push(mk(true));
    window.addEventListener('resize', size);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { run = e[0].isIntersecting; }).observe(cv);
    (function loop() {
      if (run) {
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y -= p.v; p.w += 0.01; p.x += Math.sin(p.w) * 0.15;
          if (p.y < -10) parts[i] = mk(false);
          var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          g.addColorStop(0, 'rgba(246,227,172,' + p.a + ')'); g.addColorStop(1, 'rgba(232,196,106,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
        }
      }
      requestAnimationFrame(loop);
    })();
  })();
})();
