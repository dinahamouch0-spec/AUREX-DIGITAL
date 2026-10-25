(() => {
  'use strict';
  const D = window.CZ;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const T = {
    ar: {
      skip: 'تخطَّ إلى المحتوى',
      'nav.bikes': 'الموتسيكلات', 'nav.parts': 'القطع والإكسسوارات', 'nav.services': 'الخدمات', 'nav.about': 'من نحن', 'nav.visit': 'زورونا',
      'cta.whatsapp': 'واتساب', 'cta.call': 'اتصل فينا', 'cta.map': 'افتح الخريطة', 'cta.order': 'اطلبه عالواتساب',
      'hero.eyebrow': 'موديلات 2026 وصلت', 'hero.t1': 'أكثر من', 'hero.t2': 'مجرد معرض.',
      'hero.lead': 'موتسيكلات وسكوترات جديدة، إكسسوارات أصلية، وورشة صيانة وتصليح — كل شي بمكان واحد، مع راشد خليفة.',
      'hero.cta1': 'تصفّح الموتسيكلات', 'hero.cta2': 'احكينا هلّق',
      'stats.from': 'تبدأ من', 'stats.models': 'موديلات', 'stats.services': 'خدمات بمكان واحد',
      'bikes.kicker': 'المعرض', 'bikes.title': 'موتسيكلات 2026',
      'bikes.sub': 'كل موتسيكل بيطلع من عنا مفحوص وجاهز للطريق. اختار الفئة واسألنا عن السعر.',
      'bikes.search': 'دوّر على موديل…', 'bikes.empty': 'ما في نتائج — جرّب كلمة تانية أو احكينا عالواتساب.',
      'offer.kicker': 'عرض المعرض', 'offer.line': 'تجي بتاخد من عنا.',
      'offer.text': 'سكوترات جديدة بأسعار ما بتنعاد. الكمية محدودة — مرّ عالمعرض أو احجز موتسيكلك عالواتساب.', 'offer.cta': 'احجز العرض',
      'services.kicker': 'الخدمات', 'services.title': 'كل شي بيلزم موتسيكلك',
      's1.t': 'معرض ومبيع موتسيكلات', 's1.d': 'أحدث موديلات السكوتر والماكسي سكوتر والكهرباء، بأسعار واضحة.',
      's2.t': 'إكسسوارات الموتسيكلات', 's2.d': 'خوذ، زجاج أمامي، مقاعد رياضية، إضاءة LED، جنوط وإطارات — مع التركيب.',
      's3.t': 'صيانة وتصليح', 's3.d': 'ورشة مجهّزة لكل أنواع الصيانة الدورية والتصليح، بإيد خبيرة وقطع موثوقة.',
      'parts.kicker': 'القطع والإكسسوارات', 'parts.title': 'جهّز موتسيكلك على ذوقك',
      'parts.sub': 'القطع المتوفرة حالياً بالمعرض. الأسعار بتختلف حسب الموديل — ابعتلنا والجواب بيوصلك بسرعة.',
      'gallery.kicker': 'من المعرض', 'gallery.title': 'زبايننا… عيلتنا',
      'about.kicker': 'من نحن', 'about.t1': 'بإدارة', 'about.t2': 'راشد خليفة',
      'about.lead': 'Cycle Zone مش بس معرض — هو مكان لكل حدا بيحب الموتسيكلات. من أول ما تختار موتسيكلك، للإكسسوارات، للصيانة بعد سنين: نحنا معك.',
      'about.p1': 'موديلات 2026 جديدة ومفحوصة', 'about.p2': 'إكسسوارات وقطع موثوقة مع التركيب', 'about.p3': 'ورشة صيانة وتصليح بنفس المكان', 'about.p4': 'على الطريق العام بين صيدا وصور',
      'about.quote': '«بدي كل زبون يطلع من عنا مبسوط، ويرجع لعنا متل ما بيرجع الواحد لبيته.»',
      'visit.kicker': 'زورونا', 'visit.title': 'ناطرينك بالمعرض', 'visit.addr': 'العنوان', 'visit.phone': 'الهاتف',
      'footer.tag': 'معرض موتسيكلات · إكسسوارات · صيانة وتصليح',
      'modal.specs': 'المواصفات',
      all: 'الكل', ask: 'اسأل عن السعر', price: 'السعر', details: 'التفاصيل', inquire: 'استفسر',
      marquee: ['معرض موتسيكلات', 'مبيع', 'إكسسوارات', 'صيانة وتصليح', 'موديلات 2026', 'الصرفند'],
      'wa.general': 'مرحبا Cycle Zone، حابب استفسر',
      'wa.offer': 'مرحبا، حابب احجز عرض السكوتر بـ 799$',
      'wa.visit': 'مرحبا، حابب مرّ عالمعرض. أيمتى بتكونوا فاتحين؟',
      'wa.bike': (n) => `مرحبا، حابب استفسر عن ${n} — السعر والتوفّر؟`,
      'wa.part': (n) => `مرحبا، حابب استفسر عن ${n} — شو المتوفر وقديش السعر؟`
    },
    en: {
      skip: 'Skip to content',
      'nav.bikes': 'Motorcycles', 'nav.parts': 'Parts & Accessories', 'nav.services': 'Services', 'nav.about': 'About', 'nav.visit': 'Visit',
      'cta.whatsapp': 'WhatsApp', 'cta.call': 'Call us', 'cta.map': 'Open map', 'cta.order': 'Order on WhatsApp',
      'hero.eyebrow': '2026 models have landed', 'hero.t1': 'More than a', 'hero.t2': 'showroom.',
      'hero.lead': 'New motorcycles and scooters, genuine accessories and a full repair workshop — all under one roof, with Rashed Khalifeh.',
      'hero.cta1': 'Browse motorcycles', 'hero.cta2': 'Talk to us now',
      'stats.from': 'Starting from', 'stats.models': 'Models', 'stats.services': 'Services, one place',
      'bikes.kicker': 'The showroom', 'bikes.title': '2026 Motorcycles',
      'bikes.sub': 'Every bike leaves our floor inspected and road-ready. Pick a category and ask us for the price.',
      'bikes.search': 'Search a model…', 'bikes.empty': 'No matches — try another word or message us on WhatsApp.',
      'offer.kicker': 'Showroom offer', 'offer.line': 'Ride one home today.',
      'offer.text': 'Brand-new scooters at prices you won’t see again. Limited stock — drop by the showroom or reserve yours on WhatsApp.', 'offer.cta': 'Reserve the offer',
      'services.kicker': 'Services', 'services.title': 'Everything your bike needs',
      's1.t': 'Showroom & Sales', 's1.d': 'The latest scooters, maxi-scooters and electric models, with clear pricing.',
      's2.t': 'Motorcycle Accessories', 's2.d': 'Helmets, windshields, sport seats, LED lighting, rims and tires — fitted in-house.',
      's3.t': 'Maintenance & Repair', 's3.d': 'A fully equipped workshop for routine service and repairs, with expert hands and trusted parts.',
      'parts.kicker': 'Parts & Accessories', 'parts.title': 'Build it your way',
      'parts.sub': 'In stock at the showroom now. Prices depend on your model — message us and we’ll reply fast.',
      'gallery.kicker': 'From the showroom', 'gallery.title': 'Our riders, our family',
      'about.kicker': 'About', 'about.t1': 'By', 'about.t2': 'Rashed Khalifeh',
      'about.lead': 'Cycle Zone isn’t just a showroom — it’s a home for anyone who loves bikes. From choosing your first ride, to accessories, to service years later: we’re with you.',
      'about.p1': 'Brand-new, inspected 2026 models', 'about.p2': 'Trusted parts & accessories, fitted for you', 'about.p3': 'Service & repair workshop on site', 'about.p4': 'On the main road between Saida & Tyre',
      'about.quote': '“I want every customer to leave happy — and come back like they’re coming home.”',
      'visit.kicker': 'Visit', 'visit.title': 'See you at the showroom', 'visit.addr': 'Address', 'visit.phone': 'Phone',
      'footer.tag': 'Motorcycle showroom · Accessories · Maintenance & repair',
      'modal.specs': 'Specifications',
      all: 'All', ask: 'Price on request', price: 'Price', details: 'Details', inquire: 'Inquire',
      marquee: ['Motorcycle showroom', 'Sales', 'Accessories', 'Maintenance & repair', '2026 models', 'Sarafand'],
      'wa.general': 'Hi Cycle Zone, I have a question',
      'wa.offer': 'Hi, I’d like to reserve the $799 scooter offer',
      'wa.visit': 'Hi, I’d like to visit the showroom. When are you open?',
      'wa.bike': (n) => `Hi, I’m interested in the ${n} — price and availability?`,
      'wa.part': (n) => `Hi, I’m asking about ${n} — what do you have and how much?`
    }
  };

  let lang = 'ar';
  try { lang = localStorage.getItem('cz-lang') || 'ar'; } catch (_) {}
  if (!T[lang]) lang = 'ar';

  const t = (k) => T[lang][k] ?? k;
  const L = (v) => (v && typeof v === 'object' ? v[lang] ?? v.en : v);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wa = (msg) => `https://wa.me/${D.contact.whatsapp}?text=${encodeURIComponent(msg)}`;
  const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
  const bikeName = (b) => L(b.name);
  const fmtPrice = (p) => '$' + Number(p).toLocaleString('en-US');

  const state = { bikeCat: 'all', partCat: 'all', q: '' };

  /* ---------- Static text ---------- */
  function applyStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach((el) => { const v = T[lang][el.dataset.i18n]; if (typeof v === 'string') el.textContent = v; });
    $$('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
    $('#langBtn').textContent = lang === 'ar' ? 'EN' : 'ع';
    $('#langBtn').setAttribute('aria-label', lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية');

    $$('[data-wa]').forEach((a) => { a.href = wa(t('wa.' + a.dataset.wa)); });
    const c = D.contact;
    $('#addrText').textContent = L(c.address);
    $('#phoneLink').textContent = c.phoneDisplay; $('#phoneLink').href = 'tel:' + c.phone;
    $('#callBtn').href = 'tel:' + c.phone;
    $('#igLink').href = c.instagram; $('#igLink2').href = c.instagram; $('#igLink2').textContent = c.instagramHandle;
    const mq = encodeURIComponent(c.mapQuery);
    $('#mapBtn').href = `https://www.google.com/maps/search/?api=1&query=${mq}`;
    const mf = $('#mapFrame');
    const src = `https://maps.google.com/maps?q=${mq}&z=15&hl=${lang}&output=embed`;
    if (mf.dataset.src !== src) { mf.dataset.src = src; mf.src = src; }
    $('#year').textContent = new Date().getFullYear();

    const words = T[lang].marquee;
    const run = words.map((w) => `<span>${esc(w)}</span>`).join('');
    $('#marquee').innerHTML = run + run + run + run;
  }

  /* ---------- Filters ---------- */
  function renderChips(el, cats, items, key) {
    const counts = items.reduce((m, it) => ((m[it.category] = (m[it.category] || 0) + 1), m), {});
    const list = [['all', t('all'), items.length], ...Object.entries(cats).filter(([k]) => counts[k]).map(([k, v]) => [k, L(v), counts[k]])];
    el.innerHTML = list.map(([k, label, n]) =>
      `<button class="chip" role="tab" type="button" data-k="${k}" aria-selected="${state[key] === k}">${esc(label)}<small>${n}</small></button>`).join('');
    el.onclick = (e) => {
      const b = e.target.closest('.chip'); if (!b) return;
      state[key] = b.dataset.k;
      $$('.chip', el).forEach((c) => c.setAttribute('aria-selected', c === b));
      key === 'bikeCat' ? renderBikes() : renderParts();
    };
  }

  /* ---------- Bikes ---------- */
  function renderBikes() {
    const q = state.q.trim().toLowerCase();
    const list = D.bikes.filter((b) =>
      (state.bikeCat === 'all' || b.category === state.bikeCat) &&
      (!q || [b.name.ar, b.name.en, b.name, L(D.bikeCategories[b.category]), b.year].join(' ').toLowerCase().includes(q)));

    $('#bikeEmpty').hidden = list.length > 0;
    $('#bikeGrid').innerHTML = list.map((b, i) => {
      const name = bikeName(b);
      const featured = b.featured && state.bikeCat === 'all' && !q;
      const specs = b.specs.slice(0, 3).map((s) => `<li>${esc(L(s))}</li>`).join('');
      const price = b.price
        ? `<div class="price"><small>${t('price')}</small>${fmtPrice(b.price)}</div>`
        : `<div class="price price--ask">${t('ask')}</div>`;
      return `
        <article class="bike reveal${featured ? ' bike--featured' : ''}" style="--d:${Math.min(i, 6) * 0.06}s">
          <button class="bike__media" type="button" data-open="${b.id}" aria-label="${esc(t('details'))}: ${esc(name)}">
            ${b.badge ? `<span class="badge">${esc(L(b.badge))}</span>` : ''}
            <span class="bike__year">${b.year}</span>
            <img src="${b.image}" alt="${esc(name)} ${b.year}" loading="lazy" width="780" height="708">
          </button>
          <div class="bike__body">
            <span class="bike__cat">${esc(L(D.bikeCategories[b.category]))}</span>
            <h3 class="bike__name">${esc(name)}</h3>
            <ul class="bike__specs">${specs}</ul>
            <div class="bike__foot">
              ${price}
              <div class="bike__actions">
                <button class="icon-btn" type="button" data-open="${b.id}" aria-label="${esc(t('details'))}: ${esc(name)}">${icon('arrow', 'i flip')}</button>
                <a class="icon-btn icon-btn--wa" href="${wa(t('wa.bike')(name + ' ' + b.year))}" target="_blank" rel="noopener" aria-label="WhatsApp: ${esc(name)}">${icon('wa')}</a>
              </div>
            </div>
          </div>
        </article>`;
    }).join('');
    observe($$('#bikeGrid .reveal'));
  }

  /* ---------- Parts ---------- */
  function renderParts() {
    const list = D.parts.filter((p) => state.partCat === 'all' || p.category === state.partCat);
    $('#partGrid').innerHTML = list.map((p, i) => {
      const name = L(p.name);
      const media = p.image
        ? `<img class="part__img" src="${p.image}" alt="${esc(name)}" loading="lazy">`
        : `<span class="part__icon">${icon(p.icon, '')}</span>`;
      return `
        <article class="part reveal" style="--d:${Math.min(i, 8) * 0.04}s">
          <div class="part__top">${media}<span class="part__cat">${esc(L(D.partCategories[p.category]))}</span></div>
          <h3>${esc(name)}</h3>
          <p>${esc(L(p.desc))}</p>
          <div class="part__foot">
            <span class="${p.price ? 'price' : 'price price--ask'}">${p.price ? fmtPrice(p.price) : t('ask')}</span>
            <a class="link-wa" href="${wa(t('wa.part')(name))}" target="_blank" rel="noopener">${icon('wa')}${t('inquire')}</a>
          </div>
        </article>`;
    }).join('');
    observe($$('#partGrid .reveal'));
  }

  /* ---------- Modal ---------- */
  const modal = $('#bikeModal');
  let lastFocus = null;
  function openBike(id) {
    const b = D.bikes.find((x) => x.id === id); if (!b) return;
    const name = bikeName(b);
    lastFocus = document.activeElement;
    $('#mImg').src = b.image; $('#mImg').alt = `${name} ${b.year}`;
    $('#mCat').textContent = `${L(D.bikeCategories[b.category])} · ${b.year}`;
    $('#mTitle').textContent = name;
    $('#mDesc').textContent = L(b.desc);
    $('#mSpecs').innerHTML = b.specs.map((s) => `<li>${icon('check')}${esc(L(s))}</li>`).join('');
    $('#mPrice').className = b.price ? 'price' : 'price price--ask';
    $('#mPrice').innerHTML = b.price ? `<small>${t('price')}</small>${fmtPrice(b.price)}` : t('ask');
    $('#mWa').href = wa(t('wa.bike')(name + ' ' + b.year));
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
    history.replaceState(null, '', '#bike-' + b.id);
  }
  function closeModal() {
    modal.close ? modal.close() : modal.removeAttribute('open');
  }
  modal.addEventListener('close', () => {
    history.replaceState(null, '', location.pathname + location.search);
    lastFocus && lastFocus.focus();
  });
  $('#mClose').onclick = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  $('#bikeGrid').addEventListener('click', (e) => { const b = e.target.closest('[data-open]'); if (b) openBike(b.dataset.open); });

  /* ---------- Reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null;
  function observe(els) { els.forEach((el) => (io ? io.observe(el) : el.classList.add('is-in'))); }

  /* ---------- Nav ---------- */
  const nav = $('#nav'), burger = $('#burger'), links = $('#navLinks');
  const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.onclick = () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open); links.classList.toggle('is-open', open);
  };
  links.addEventListener('click', (e) => { if (e.target.closest('a')) { burger.setAttribute('aria-expanded', 'false'); links.classList.remove('is-open'); } });

  if (io) {
    const spy = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) $$('a', links).forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('main section[id]').forEach((s) => spy.observe(s));
  }

  /* ---------- Language ---------- */
  function render() {
    applyStatic();
    renderChips($('#bikeFilters'), D.bikeCategories, D.bikes, 'bikeCat');
    renderChips($('#partFilters'), D.partCategories, D.parts, 'partCat');
    renderBikes(); renderParts();
  }
  $('#langBtn').onclick = () => {
    lang = lang === 'ar' ? 'en' : 'ar';
    try { localStorage.setItem('cz-lang', lang); } catch (_) {}
    render();
  };
  $('#bikeSearch').addEventListener('input', (e) => { state.q = e.target.value; renderBikes(); });

  render();
  observe($$('.reveal'));
  const m = location.hash.match(/^#bike-(.+)$/); if (m) openBike(m[1]);
})();
