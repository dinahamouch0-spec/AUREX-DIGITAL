/* =========================================================
   HADI SPORT — site logic
   Edit CONFIG and PRODUCTS below to change contact details or stock.
   ========================================================= */
(() => {
'use strict';

const CONFIG = {
  whatsapp: '96171122790',              // 71-122790 with Lebanon's +961
  instagram: 'https://instagram.com/hadisportx',
  // Replace with the store's exact Google Maps link
  maps: 'https://www.google.com/maps/search/?api=1&query=Hadi+Sport+Lebanon'
};

const IMG = 'assets/img/p/';

/* Categories and their size runs */
const SIZES = {
  boots: ['38','39','40','40.5','41','42','42.5','43','44','45'],
  player: ['S','M','L','XL','XXL'],
  fan: ['S','M','L','XL','XXL'],
  gk: ['6','7','8','9','10','11'],
  shin: ['XS','S','M','L'],
  socks: ['One size'],
  head: ['One size'],
  ball: ['Size 3','Size 4','Size 5']
};

/* filter: sub-group shown as chips under each tab */
const PRODUCTS = [
  // ---------- BOOTS ----------
  {id:'b05', tab:'boots', f:'speed',   n:'Mercurial Superfly',   v:'Sunset Gold · FG', isNew:true},
  {id:'b01', tab:'boots', f:'control', n:'Phantom Elite',        v:'White / Pink Blast · FG', isNew:true},
  {id:'b02', tab:'boots', f:'control', n:'Predator Elite',       v:'Gold Edition · FG'},
  {id:'b07', tab:'boots', f:'speed',   n:'Speed Elite',          v:'Solar Neon · FG', isNew:true},
  {id:'b03', tab:'boots', f:'control', n:'Predator Accuracy',    v:'Ice Blue / Red · FG'},
  {id:'b06', tab:'boots', f:'speed',   n:'Mercurial Superfly',   v:'Shadow Black / Volt · FG'},
  {id:'b08', tab:'boots', f:'control', n:'Phantom Shadow',       v:'White / Crimson · FG'},
  {id:'b04', tab:'boots', f:'control', n:'Predator',             v:'Navy Camo · FG'},
  {id:'b09', tab:'boots', f:'speed',   n:'Mercurial Vapor',      v:'Bright Crimson · FG'},
  {id:'b10', tab:'boots', f:'speed',   n:'Mercurial Vapor',      v:'Volt / Pink · FG'},
  {id:'b14', tab:'boots', f:'touch',   n:'Tiempo Legend',        v:'Grey / Volt · FG'},
  {id:'b11', tab:'boots', f:'turf',    n:'Turf Pro',             v:'Black / Racer Blue · TF'},
  {id:'b12', tab:'boots', f:'control', n:'Predator Classic',     v:'Core Black · FG'},
  {id:'b13', tab:'boots', f:'speed',   n:'Speed Pro',            v:'Solar Orange · FG'},
  {id:'b15', tab:'boots', f:'control', n:'Predator',             v:'Black / Copper · FG'},
  // ---------- PLAYER VERSION ----------
  {id:'j01', tab:'player', f:'player', n:'Ronaldo 7',            v:'Home Red · Player Version', isNew:true},
  {id:'j02', tab:'player', f:'player', n:'Manchester United',    v:'Home · Player Version'},
  {id:'j03', tab:'player', f:'player', n:'Arsenal Collection',   v:'Home & Away · Player Version'},
  {id:'j04', tab:'player', f:'player', n:'National Teams',       v:'World Cup Kits · Player Version'},
  {id:'j05', tab:'player', f:'player', n:'Arsenal',              v:'Home · Name & Number · Player Version'},
  {id:'j06', tab:'player', f:'player', n:'Black & Gold Third',   v:'Third · Player Version'},
  // ---------- FAN VERSION ----------
  {id:'f01', tab:'fan', f:'fan', n:'Arsenal',             v:'Home · Fan Version'},
  {id:'f02', tab:'fan', f:'fan', n:'Brazil',              v:'Home 10 · Fan Version', isNew:true},
  {id:'f03', tab:'fan', f:'fan', n:'Manchester United',   v:'Home · Fan Version'},
  {id:'f04', tab:'fan', f:'fan', n:'Colombia',            v:'Home · Fan Version'},
  {id:'f05', tab:'fan', f:'fan', n:'Mexico',              v:'Away · Fan Version'},
  {id:'f06', tab:'fan', f:'fan', n:'Argentina',           v:'Home · Messi 10 · Fan Version'},
  // ---------- GOALKEEPER ----------
  {id:'g02', tab:'gk', f:'gk', n:'Pro Grip Gloves',      v:'Aqua / Black · Negative cut', isNew:true},
  {id:'g01', tab:'gk', f:'gk', n:'Elite Match Gloves',   v:'Black / Blue · Roll finger'},
  {id:'g03', tab:'gk', f:'gk', n:'Competition Gloves',   v:'Volt Yellow · Hybrid cut'},
  {id:'g04', tab:'gk', f:'gk', n:'Junior Keeper Gloves', v:'Kids sizes · Finger protection'},
  // ---------- ESSENTIALS ----------
  {id:'k01', tab:'acc', f:'socks', n:'Pro Grip Socks',     v:'Red / White check'},
  {id:'k02', tab:'acc', f:'socks', n:'Grip Socks',         v:'White · Anti-slip pads', isNew:true},
  {id:'k03', tab:'acc', f:'socks', n:'Grip Socks + Sleeves', v:'Royal Blue'},
  {id:'k04', tab:'acc', f:'socks', n:'Match Socks',        v:'Club colours'},
  {id:'s01', tab:'acc', f:'shin',  n:'Carbon Shin Guards', v:'Ultra-light shell'},
  {id:'s02', tab:'acc', f:'shin',  n:'Slip-in Shin Guards', v:'Black / Gold'},
  {id:'s03', tab:'acc', f:'shin',  n:'Shin Guards + Ankle', v:'Full protection'},
  {id:'h01', tab:'acc', f:'head',  n:'Pro Headband',       v:'White · Sweat-wicking'},
  {id:'h02', tab:'acc', f:'head',  n:'Sport Headband',     v:'Black / White'},
  {id:'l01', tab:'acc', f:'ball',  n:'Match Ball',         v:'Pro · Size 5'},
  {id:'l02', tab:'acc', f:'ball',  n:'Training Ball Pack', v:'Size 4 / 5'},
  {id:'l03', tab:'acc', f:'ball',  n:'Champions Match Ball', v:'Star edition · Size 5', isNew:true},
  {id:'l04', tab:'acc', f:'ball',  n:'Premier Match Ball', v:'Pro · Size 5'},
  {id:'l05', tab:'acc', f:'ball',  n:'Classic Ball',       v:'Black / White · Size 5'}
];

const FILTERS = {
  boots: ['all','speed','control','touch','turf'],
  acc:   ['all','socks','shin','head','ball']
};

/* ================= i18n ================= */
const AR = {
  'nav.boots':'الأحذية','nav.kits':'الأطقم','nav.gk':'حارس المرمى','nav.acc':'الإكسسوارات','nav.store':'المحل',
  'cta.order':'اطلب الآن',
  'hero.eyebrow':'توصيل لكل لبنان','hero.t1':'البس','hero.t2':'اللعبة.','hero.t3':'واملك الملعب.',
  'hero.lead':'أفخم أحذية كرة القدم، أطقم بلاير وفان فيرجن، ومعدات حراسة احترافية — مختارة بعناية، مصوّرة على الحقيقة، وبتوصلك لباب البيت.',
  'hero.cta1':'تصفّح المجموعة','hero.cta2':'راسلنا واتساب',
  'stat.drops':'منتج منشور','stat.fans':'لاعب يتابعنا','stat.real':'صور حقيقية',
  'chip.real':'كل الصور حقيقية','chip.delivery':'توصيل لكل لبنان',
  'cat.kicker':'تسوّق حسب الفئة','cat.title':'كل اللي بتحتاجه<br><em>من صافرة البداية للنهاية.</em>',
  'c.boots':'أحذية كرة قدم','c.boots.d':'FG · AG · TF — سرعة، تحكّم ولمسة',
  'c.player':'بلاير فيرجن','c.player.d':'قصّة ضيقة · تقنية المباريات','c.fan':'فان فيرجن','c.gk':'قفازات حارس',
  'c.socks':'جرابات جريب','c.shin':'كسارات','c.head':'هيدباند','c.ball':'كرات',
  'col.kicker':'المجموعة','col.title':'حيط المحل،<br><em>صار أونلاين.</em>',
  'col.aside':'اضغط على أي قطعة، اختار مقاسك وابعت الطلب مباشرة على واتساب. وصولات جديدة كل أسبوع.',
  'tab.boots':'أحذية','tab.player':'بلاير فيرجن','tab.fan':'فان فيرجن','tab.gk':'حارس مرمى','tab.acc':'إكسسوارات',
  'f.all':'الكل','f.speed':'سرعة','f.control':'تحكّم','f.touch':'لمسة','f.turf':'ترتان TF','f.socks':'جرابات جريب','f.shin':'كسارات','f.head':'هيدباند','f.ball':'كرات',
  'kits.kicker':'الأطقم','kits.title':'بلاير فيرجن ولا فان فيرجن؟<br><em>اعرف الفرق.</em>',
  'kits.pv':'بلاير فيرجن','kits.pv.t':'مصمّم متل يوم المباراة.',
  'kits.pv.1':'قصّة رياضية ضيقة — متل ما بيلبسها المحترفين','kits.pv.2':'شعار ولوغوهات حرارية خفيفة','kits.pv.3':'قماش مثقّب فائق التهوية','kits.pv.4':'اطلب مقاس أكبر إذا بتحب القصّة الواسعة','kits.pv.cta':'تسوّق بلاير فيرجن',
  'kits.fv':'فان فيرجن','kits.fv.t':'مصمّم للمدرجات.',
  'kits.fv.1':'قصّة عادية ومريحة للبس اليومي','kits.fv.2':'شعار مطرّز — كلاسيكي وبيعيش','kits.fv.3':'قماش ناعم وأتقل بيدوم مواسم','kits.fv.4':'مقاس طبيعي — هدية مثالية لأي مشجّع','kits.fv.cta':'تسوّق فان فيرجن',
  'kits.note':'طباعة الاسم والرقم متوفرة عند الطلب — اسألنا على واتساب.',
  'gk.kicker':'حارس المرمى','gk.title':'خط الدفاع الأخير<br><em>بيستاهل أقوى قبضة.</em>',
  'gk.lead':'قفازات حراسة احترافية بلاتكس قوي القبضة، حماية للأصابع وقصّات احترافية — للصغار والهواة والحرّاس المحترفين.',
  'gk.f1':'لاتكس قبضة','gk.f2':'لكل الأعمار','gk.f3':'اطلب على واتساب','gk.cta':'تسوّق القفازات',
  'ess.kicker':'الأساسيات','ess.title':'التفاصيل الصغيرة<br><em>اللي بتربّح المباريات الكبيرة.</em>',
  'ess.socks':'وسادات مانعة للانزلاق بتثبّت رجلك جوّا الحذاء. لفّات أحدّ وصفر تزحلق.',
  'ess.shin':'كسارات خفيفة جداً بتصميم كاربون، وكسارات مع أكمام.',
  'ess.head':'هيدباند احترافي بيمتص العرق — خليك حاضر 90 دقيقة.',
  'ess.ball':'كرات مباريات وتمرين بالمقاس الرسمي، مقاس 3 و4 و5.',
  'ess.sleeve':'جرابات وأكمام','ess.sleeve.d':'جرابات مقصوصة وأكمام للساق بكل ألوان الأندية.',
  'store.kicker':'المحل','store.title':'كل جوز بتشوفه<br><em>موجود عالحيط.</em>',
  'store.lead':'بلا خدع كتالوجات. كل صورة على صفحتنا هي بضاعة حقيقية مصوّرة بالمحل. تعا جرّب، أو منوصلّك ياها — لأي مكان بلبنان.',
  'store.live':'مباشرة من المحل','store.map':'الموقع على الخريطة',
  'perk.1':'كل الصور حقيقية','perk.1d':'اللي بتشوفه هو بالزبط اللي بيوصلك.',
  'perk.2':'لكل لبنان','perk.2d':'توصيل سريع من بيروت للجنوب والشمال والبقاع.',
  'perk.3':'خدمة شخصية','perk.3d':'نصائح المقاسات والوصولات الجديدة مباشرة على واتساب.',
  'how.kicker':'طريقة الطلب','how.title':'ثلاث كبسات<br><em>وبيوصلك جوزك الجديد.</em>',
  'how.1':'اختار قطعتك','how.1d':'تصفّح المجموعة واختار مقاسك.',
  'how.2':'ابعتها واتساب','how.2d':'طلبك مكتوب جاهز — بس اضغط إرسال. منأكّدلك التوفر والسعر.',
  'how.3':'بتوصلك لعندك','how.3d':'توصيل سريع لباب بيتك، بكل لبنان.',
  'faq.q1':'الصور حقيقية؟','faq.a1':'أكيد. كل منشور على إنستغرام متصوّر بالمحل ببضاعة حقيقية. اللي بتشوفه هو اللي بتاخده.',
  'faq.q2':'كيف بختار مقاس الحذاء؟','faq.a2':'ابعتلنا مقاسك العادي بالسنيكرز وعرض رجلك على واتساب — ومنقلّك المقاس الصح لكل موديل.',
  'faq.q3':'بتوصلوا لبرّا بيروت؟','faq.a3':'إيه — منوصّل لكل لبنان.',
  'faq.q4':'فيني رجّع القطعة؟','faq.a4':'كل المبيعات نهائية — ما في استرجاع. أكّد مقاسك معنا قبل الطلب ومنتأكد إنو بيجي عليك.',
  'cta.title':'جاهز<br><em>تلعب؟</em>','cta.lead':'راسلنا على إنستغرام أو واتساب — وصولات جديدة كل أسبوع.','cta.wa':'اطلب على واتساب',
  'foot.tag':'أحذية كرة قدم، أطقم ومعدات احترافية. توصيل لكل لبنان.','foot.shop':'تسوّق','foot.contact':'تواصل',
  'foot.rights':'جميع الحقوق محفوظة.','foot.policy':'كل المبيعات نهائية · لا استرجاع',
  'm.size':'اختار المقاس','m.order':'اطلب على واتساب','m.fine':'السعر والتوفر بيتأكدوا على واتساب · توصيل لكل لبنان',
  'quick':'اطلب','new':'جديد'
};
const EN_EXTRA = {
  'f.all':'All','f.speed':'Speed','f.control':'Control','f.touch':'Touch','f.turf':'Turf (TF)',
  'f.socks':'Grip Socks','f.shin':'Shin Guards','f.head':'Headbands','f.ball':'Balls',
  'quick':'Quick order','new':'NEW'
};
const CAT_LABEL = {
  en:{boots:'Football Boots',player:'Player Version',fan:'Fan Version',gk:'Goalkeeper',socks:'Grip Socks',shin:'Shin Guards',head:'Headband',ball:'Match Ball'},
  ar:{boots:'حذاء كرة قدم',player:'بلاير فيرجن',fan:'فان فيرجن',gk:'قفازات حارس',socks:'جرابات جريب',shin:'كسارات',head:'هيدباند',ball:'كرة'}
};
const DESC = {
  en:{
    boots:'Hand-picked from our boot wall. Real stock, photographed in-store. Message us your usual size and we\'ll confirm the perfect fit before delivery.',
    player:'Authentic player-version cut: slim athletic fit, heat-pressed crest and ultra-breathable match fabric. Name & number printing on request.',
    fan:'Classic fan-version cut with embroidered crest and soft, durable fabric — made to be worn every match day.',
    gk:'Professional goalkeeper gloves with soft contact latex, secure wrist strap and reinforced fingers.',
    socks:'Anti-slip grip pads keep your foot locked inside the boot for sharper cuts and zero sliding.',
    shin:'Lightweight protection that stays in place for the full 90 minutes.',
    head:'Sweat-wicking, non-slip headband for training and match day.',
    ball:'Thermally-bonded match quality ball with true flight and touch.'
  },
  ar:{
    boots:'مختار من حيط الأحذية تبعنا. بضاعة حقيقية مصوّرة بالمحل. ابعتلنا مقاسك العادي ومنأكّدلك المقاس المثالي قبل التوصيل.',
    player:'قصّة بلاير فيرجن أصلية: ضيقة ورياضية، شعار حراري وقماش مباريات فائق التهوية. طباعة اسم ورقم عند الطلب.',
    fan:'قصّة فان فيرجن كلاسيكية مع شعار مطرّز وقماش ناعم بيدوم — للبس بكل يوم مباراة.',
    gk:'قفازات حراسة احترافية بلاتكس ناعم، رباط معصم ثابت وأصابع مقوّاة.',
    socks:'وسادات مانعة للانزلاق بتثبّت رجلك جوّا الحذاء لحركات أحدّ وبلا تزحلق.',
    shin:'حماية خفيفة بتضل ثابتة طول الـ90 دقيقة.',
    head:'هيدباند بيمتص العرق وما بيزحط، للتمرين ويوم المباراة.',
    ball:'كرة بجودة المباريات، طيران ولمسة دقيقة.'
  }
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const store = {
  get(k){ try { return localStorage.getItem(k); } catch { return null; } },
  set(k,v){ try { localStorage.setItem(k,v); } catch {} }
};

let lang = store.get('hs-lang') === 'ar' ? 'ar' : 'en';
const EN = {};
$$('[data-i18n]').forEach(el => { EN[el.dataset.i18n] = el.textContent; });
$$('[data-i18n-html]').forEach(el => { EN[el.dataset.i18nHtml] = el.innerHTML; });
Object.assign(EN, EN_EXTRA);
const t = k => (lang === 'ar' ? AR[k] : EN[k]) ?? EN[k] ?? k;

function applyLang(){
  const html = document.documentElement;
  html.lang = lang; html.dir = lang === 'ar' ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  $$('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  $('[data-lang-label]').textContent = lang === 'ar' ? 'EN' : 'عربي';
  renderFilters(); renderGrid(false); moveInk();
}

/* ================= WhatsApp / links ================= */
const waLink = msg => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`;
const defaultMsg = () => lang === 'ar' ? 'مرحبا Hadi Sport، بدي اسأل عن منتج' : 'Hi Hadi Sport! I\'d like to ask about a product.';
function wireLinks(){
  $$('[data-wa]').forEach(a => a.href = waLink(defaultMsg()));
  $$('#mapLink,[data-map]').forEach(a => a.href = CONFIG.maps);
}

/* ================= COLLECTION ================= */
let activeTab = 'boots', activeFilter = 'all';
const grid = $('#grid'), filtersEl = $('#filters');

function renderFilters(){
  const list = FILTERS[activeTab];
  filtersEl.innerHTML = list ? list.map(f =>
    `<button class="filter${f === activeFilter ? ' is-active' : ''}" data-filter="${f}" type="button">${t('f.' + f)}</button>`).join('') : '';
}
function catOf(p){ return p.tab === 'acc' ? p.f : p.tab; }
function renderGrid(animate = true){
  const items = PRODUCTS.filter(p => p.tab === activeTab && (activeFilter === 'all' || p.f === activeFilter));
  grid.innerHTML = items.map((p, i) => `
    <article class="card" tabindex="0" data-id="${p.id}" style="animation-delay:${animate ? i * 60 : 0}ms">
      <div class="card__img">
        <img src="${IMG}${p.id}.webp" alt="${p.n} — ${p.v}" loading="lazy" decoding="async" data-loading onload="this.removeAttribute('data-loading')">
        ${p.isNew ? `<span class="card__new">${t('new')}</span>` : ''}
        <span class="card__quick"><svg viewBox="0 0 24 24"><use href="#i-wa"/></svg><span>${t('quick')}</span></span>
      </div>
      <div class="card__body">
        <div class="card__cat">${CAT_LABEL[lang][catOf(p)]}</div>
        <h3 class="card__name">${p.n}</h3>
        <p class="card__var">${p.v}</p>
      </div>
    </article>`).join('');
  $$('img[data-loading]', grid).forEach(img => { if (img.complete) img.removeAttribute('data-loading'); });
}
function setTab(tab, sub = 'all'){
  activeTab = tab; activeFilter = FILTERS[tab] ? sub : 'all';
  $$('.tab').forEach(b => { const on = b.dataset.tab === tab; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
  renderFilters(); renderGrid(); moveInk();
}
function moveInk(){
  const a = $('.tab.is-active'), ink = $('#tabInk');
  if (!a) return;
  ink.style.width = a.offsetWidth + 'px';
  ink.style.transform = `translateX(${a.offsetLeft}px)`;
}
$('#tabs').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) setTab(b.dataset.tab); });
filtersEl.addEventListener('click', e => {
  const b = e.target.closest('.filter'); if (!b) return;
  activeFilter = b.dataset.filter; renderFilters(); renderGrid();
});
document.addEventListener('click', e => {
  const g = e.target.closest('[data-goto]'); if (!g) return;
  e.preventDefault();
  setTab(g.dataset.goto, g.dataset.sub || 'all');
  closeNav();
  $('#collection').scrollIntoView({behavior:'smooth'});
});
window.addEventListener('resize', moveInk);

/* ================= QUICK VIEW ================= */
const modal = $('#modal');
let current = null, size = null;
function openModal(id){
  const p = PRODUCTS.find(x => x.id === id); if (!p) return;
  current = p; size = null;
  const cat = catOf(p);
  $('#mImg').src = IMG + p.id + '.webp'; $('#mImg').alt = p.n;
  $('#mCat').innerHTML = `<span>${CAT_LABEL[lang][cat]}</span>`;
  $('#mTitle').textContent = p.n;
  $('#mVar').textContent = p.v;
  $('#mDesc').textContent = DESC[lang][cat];
  const sizes = SIZES[cat];
  if (sizes.length === 1) size = sizes[0];
  $('#mSizes').innerHTML = sizes.map(s => `<button class="size${s === size ? ' is-active' : ''}" type="button">${s}</button>`).join('');
  updateWa();
  modal.classList.add('is-open'); modal.setAttribute('aria-hidden','false');
  document.body.classList.add('no-scroll');
  setTimeout(() => $('.modal__x').focus(), 50);
}
function updateWa(){
  const p = current;
  const msg = lang === 'ar'
    ? `مرحبا Hadi Sport 👋\nبدي اطلب:\n• ${p.n} — ${p.v}\n• المقاس: ${size || 'بدي استشارة بالمقاس'}\nشو السعر والتوفر؟`
    : `Hi Hadi Sport 👋\nI'd like to order:\n• ${p.n} — ${p.v}\n• Size: ${size || 'need help choosing'}\nIs it available, and what's the price?`;
  $('#mWa').href = waLink(msg);
}
function closeModal(){
  modal.classList.remove('is-open'); modal.setAttribute('aria-hidden','true');
  document.body.classList.remove('no-scroll');
}
grid.addEventListener('click', e => { const c = e.target.closest('.card'); if (c) openModal(c.dataset.id); });
grid.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) { e.preventDefault(); openModal(e.target.dataset.id); } });
$('#mSizes').addEventListener('click', e => {
  const b = e.target.closest('.size'); if (!b) return;
  $$('.size', modal).forEach(x => x.classList.remove('is-active'));
  b.classList.add('is-active'); size = b.textContent; updateWa();
});
modal.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });

/* ================= NAV ================= */
const nav = $('#nav'), burger = $('#burger');
function closeNav(){ nav.classList.remove('is-open'); burger.setAttribute('aria-expanded','false'); }
burger.addEventListener('click', () => {
  const open = !nav.classList.contains('is-open');
  nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open);
});
$$('a', nav).forEach(a => a.addEventListener('click', closeNav));
$('#langBtn').addEventListener('click', () => {
  lang = lang === 'ar' ? 'en' : 'ar'; store.set('hs-lang', lang); applyLang(); wireLinks();
});

/* ================= SCROLL FX ================= */
const header = $('#header'), progress = $('#progress'), waFloat = $('.wa-float');
const parallax = $$('[data-parallax]');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let lastY = 0, ticking = false;
function onScroll(){
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  header.classList.toggle('is-scrolled', y > 30);
  header.classList.toggle('is-hidden', y > 500 && y > lastY && !nav.classList.contains('is-open'));
  waFloat.classList.toggle('is-in', y > innerHeight * .6);
  if (!reduce) parallax.forEach(el => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    el.style.transform = `translate3d(0,${(r.top) * -parseFloat(el.dataset.parallax)}px,0)`;
  });
  lastY = y; ticking = false;
}
addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, {passive:true});

// active nav link
const sections = ['collection','kits','goalkeeper','essentials','store'].map(id => document.getElementById(id));

/* reveal on view */
function initReveal(){
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('is-in'); io.unobserve(en.target);
  }), {threshold:.12, rootMargin:'0px 0px -6% 0px'});
  // stagger siblings
  $$('.bento, .steps, .faq, .rail, .perks, .versus, .gk__cards').forEach(g => $$('.reveal', g).forEach((el, i) => el.style.setProperty('--d', i * .08 + 's')));
  $$('.hero__title .reveal-up').forEach((el, i) => el.style.setProperty('--d', .1 + i * .12 + 's'));
  $$('.hero .reveal').forEach((el, i) => el.style.setProperty('--d', .35 + i * .1 + 's'));
  $$('.reveal').forEach(el => io.observe(el));
  $$('.hero__title .reveal-up').forEach(el => el.classList.add('is-in'));
}

/* counters */
function initCounters(){
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return; io.unobserve(en.target);
    const el = en.target, to = +el.dataset.to, t0 = performance.now(), dur = 1800;
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(to * e).toLocaleString('en-US');
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), {threshold:.5});
  $$('.count').forEach(c => io.observe(c));
}

/* essentials rail */
const rail = $('#rail');
$$('[data-rail]').forEach(b => b.addEventListener('click', () => {
  const dir = +b.dataset.rail * (document.documentElement.dir === 'rtl' ? -1 : 1);
  rail.scrollBy({left: dir * (rail.querySelector('.ess').offsetWidth + 20), behavior:'smooth'});
}));

/* ================= POINTER FX (desktop) ================= */
if (matchMedia('(pointer:fine)').matches && !reduce){
  const cur = $('#cursor');
  let cx = innerWidth/2, cy = innerHeight/2, tx = cx, ty = cy;
  addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; cur.classList.add('is-on'); }, {passive:true});
  document.addEventListener('mouseleave', () => cur.classList.remove('is-on'));
  (function loop(){ cx += (tx - cx) * .18; cy += (ty - cy) * .18; cur.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); })();
  document.addEventListener('mouseover', e => cur.classList.toggle('is-hover', !!e.target.closest('a,button,.card,.tile,.ess,summary')));

  // magnetic buttons
  $$('.magnetic').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width/2) * .22}px,${(e.clientY - r.top - r.height/2) * .3}px)`;
    });
    el.addEventListener('mouseleave', () => el.style.transform = '');
  });
  // 3D tilt
  $$('[data-tilt]').forEach(el => {
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      el.style.transform = `perspective(1000px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`;
    });
    el.addEventListener('mouseleave', () => el.style.transform = '');
  });
  // hero mark follows pointer
  const hv = $('#heroVisual');
  $('.hero').addEventListener('mousemove', e => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    $$('.hp', hv).forEach((p, i) => { p.style.transform = `translate(${x * (8 + i * 6)}px,${y * (8 + i * 6)}px)`; });
  });
}

/* ================= LOADER ================= */
function runLoader(){
  const loader = $('#loader'), bar = $('#loaderBar'), count = $('#loaderCount');
  const critical = ['assets/img/bg/hero.webp','assets/img/p/b05.webp','assets/img/p/b01.webp','assets/img/p/j01.webp','assets/img/p/g02.webp'];
  let loaded = 0, shown = 0, done = false;
  const minTime = reduce ? 200 : 1900, t0 = performance.now();
  critical.forEach(src => { const i = new Image(); i.onload = i.onerror = () => loaded++; i.src = src; });
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  let fontsOk = false; fontsReady.then(() => fontsOk = true);
  setTimeout(() => { fontsOk = true; loaded = critical.length; }, 6000); // never hang

  (function tick(now){
    const real = (loaded / critical.length) * .85 + (fontsOk ? .15 : 0);
    const time = Math.min(1, (now - t0) / minTime);
    const target = Math.min(real, time) * 100;
    shown += (target - shown) * .12;
    if (target >= 100 && shown > 99.4) shown = 100;
    bar.style.width = shown + '%';
    count.textContent = String(Math.floor(shown)).padStart(2,'0');
    if (shown >= 100 && !done){
      done = true;
      setTimeout(() => {
        loader.classList.add('is-done');
        document.body.classList.remove('is-loading');
        initReveal(); onScroll();
        setTimeout(() => loader.classList.add('is-gone'), 1200);
      }, 250);
      return;
    }
    requestAnimationFrame(tick);
  })(t0);
}

/* ================= BOOT ================= */
$('#year').textContent = new Date().getFullYear();
const navObs = new IntersectionObserver(es => es.forEach(en => {
  if (en.isIntersecting) $$('.nav a').forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
}), {rootMargin:'-45% 0px -50% 0px'});
sections.forEach(s => s && navObs.observe(s));
applyLang(); wireLinks(); initCounters(); runLoader();
})();
