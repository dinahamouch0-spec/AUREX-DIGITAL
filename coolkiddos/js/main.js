/* Coolkiddos — interactions & motion */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } },
  };

  /* ---------------- i18n ---------------- */
  const EN = {};
  $$('[data-i18n]').forEach(el => { EN[el.dataset.i18n] = el.innerHTML; });
  let lang = store.get('ck-lang', 'en');
  const t = key => (I18N[lang] && I18N[lang][key]) ?? I18N.en[key] ?? EN[key] ?? key;

  function applyLang() {
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach(el => {
      const k = el.dataset.i18n;
      el.innerHTML = lang === 'ar' && I18N.ar[k] ? I18N.ar[k] : EN[k];
    });
    renderGrid();
    renderBag();
    movePill();
    if (winterMM) setupWinter();
    if (hasGsap && window.ScrollTrigger) ScrollTrigger.refresh();
  }
  $('.lang').addEventListener('click', () => {
    lang = lang === 'en' ? 'ar' : 'en';
    store.set('ck-lang', lang);
    if (hasGsap && !reduceMotion) {
      gsap.timeline()
        .to('main, .footer', { opacity: 0, y: 8, duration: .25, ease: 'power2.in' })
        .add(applyLang)
        .to('main, .footer', { opacity: 1, y: 0, duration: .5, ease: 'power3.out', clearProps: 'transform' });
    } else applyLang();
  });

  /* ---------------- Products ---------------- */
  const grid = $('#grid');
  const byId = id => PRODUCTS.find(p => p.id === id);
  const money = n => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
  let activeFilter = 'all';

  const matches = (p, f) => f === 'all' || p.cat === f || (f === 'fleece' && p.fabric === 'fleece');

  function cardHTML(p) {
    const price = p.price != null
      ? `<span class="card__price">${money(p.price)}</span>`
      : `<span class="card__price card__price--ask">${t('ask')}</span>`;
    const badges = [`<span class="pill pill--${p.fabric}">${t(p.fabric)}</span>`];
    if (p.tag === 'turkey') badges.push(`<span class="pill pill--turkey">${t('turkey')}</span>`);
    return `<article class="card${matches(p, activeFilter) ? '' : ' is-hidden'}" data-id="${p.id}">
      <div class="card__media" data-cursor="view">
        <img src="img/${p.id}.webp" alt="${p.name[lang]}" loading="lazy" width="387" height="514">
        <div class="card__badges">${badges.join('')}</div>
        <button class="card__quick" type="button" data-quick="${p.id}">${t('quick')}</button>
      </div>
      <div class="card__info">
        <div><h3 class="card__name">${p.name[lang]}</h3><p class="card__sizes">${p.sizes[0]} – ${p.sizes[p.sizes.length - 1]}</p></div>
        ${price}
      </div>
    </article>`;
  }

  function renderGrid() {
    grid.innerHTML = PRODUCTS.map(cardHTML).join('');
    bindCards();
  }

  function bindCards() {
    $$('.card__media', grid).forEach(m => {
      m.addEventListener('click', e => {
        if (!e.target.closest('[data-quick]')) openQuick(m.parentElement.dataset.id);
      });
      if (!finePointer || reduceMotion) return;
      m.addEventListener('pointermove', e => {
        const r = m.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        m.style.transform = `perspective(900px) rotateY(${(x - .5) * 8}deg) rotateX(${(.5 - y) * 8}deg)`;
        m.style.setProperty('--mx', `${x * 100}%`);
        m.style.setProperty('--my', `${y * 100}%`);
      });
      m.addEventListener('pointerleave', () => { m.style.transform = ''; });
    });
    $$('[data-quick]', grid).forEach(b => b.addEventListener('click', () => openQuick(b.dataset.quick)));
    bindCursorTargets(grid);
  }

  /* Filters with sliding pill */
  const pill = $('.filter__pill');
  function movePill() {
    const a = $('.filter.is-active');
    if (!a) return;
    pill.style.left = `${a.offsetLeft}px`;
    pill.style.width = `${a.offsetWidth}px`;
  }
  function setFilter(f) {
    activeFilter = f;
    $$('.filter').forEach(b => {
      const on = b.dataset.filter === f;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', on);
    });
    movePill();
    const cards = $$('.card', grid);
    const apply = () => cards.forEach(c => c.classList.toggle('is-hidden', !matches(byId(c.dataset.id), f)));
    if (hasGsap && !reduceMotion) {
      gsap.to(cards, { opacity: 0, y: 14, duration: .2, stagger: .01, ease: 'power2.in', onComplete() {
        apply();
        const shown = cards.filter(c => !c.classList.contains('is-hidden'));
        gsap.fromTo(shown, { opacity: 0, y: 24, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .55, stagger: { each: .05, grid: 'auto' }, ease: 'back.out(1.4)', clearProps: 'transform' });
        window.ScrollTrigger && ScrollTrigger.refresh();
      } });
    } else apply();
  }
  $$('.filter').forEach(b => b.addEventListener('click', () => setFilter(b.dataset.filter)));
  $$('.tile[data-filter]').forEach(tile => tile.addEventListener('click', e => {
    e.preventDefault();
    setFilter(tile.dataset.filter);
    scrollToEl($('#shop'));
  }));
  addEventListener('resize', movePill);

  /* ---------------- Quick view ---------------- */
  const qv = $('.qv');
  let qvProduct = null, lastFocus = null;

  function openQuick(id) {
    const p = byId(id);
    if (!p) return;
    qvProduct = p;
    lastFocus = document.activeElement;
    $('.qv__media img', qv).src = `img/${p.id}.webp`;
    $('.qv__media img', qv).alt = p.name[lang];
    $('.qv__cat', qv).textContent = t('cat_' + p.cat);
    $('.qv__title', qv).textContent = p.name[lang];
    const price = $('.qv__price', qv);
    price.textContent = p.price != null ? money(p.price) : t('ask');
    price.classList.toggle('is-ask', p.price == null);
    $('.qv__fabric', qv).textContent = [t(p.fabric), p.tag === 'turkey' ? t('turkey') : ''].filter(Boolean).join(' · ');
    $('.sizes__list', qv).innerHTML = p.sizes.map(s =>
      `<label class="size"><input type="radio" name="size" value="${s}"><span>${s}</span></label>`).join('');
    $('.qv__err', qv).textContent = '';
    qv.hidden = false;
    lenis && lenis.stop();
    document.body.style.overflow = 'hidden';
    if (hasGsap && !reduceMotion) {
      gsap.fromTo('.qv__scrim', { opacity: 0 }, { opacity: 1, duration: .35 });
      gsap.fromTo('.qv__panel', { opacity: 0, y: 40, scale: .96 }, { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'expo.out' });
      gsap.fromTo('.qv__body > *', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, stagger: .05, delay: .12, ease: 'power3.out' });
    }
    $('.qv__close', qv).focus();
  }
  function closeQuick() {
    if (qv.hidden) return;
    const done = () => { qv.hidden = true; document.body.style.overflow = ''; lenis && lenis.start(); lastFocus && lastFocus.focus(); };
    if (hasGsap && !reduceMotion) {
      gsap.to('.qv__panel', { opacity: 0, y: 20, scale: .98, duration: .25, ease: 'power2.in' });
      gsap.to('.qv__scrim', { opacity: 0, duration: .25, onComplete: done });
    } else done();
  }
  $$('[data-close]', qv).forEach(el => el.addEventListener('click', closeQuick));
  $('.qv__add').addEventListener('click', () => {
    const chosen = $('input[name="size"]:checked', qv);
    if (!chosen) {
      $('.qv__err', qv).textContent = t('pickSize');
      hasGsap && !reduceMotion && gsap.fromTo('.sizes__list', { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1, .3)' });
      return;
    }
    addToBag(qvProduct.id, chosen.value);
    flyToBag($('.qv__media img', qv));
    closeQuick();
    toast(t('added'));
  });

  /* Focus trap + Escape for dialogs */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeQuick(); closeBag(); closeMenu(); }
    if (e.key !== 'Tab') return;
    const scope = !qv.hidden ? $('.qv__panel') : bag.classList.contains('is-open') ? $('.bag__panel') : null;
    if (!scope) return;
    const f = $$('button, [href], input, [tabindex]:not([tabindex="-1"])', scope).filter(el => !el.disabled && el.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  /* ---------------- Order bag ---------------- */
  const bag = $('.bag');
  let items = store.get('ck-bag', []).filter(i => byId(i.id));

  function addToBag(id, size) {
    const ex = items.find(i => i.id === id && i.size === size);
    ex ? ex.qty++ : items.push({ id, size, qty: 1 });
    saveBag();
  }
  function saveBag() { store.set('ck-bag', items); renderBag(); }

  function renderBag() {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const c = $('.bag-btn__count');
    c.textContent = count;
    c.classList.toggle('has-items', count > 0);
    $('.bag__list').innerHTML = items.map((i, idx) => {
      const p = byId(i.id);
      return `<li class="bag__item">
        <img src="img/${p.id}.webp" alt="" width="64" height="84">
        <div><h4>${p.name[lang]}</h4><p>${i.size} · ${p.price != null ? money(p.price) : t('ask')}</p>
          <div class="bag__qty"><button type="button" data-dec="${idx}" aria-label="−">−</button><span>${i.qty}</span><button type="button" data-inc="${idx}" aria-label="+">+</button></div></div>
        <button class="bag__rm" type="button" data-rm="${idx}">${t('remove')}</button>
      </li>`;
    }).join('');
    $('.bag__empty').hidden = items.length > 0;
    $('.bag__foot').hidden = items.length === 0;
    const priced = items.filter(i => byId(i.id).price != null);
    const sum = priced.reduce((n, i) => n + byId(i.id).price * i.qty, 0);
    $('.bag__total').textContent = `${t('total')}: ${money(sum)}${priced.length < items.length ? ' ' + t('plus') : ''}`;
  }
  $('.bag__list').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.inc) items[b.dataset.inc].qty++;
    if (b.dataset.dec) { const i = items[b.dataset.dec]; i.qty > 1 ? i.qty-- : items.splice(b.dataset.dec, 1); }
    if (b.dataset.rm) items.splice(b.dataset.rm, 1);
    saveBag();
  });

  function openBag() {
    lastFocus = document.activeElement;
    bag.classList.add('is-open');
    bag.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    setTimeout(() => $('.bag__head button').focus(), 50);
  }
  function closeBag() {
    if (!bag.classList.contains('is-open')) return;
    bag.classList.remove('is-open');
    bag.setAttribute('aria-hidden', 'true');
    lenis && lenis.start();
    lastFocus && lastFocus.focus();
  }
  $('.bag-btn').addEventListener('click', openBag);
  $$('[data-close-bag]').forEach(el => el.addEventListener('click', closeBag));

  function flyToBag(img) {
    const btn = $('.bag-btn');
    btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    if (!hasGsap || reduceMotion || !img) return;
    const a = img.getBoundingClientRect(), b = btn.getBoundingClientRect();
    const ghost = img.cloneNode();
    Object.assign(ghost.style, { position: 'fixed', left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', objectFit: 'cover', borderRadius: '24px', zIndex: 450, pointerEvents: 'none' });
    document.body.appendChild(ghost);
    gsap.to(ghost, { left: b.left + b.width / 2 - 20, top: b.top + b.height / 2 - 20, width: 40, height: 40, borderRadius: 20, opacity: .3, duration: .8, ease: 'power3.inOut', onComplete: () => ghost.remove() });
  }

  /* ---------------- WhatsApp ---------------- */
  function sendWhatsApp(text, copy) {
    const num = (STORE.whatsappNumber || '').replace(/\D/g, '');
    if (num) { window.open(`https://wa.me/${num}?text=${encodeURIComponent(text)}`, '_blank', 'noopener'); return; }
    // No number yet: the button still works and opens an Instagram chat instead.
    // An order is copied so the customer only has to paste it.
    if (copy) navigator.clipboard?.writeText(text).then(() => toast(t('copied')), () => {});
    window.open(STORE.fallbackChat, '_blank', 'noopener');
  }
  $$('[data-wa]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    sendWhatsApp(a.dataset.wa === 'wholesale' ? t('msgWholesale') : t('msgHello'));
  }));
  $('[data-send-order]').addEventListener('click', () => {
    const lines = items.map(i => {
      const p = byId(i.id);
      return `• ${p.name[lang]} — ${i.size} × ${i.qty}${p.price != null ? ` (${money(p.price * i.qty)})` : ''}`;
    });
    sendWhatsApp([t('msgOrder'), ...lines].join('\n'), true);
  });

  let toastTimer;
  function toast(msg) {
    const el = $('.toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-on'), 2800);
  }

  /* ---------------- Mobile menu ---------------- */
  const burger = $('.burger'), drawer = $('.drawer');
  function closeMenu() {
    if (!drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    burger.setAttribute('aria-expanded', 'false');
    lenis && lenis.start();
  }
  burger.addEventListener('click', () => {
    if (drawer.classList.contains('is-open')) return closeMenu();
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    burger.setAttribute('aria-expanded', 'true');
    lenis && lenis.stop();
    hasGsap && !reduceMotion && gsap.fromTo('.drawer nav a', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: .7, stagger: .06, delay: .15, ease: 'expo.out' });
  });

  /* ---------------- Smooth scroll ---------------- */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ duration: 1.15, easing: x => 1 - Math.pow(1 - x, 4) });
    if (hasGsap) {
      lenis.on('scroll', () => window.ScrollTrigger && ScrollTrigger.update());
      gsap.ticker.add(time => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = time => { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  function scrollToEl(el) {
    if (!el) return;
    lenis ? lenis.scrollTo(el, { offset: -80 }) : el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    if (a.hasAttribute('data-wa') || a.dataset.filter) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    e.preventDefault();
    closeMenu();
    scrollToEl(id === '#top' ? document.body : $(id));
  }));

  /* Header hide/show + progress */
  const header = $('.header'), bar = $('.progress span');
  let lastY = 0;
  function onScroll() {
    const y = scrollY;
    header.classList.toggle('is-scrolled', y > 30);
    header.classList.toggle('is-hidden', y > lastY && y > 500 && !drawer.classList.contains('is-open'));
    lastY = y;
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  }
  addEventListener('scroll', onScroll, { passive: true });

  /* Active nav link */
  const navLinks = $$('.nav a');
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  ['collections', 'shop', 'winter', 'wholesale', 'visit'].forEach(id => io.observe($('#' + id)));

  /* ---------------- Cursor & magnetic ---------------- */
  const cursor = $('.cursor');
  function bindCursorTargets(scope = document) {
    if (!finePointer) return;
    $$('a, button, .tile, [data-cursor]', scope).forEach(el => {
      if (el.dataset.cursorBound) return;
      el.dataset.cursorBound = 1;
      const view = el.dataset.cursor === 'view' || el.classList.contains('tile');
      el.addEventListener('pointerenter', () => cursor.classList.add(view ? 'is-view' : 'is-hover'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('is-view', 'is-hover'));
    });
  }
  if (finePointer && hasGsap && !reduceMotion) {
    const dot = $('.cursor__dot'), ring = $('.cursor__ring');
    const dx = gsap.quickTo(dot, 'x', { duration: .1 }), dy = gsap.quickTo(dot, 'y', { duration: .1 });
    const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
    addEventListener('pointermove', e => { cursor.classList.add('is-on'); dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    bindCursorTargets();

    $$('.magnetic').forEach(el => {
      const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1, .4)' });
      const my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * .3);
        my((e.clientY - r.top - r.height / 2) * .35);
      });
      el.addEventListener('pointerleave', () => { mx(0); my(0); });
    });
  } else cursor.remove();

  /* ---------------- Motion ---------------- */
  function countUp(el) {
    const to = +el.dataset.to;
    if (!hasGsap || reduceMotion) { el.textContent = to.toLocaleString('en-US'); return; }
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US'); } });
  }

  function intro() {
    const loader = $('.loader');
    if (!hasGsap || reduceMotion) {
      loader.remove();
      document.body.classList.remove('is-loading');
      $$('.count').forEach(countUp);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    document.body.classList.add('is-loading');

    gsap.set('.hero__title .line > *', { yPercent: 110 });
    gsap.set(['.eyebrow', '.hero__lead', '.hero__cta', '.hero__stats'], { opacity: 0, y: 24 });
    gsap.set('.arch', { clipPath: 'inset(100% 0 0 0)' });
    gsap.set(['.chip', '.badge-spin'], { opacity: 0, scale: .6 });
    gsap.set('.header', { yPercent: -120 });

    // 1. The logo assembles itself from its real pieces
    const loaded = new Promise(res => (document.readyState === 'complete' ? res() : addEventListener('load', res, { once: true })));
    const count = $('.loader__count b'), barFill = $('.loader__bar span');
    const sparks = $('.ll-sparks');
    const colours = ['#61AFA1', '#DA64D4', '#C9A45C', '#F6C9F0', '#9FDCD1'];
    for (let i = 0; i < 18; i++) {
      const sp = document.createElement('span');
      sp.className = 'spark';
      sp.innerHTML = `<svg viewBox="0 0 24 24" fill="${colours[i % colours.length]}"><path d="M12 0c.8 6.6 4.6 10.8 12 12-7.4 1.2-11.2 5.4-12 12-.8-6.6-4.6-10.8-12-12C7.4 10.8 11.2 6.6 12 0Z"/></svg>`;
      sparks.appendChild(sp);
    }
    gsap.set('.spark', { scale: 0, opacity: 0 });
    gsap.set('.ll-k', { yPercent: -140, rotate: -35, opacity: 0 });
    gsap.set('.ll-l', { y: 40, opacity: 0, filter: 'blur(10px)' });
    gsap.set('.ll-hanger', { yPercent: -45, rotate: 28, opacity: 0 });
    gsap.set('.loader__tag > *', { y: 20, opacity: 0 });

    gsap.to('.loader__ring', { rotate: 360, duration: 6, ease: 'none', repeat: -1 });
    const build = gsap.timeline({ defaults: { ease: 'expo.out' },
      onUpdate() { const p = build.progress(); count.textContent = Math.round(p * 100); barFill.style.transform = `scaleX(${p})`; } });
    build
      .to('.loader__ring', { opacity: 1, duration: 1 }, 0)
      .to('.loader__glow', { opacity: 1, duration: 1.4 }, .1)
      .fromTo('.ll-c', { '--a': '0deg', scale: .92 }, { '--a': '360deg', scale: 1, duration: 1.4, ease: 'power2.inOut' }, .2)
      .to('.ll-k', { yPercent: 0, rotate: 0, opacity: 1, duration: 1.3, ease: 'elastic.out(1, .55)' }, .95)
      .add(() => {
        gsap.fromTo('.loader__stage', { scale: 1 }, { scale: 1.035, duration: .14, yoyo: true, repeat: 1, ease: 'power2.out' });
        $$('.spark').forEach(sp => {
          const ang = Math.random() * Math.PI * 2, dist = 140 + Math.random() * 170;
          gsap.timeline()
            .fromTo(sp, { x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 },
              { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist * .8, scale: .6 + Math.random() * 1.1, rotate: 180 * (Math.random() - .5), duration: 1.1 + Math.random() * .5, ease: 'expo.out' })
            .to(sp, { opacity: 0, scale: 0, duration: .5, ease: 'power2.in' }, '-=.45');
        });
      }, 1.2)
      .to('.ll-l', { y: 0, opacity: 1, filter: 'blur(0px)', duration: .8, stagger: .07, ease: 'back.out(1.6)' }, 1.35)
      .to('.ll-hanger', { yPercent: 0, opacity: 1, duration: .7, ease: 'power3.out' }, 1.6)
      .to('.ll-hanger', { keyframes: { rotate: [28, -14, 8, -4, 1.5, 0] }, duration: 1.9, ease: 'sine.inOut' }, 1.6)
      .to('.loader__tag > *', { y: 0, opacity: 1, duration: .8, stagger: .08 }, 2)
      .fromTo('.ll-shine', { backgroundPosition: '-150% 0' }, { backgroundPosition: '150% 0', duration: 1.1, ease: 'power2.inOut' }, 2.55)
      .to({}, { duration: .25 });

    // 2. Once the page is ready, colour curtains lift to reveal it
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } });
    tl.to('.loader__stage', { scale: 1.12, opacity: 0, filter: 'blur(12px)', duration: .7, ease: 'power3.in' })
      .to(['.loader__tag', '.loader__meta', '.loader__ring'], { opacity: 0, y: -20, duration: .5, ease: 'power2.in' }, 0)
      .to('.loader__panel--cream', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, .45)
      .to('.loader__panel--teal', { yPercent: -100, duration: 1, ease: 'expo.inOut' }, .6)
      .to('.loader__panel--pink', { yPercent: -100, duration: 1, ease: 'expo.inOut', onComplete() { loader.remove(); document.body.classList.remove('is-loading'); } }, .75)
      .to('.header', { yPercent: 0, duration: 1 }, 1.2)
      .to('.hero__title .line > *', { yPercent: 0, duration: 1.2, stagger: .1 }, 1.05)
      .to('.arch', { clipPath: 'inset(0% 0 0 0)', duration: 1.4, stagger: .14, ease: 'expo.inOut' }, .95)
      .from('.arch img', { scale: 1.35, duration: 1.8, stagger: .14 }, '<')
      .to(['.eyebrow', '.hero__lead', '.hero__cta', '.hero__stats'], { opacity: 1, y: 0, duration: 1, stagger: .08 }, 1.3)
      .to(['.chip', '.badge-spin'], { opacity: 1, scale: 1, duration: .9, stagger: .12, ease: 'back.out(1.8)' }, 1.8)
      .add(() => $$('.count').forEach(countUp), 1.6);
    Promise.all([loaded, new Promise(res => build.eventCallback('onComplete', res))]).then(() => tl.play());

    scrollScenes();
  }

  // Pinned horizontal winter gallery (desktop only); rebuilt when the text direction flips
  let winterMM = null;
  function setupWinter() {
    if (!hasGsap || reduceMotion || !window.ScrollTrigger) return;
    winterMM && winterMM.revert();
    winterMM = gsap.matchMedia();
    winterMM.add('(min-width: 961px)', () => {
      const tr = $('.winter__track'), pin = $('.winter__pin');
      const rtl = root.dir === 'rtl';
      const dist = () => {
        const visible = rtl ? tr.offsetLeft + tr.offsetWidth : pin.clientWidth - tr.offsetLeft;
        return Math.max(0, tr.scrollWidth - visible + 60);
      };
      gsap.timeline({ scrollTrigger: { trigger: '.winter', start: 'top top', end: () => '+=' + dist(), pin, scrub: .8, invalidateOnRefresh: true } })
        .to(tr, { x: () => (rtl ? 1 : -1) * dist(), ease: 'none', duration: 1 }, 0)
        .to('.winter__intro', { opacity: .08, x: () => (rtl ? 40 : -40), ease: 'power1.in', duration: .35 }, 0);
    });
  }

  function scrollScenes() {
    // Floating chips & stars bob gently
    gsap.to('.chip--a', { y: -12, duration: 2.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    gsap.to('.chip--b', { y: 12, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' });
    $$('.float').forEach((f, i) => gsap.to(f, { y: i % 2 ? 18 : -18, rotate: i % 2 ? 20 : -20, duration: 3 + i, yoyo: true, repeat: -1, ease: 'sine.inOut' }));

    // Hero mouse parallax (desktop)
    if (finePointer) {
      const arches = $$('.arch');
      const setters = arches.map(a => ({ x: gsap.quickTo(a, 'x', { duration: 1, ease: 'power3' }), y: gsap.quickTo(a, 'y', { duration: 1, ease: 'power3' }), d: +a.dataset.depth }));
      $('.hero').addEventListener('pointermove', e => {
        const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
        setters.forEach(s => { s.x(nx * 30 * s.d); s.y(ny * 24 * s.d); });
      });
    }

    // Hero art drifts on scroll
    gsap.to('.hero__art', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .6 } });
    gsap.to('.hero__copy', { yPercent: -10, opacity: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center top', end: 'bottom top', scrub: .6 } });

    // Marquee speeds up with scroll velocity
    const track = $('.marquee__track');
    ScrollTrigger.create({ onUpdate: self => {
      const v = Math.min(Math.abs(self.getVelocity()) / 400, 4);
      track.style.animationDuration = `${32 / (1 + v)}s`;
    } });

    // Generic reveals
    $$('.reveal').forEach(el => gsap.from(el, { opacity: 0, y: 50, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 85%' } }));
    $$('.section__title').forEach(h => gsap.from(h.children, { yPercent: 40, opacity: 0, duration: 1.1, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } }));

    // Bento tiles
    gsap.from('.tile', { clipPath: 'inset(18% 18% 18% 18% round 32px)', opacity: 0, duration: 1.3, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.bento', start: 'top 80%' } });
    $$('.tile img').forEach(img => gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, scrub: .5 } }));

    // Product grid
    ScrollTrigger.batch('.card', { start: 'top 90%', once: true,
      onEnter: b => gsap.fromTo(b, { opacity: 0, y: 40, scale: .94 }, { opacity: 1, y: 0, scale: 1, duration: .7, stagger: .07, ease: 'back.out(1.4)', clearProps: 'transform' }) });

    setupWinter();
    gsap.from('.wcard', { opacity: 0, y: 80, rotate: 3, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.winter', start: 'top 70%' } });

    // Promise cards
    gsap.from('.pcard__ico', { scale: 0, rotate: -90, duration: 1, stagger: .1, ease: 'back.out(2)', scrollTrigger: { trigger: '.promise__grid', start: 'top 80%' } });

    // Wholesale fan
    gsap.from('.wholesale__art img', { y: 120, rotate: 0, opacity: 0, duration: 1.4, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '.wholesale', start: 'top 75%' } });
    gsap.from('.ticks li', { x: -20, opacity: 0, duration: .7, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.ticks', start: 'top 85%' } });

    // Footer wordmark
    gsap.from('.footer__big', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 90%' } });
  }

  /* ---------------- Boot ---------------- */
  $('#year').textContent = new Date().getFullYear();
  if (lang === 'ar') applyLang(); else { renderGrid(); renderBag(); }
  requestAnimationFrame(movePill);
  onScroll();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { movePill(); intro(); });
  else intro();
})();
