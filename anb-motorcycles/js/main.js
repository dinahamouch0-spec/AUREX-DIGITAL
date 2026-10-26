/* ANB Motorcycles: interactions and motion.
   Everything is visible without this file; motion is layered on top and is
   skipped when the visitor prefers reduced motion or GSAP fails to load. */
(() => {
  const WA = '96170500100';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const animate = !!(G && ST) && !reduce;
  if (animate) G.registerPlugin(ST);

  /* ------------------------------------------------ WhatsApp deep links */
  $$('[data-wa]').forEach(a => {
    a.href = `https://wa.me/${WA}?text=${encodeURIComponent(a.dataset.wa)}`;
    a.target = '_blank';
    a.rel = 'noopener';
  });

  // Feed rows loop seamlessly: the track holds two copies and slides by half.
  $$('.feed__track').forEach(t => {
    [...t.children].forEach(img => {
      const c = img.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      t.appendChild(c);
    });
  });

  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------- nav */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('is-solid', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#burger');
  const links = $('#navLinks');
  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  const navMap = new Map($$('a', links).map(a => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navMap.forEach(a => a.classList.remove('is-active'));
      navMap.get(en.target.id)?.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* ---------------------------------------------------- hero slideshow */
  const frames = $$('.hero__frame img');
  const bars = $$('.hero__bars i');
  const plateNum = $('#plateNum'), plateName = $('#plateName'), plateTag = $('#plateTag');
  let slide = 0;
  const show = i => {
    frames[slide].classList.remove('is-on');
    bars[slide]?.classList.remove('is-on');
    slide = (i + frames.length) % frames.length;
    const img = frames[slide];
    img.loading = 'eager';
    img.classList.add('is-on');
    bars[slide]?.classList.add('is-on');
    plateNum.textContent = String(slide + 1).padStart(2, '0');
    plateName.textContent = img.dataset.name;
    plateTag.textContent = img.dataset.tag;
    if (animate) G.fromTo('.plate', { xPercent: -8, opacity: .4 }, { xPercent: 0, opacity: 1, duration: .5, ease: 'power3.out' });
  };
  bars[0]?.classList.add('is-on');
  if (!reduce && frames.length > 1) {
    let timer = setInterval(() => show(slide + 1), 4200);
    document.addEventListener('visibilitychange', () => {
      clearInterval(timer);
      if (!document.hidden) timer = setInterval(() => show(slide + 1), 4200);
    });
  }

  /* -------------------------------------------- speed lines background */
  const cv = $('#speedLines');
  if (cv) {
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, streaks = [], running = true;
    const make = () => ({
      x: Math.random() * w, y: Math.random() * h,
      len: 60 + Math.random() * 260, v: 6 + Math.random() * 18,
      a: .05 + Math.random() * .22, hot: Math.random() < .28,
    });
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      streaks = Array.from({ length: Math.round(w / 18) }, make);
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of streaks) {
        const g = ctx.createLinearGradient(s.x, 0, s.x + s.len, 0);
        const c = s.hot ? '225,10,42' : '243,240,234';
        g.addColorStop(0, `rgba(${c},0)`);
        g.addColorStop(1, `rgba(${c},${s.a})`);
        ctx.strokeStyle = g;
        ctx.lineWidth = s.hot ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + s.len, s.y); ctx.stroke();
      }
    };
    const tick = () => {
      if (!running) return;
      for (const s of streaks) {
        s.x -= s.v;
        if (s.x + s.len < 0) { Object.assign(s, make()); s.x = w + Math.random() * 200; }
      }
      draw();
      requestAnimationFrame(tick);
    };
    size(); draw();
    addEventListener('resize', () => { size(); draw(); });
    if (!reduce) {
      new IntersectionObserver(([en]) => {
        const was = running; running = en.isIntersecting;
        if (running && !was) requestAnimationFrame(tick);
      }).observe(cv);
      requestAnimationFrame(tick);
    }
  }

  /* ------------------------------------------------------- count-ups */
  const fmt = (el, v) => {
    const dec = +el.dataset.dec || 0;
    el.textContent = (el.dataset.prefix || '') + v.toFixed(dec) + (el.dataset.suffix || '');
  };
  if (!reduce) {
    const co = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      co.unobserve(en.target);
      const el = en.target, end = +el.dataset.count, t0 = performance.now(), dur = 1400;
      const step = t => {
        const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
        fmt(el, end * e);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    $$('[data-count]').forEach(el => co.observe(el));
  }

  /* -------------------------------------------------- tachometer dial */
  const ticks = $('#tachoTicks');
  if (ticks) {
    const NS = 'http://www.w3.org/2000/svg';
    const pt = (t, r) => {
      const a = (225 - 270 * t) * Math.PI / 180;
      return [160 + r * Math.cos(a), 160 - r * Math.sin(a)];
    };
    for (let i = 0; i <= 20; i++) {
      const t = i / 20, major = i % 2 === 0;
      const [x1, y1] = pt(t, 128), [x2, y2] = pt(t, major ? 112 : 120);
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2);
      l.setAttribute('class', 'tacho__tick' + (major ? ' tacho__tick--major' : ''));
      ticks.appendChild(l);
      if (major) {
        const [tx, ty] = pt(t, 96);
        const s = document.createElementNS(NS, 'text');
        s.setAttribute('x', tx); s.setAttribute('y', ty); s.setAttribute('class', 'tacho__lbl');
        s.textContent = i / 2;
        ticks.appendChild(s);
      }
    }
  }
  const needle = $('#tachoNeedle'), fill = $('#tachoFill'), num = $('#tachoNum');
  const setRpm = r => { // r in thousands, 0..10
    const t = Math.max(0, Math.min(r / 10, 1));
    needle.style.transform = `rotate(${(t - .5) * 270}deg)`;
    fill.style.strokeDashoffset = 100 - t * 100;
    num.textContent = r.toFixed(1);
  };
  setRpm(reduce ? 6 : 1.2);

  /* ------------------------------------------------------- filters */
  const chips = $$('.chip');
  const bikes = $$('.bike[data-brand]');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', String(x === c)); });
    const f = c.dataset.filter;
    bikes.forEach(b => { b.hidden = f !== 'all' && b.dataset.brand !== f; });
    const rail = $('#rail');
    rail.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
    if (animate) {
      ST.refresh();
      G.fromTo(bikes.filter(b => !b.hidden), { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: .05, duration: .5, ease: 'power3.out' });
    }
  }));
  const bar = $('#railBar');
  const railEl = $('#rail');
  railEl.addEventListener('scroll', () => {
    const max = railEl.scrollWidth - railEl.clientWidth;
    bar.style.transform = `scaleX(${max > 0 ? Math.max(.08, railEl.scrollLeft / max) : 1})`;
  }, { passive: true });

  /* ------------------------------------------------------ copy buttons */
  $$('.copy').forEach(b => b.addEventListener('click', () => {
    const done = () => { b.textContent = 'Copied'; b.classList.add('is-done'); setTimeout(() => { b.textContent = 'Copy'; b.classList.remove('is-done'); }, 1600); };
    const pick = () => { const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); const s = getSelection(); s.removeAllRanges(); s.addRange(r); };
    try { navigator.clipboard.writeText(b.dataset.copy).then(done, pick); } catch { pick(); }
  }));

  /* ---------------------------------------- pointer: magnet and tilt */
  if (finePointer && !reduce) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
    $$('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  if (!animate) return;

  /* ============================================================ GSAP */

  // Hero entrance: letters drop in like a start-light sequence.
  const title = $('.hero__title');
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span'); w.className = 'w';
          [...part].forEach(ch => {
            const s = document.createElement('span'); s.className = 'ch'; s.textContent = ch; w.appendChild(s);
          });
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
  $$('.line', title).forEach(l => l.setAttribute('aria-hidden', 'true'));
  walk(title);

  G.timeline({ defaults: { ease: 'power4.out' } })
    .from('.hero .eyebrow', { x: -30, opacity: 0, duration: .6 })
    .from('.hero__title .ch', { yPercent: 120, rotate: 10, opacity: 0, duration: .9, stagger: .028 }, '-=.3')
    .from('.hero__lede', { y: 24, opacity: 0, duration: .7 }, '-=.6')
    .from('.hero__ctas > *', { y: 24, opacity: 0, duration: .6, stagger: .08 }, '-=.5')
    .from('.hero__frame', { clipPath: 'polygon(14% 0, 14% 0, 14% 100%, 0 100%, 0 100%, 0 14%)', duration: 1.2, ease: 'expo.inOut' }, .15)
    .from('.plate', { xPercent: -120, duration: .8 }, '-=.4')
    .from('.cluster__cell', { y: 40, opacity: 0, duration: .7, stagger: .08 }, '-=.6');

  // Hero image drifts slower than the page.
  G.to('.hero__frame', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  G.to('.hero__copy', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Marquee leans with scroll speed.
  const skewTo = G.quickTo('.marquee__track', 'skewX', { duration: .4, ease: 'power3' });
  ST.create({ onUpdate: s => skewTo(G.utils.clamp(-14, 14, s.getVelocity() / -220)) });

  // Section reveals start from a readable state, never fully hidden.
  $$('.reveal').forEach(el => {
    G.from(el, { y: 46, opacity: .15, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  G.from('.bento .tile', { y: 60, opacity: .15, duration: .9, ease: 'power3.out', stagger: .07, scrollTrigger: { trigger: '.bento', start: 'top 82%', once: true } });

  // Showroom: horizontal ride on wide screens.
  const mm = G.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const rail = $('#rail'), track = $('#railTrack');
    rail.classList.add('is-pinned');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth + 32);
    const tw = G.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.models__pin', start: () => 'top ' + nav.offsetHeight, end: () => '+=' + dist(),
        pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: s => { bar.style.transform = `scaleX(${Math.max(.08, s.progress)})`; },
      },
    });
    return () => { rail.classList.remove('is-pinned'); tw.scrollTrigger?.kill(); G.set(track, { x: 0 }); };
  });

  // Service: rev the engine, settle at a healthy idle.
  const rpm = { v: 1.2 };
  G.timeline({ scrollTrigger: { trigger: '.tacho', start: 'top 75%', once: true }, onUpdate: () => setRpm(rpm.v) })
    .to(rpm, { v: 10, duration: 1.1, ease: 'power2.in' })
    .to(rpm, { v: 3.2, duration: .7, ease: 'power2.out' })
    .to(rpm, { v: 8.4, duration: .8, ease: 'power3.inOut' })
    .to(rpm, { v: 6.5, duration: 1.2, ease: 'elastic.out(1, .4)' });

  G.from('.service__pics figure', { clipPath: 'inset(0 100% 0 0)', duration: 1.1, ease: 'expo.inOut', stagger: .12, scrollTrigger: { trigger: '.service__pics', start: 'top 85%', once: true } });

  addEventListener('load', () => ST.refresh());
})();
