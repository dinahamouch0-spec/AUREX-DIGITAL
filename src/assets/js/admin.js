/* Ya 7kayti admin dashboard.
   A small hash-routed app over /api/admin/*. The API enforces every rule; this
   is the operator's view of it. Part 3 §1-§27, §57. */
(function () {
  'use strict';

  var app = document.getElementById('admin-app');
  if (!app) return;

  var S = {   // Arabic UI: the owner's language. Content fields stay bilingual.
    title: 'لوحة تحكم يا حكايتي',
    login: 'تسجيل الدخول', username: 'اسم المستخدم', password: 'كلمة المرور',
    signIn: 'دخول', signingIn: 'جارٍ الدخول…', logout: 'خروج',
    badLogin: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
    locked: 'تم إيقاف المحاولات مؤقتًا بعد عدّة محاولات خاطئة. حاولي بعد قليل.',
    notConfigured: 'لم تُضبط كلمة مرور اللوحة بعد. اضبطي ADMIN_PASSWORD في إعدادات Netlify ثم أعيدي النشر.',
    overview: 'نظرة عامة', orders: 'الطلبات', products: 'المنتجات',
    content: 'المحتوى', settings: 'الإعدادات', viewSite: 'عرض الموقع',
    newO: 'جديد', designing: 'قيد التصميم', waiting: 'بانتظار الموافقة',
    revision: 'طلب تعديل', approved: 'تمت الموافقة', printing: 'قيد الطباعة',
    ready: 'جاهز', shipped: 'تم الشحن', completed: 'مكتمل', cancelled: 'ملغى',
    payFollow: 'متابعة دفع',
    pending: 'بانتظار الدفع', pendingVer: 'بانتظار التأكيد', confirmed: 'مؤكّد',
    cod: 'عند الاستلام', failed: 'فشل',
    recent: 'أحدث الطلبات', noOrders: 'لا توجد طلبات بعد.',
    search: 'بحث برقم الطلب أو الاسم أو الهاتف', all: 'الكل',
    orderNo: 'رقم الطلب', date: 'التاريخ', customer: 'العميل', phone: 'الهاتف',
    items: 'القطع', subtotal: 'المنتجات', shippingC: 'التوصيل', total: 'الإجمالي',
    payment: 'الدفع', production: 'الحالة', actions: '',
    open: 'فتح', back: 'رجوع',
    customerInfo: 'معلومات العميل', deliveryInfo: 'التوصيل',
    name: 'الاسم', email: 'البريد', country: 'البلد', city: 'المدينة',
    address: 'العنوان', addressNotes: 'تفاصيل إضافية',
    contactWa: 'تواصل عبر واتساب', copyMsg: 'نسخ رسالة',
    orderItems: 'قطع الطلب', quantity: 'الكمية', unitPrice: 'سعر القطعة',
    lineTotal: 'المجموع', childPhoto: 'صورة الطفل',
    viewPhoto: 'عرض', downloadPhoto: 'تحميل للطباعة', deletePhoto: 'حذف الصورة الآن',
    photoDeleted: 'حُذفت الصورة حسب سياسة الاحتفاظ.',
    photoScheduled: 'الحذف مجدول في',
    deleteConfirm: 'حذف صورة الطفل نهائيًا؟ لا يمكن التراجع.',
    paymentPanel: 'الدفع', productionPanel: 'حالة التنفيذ', shippingPanel: 'التوصيل',
    shippingCost: 'تكلفة التوصيل', shippingUnknown: 'لم تُحدَّد بعد',
    save: 'حفظ', saved: 'تم الحفظ', saveFailed: 'تعذّر الحفظ.',
    finalTotal: 'الإجمالي النهائي',
    timeline: 'سجلّ العمليات',
    addProduct: 'منتج جديد', edit: 'تعديل', archive: 'أرشفة',
    archiveConfirm: 'أرشفة هذا المنتج؟ لن يظهر في المتجر، وتبقى الطلبات السابقة كما هي.',
    status: 'الحالة', active: 'منشور', draft: 'مسودة', archived: 'مؤرشف',
    price: 'السعر', category: 'القسم', featured: 'مميّز',
    nameAr: 'الاسم بالعربية', nameEn: 'الاسم بالإنجليزية',
    shortAr: 'وصف مختصر (عربي)', shortEn: 'وصف مختصر (إنجليزي)',
    descAr: 'الوصف (عربي)', descEn: 'الوصف (إنجليزي)',
    pricingType: 'نوع التسعير', fixed: 'سعر ثابت', unit: 'سعر للقطعة',
    optionOverride: 'السعر حسب الخيار', basePrice: 'السعر الأساسي',
    driverField: 'الحقل الذي يحدّد السعر',
    fields: 'حقول التخصيص', addField: 'إضافة حقل', addOption: 'إضافة خيار',
    fieldKey: 'المفتاح', fieldType: 'النوع', required: 'مطلوب',
    labelAr: 'العنوان بالعربية', labelEn: 'العنوان بالإنجليزية',
    optLabelAr: 'الخيار بالعربية', optLabelEn: 'الخيار بالإنجليزية',
    optPrice: 'السعر', remove: 'حذف',
    tShort: 'نص قصير', tLong: 'نص طويل', tNumber: 'رقم', tSelect: 'قائمة',
    tRadio: 'اختيار واحد', tCheckbox: 'اختيار متعدد', tImage: 'صورة',
    publishBlocked: 'لا يمكن النشر — صحّحي التالي:',
    faqs: 'الأسئلة الشائعة', creations: 'أعمال سابقة', reviews: 'آراء العملاء',
    question: 'السؤال', answer: 'الجواب', addItem: 'إضافة', published: 'منشور',
    reviewText: 'نص الرأي', reviewAuthor: 'الاسم',
    noReviews: 'لا توجد آراء منشورة. لا تُخترع آراء — أضيفي الآراء الحقيقية فقط.',
    businessName: 'اسم العمل', whatsapp: 'رقم واتساب', whish: 'رقم Whish',
    instagram: 'رابط إنستغرام', bizEmail: 'بريد العمل',
    prodMin: 'أقل مدة تنفيذ (أيام)', prodMax: 'أطول مدة تنفيذ (أيام)',
    retention: 'حذف صور الأطفال بعد اكتمال الطلب (ساعات)',
    abandoned: 'حذف الصور غير المستخدمة بعد (ساعات)',
    maxUpload: 'أقصى حجم للصورة (ميغابايت)',
    runCleanup: 'تشغيل التنظيف الآن', cleanupDone: 'اكتمل التنظيف',
    loading: 'جارٍ التحميل…', error: 'حدث خطأ. حاولي مرة أخرى.',
    yes: 'نعم', no: 'لا',
  };

  // Readable labels for the audit trail. Anything unmapped falls back to the
  // raw key rather than being hidden, so nothing goes unrecorded on screen.
  var EVENTS = {
    order_created: 'أُنشئ الطلب',
    payment_status_changed: 'تغيّرت حالة الدفع',
    production_status_changed: 'تغيّرت حالة التنفيذ',
    shipping_cost_set: 'حُدّدت تكلفة التوصيل',
    photo_deletion_scheduled: 'جُدول حذف الصورة',
    photo_deleted: 'حُذفت الصورة',
    photo_deleted_manually: 'حُذفت الصورة يدويًا',
    upload_created: 'رُفعت صورة',
    upload_deleted: 'حُذفت صورة غير مستخدمة',
    admin_login: 'تسجيل دخول',
    admin_login_failed: 'محاولة دخول فاشلة',
    product_saved: 'حُفظ منتج',
    product_archived: 'أُرشف منتج',
    category_saved: 'حُفظ قسم',
    content_saved: 'حُفظ محتوى',
    settings_saved: 'حُفظت الإعدادات',
  };

  var PROD_STATUS = [
    ['new', S.newO, 'new'], ['designing', S.designing, 'designing'],
    ['waiting_approval', S.waiting, 'waiting'], ['revision_requested', S.revision, 'revision'],
    ['approved', S.approved, 'approved'], ['printing', S.printing, 'printing'],
    ['ready', S.ready, 'ready'], ['shipped', S.shipped, 'shipped'],
    ['completed', S.completed, 'completed'], ['cancelled', S.cancelled, 'cancelled'],
  ];
  var PAY_STATUS = [
    ['pending', S.pending, 'pending'], ['pending_verification', S.pendingVer, 'pending'],
    ['confirmed', S.confirmed, 'confirmed'], ['cod', S.cod, 'cod'], ['failed', S.failed, 'failed'],
  ];
  var FIELD_TYPES = [
    ['short_text', S.tShort], ['long_text', S.tLong], ['number', S.tNumber],
    ['select', S.tSelect], ['radio', S.tRadio], ['checkbox', S.tCheckbox], ['image_upload', S.tImage],
  ];

  /* ------------------------------------------------------------ helpers -- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function money(n) { return n == null ? '—' : '$' + Number(n).toFixed(2).replace(/\.00$/, ''); }
  function dt(s) {
    if (!s) return '—';
    var d = new Date(s);
    return d.toLocaleDateString('ar', { day: '2-digit', month: '2-digit', year: '2-digit' })
      + ' · ' + d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  }
  function label(list, key) { var f = list.find(function (x) { return x[0] === key; }); return f ? f[1] : key; }
  function cls(list, key) { var f = list.find(function (x) { return x[0] === key; }); return f ? f[2] : 'new'; }
  function st(list, key) { return '<span class="st st--' + cls(list, key) + '">' + esc(label(list, key)) + '</span>'; }

  async function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', headers: {} };
    if (opts.body !== undefined) {
      init.body = JSON.stringify(opts.body);
      init.headers['content-type'] = 'application/json';
    }
    var res = await fetch('/api/' + path, init);
    var data = null;
    try { data = await res.json(); } catch (e) {}
    return { ok: res.ok, status: res.status, data: data };
  }

  var toastTimer;
  function toast(msg, kind) {
    var el = document.querySelector('.toast');
    if (el) el.remove();
    el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    el.setAttribute('role', 'status');
    el.textContent = msg;
    document.body.appendChild(el);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.remove(); }, 3200);
  }

  var busy = function (on) { app.classList.toggle('is-busy', !!on); };

  /* -------------------------------------------------------------- login -- */
  async function boot() {
    var me = await api('admin/me');
    if (me.data && me.data.authenticated) { route(); window.addEventListener('hashchange', route); }
    else renderLogin(me.data && me.data.configured === false);
  }

  function renderLogin(notConfigured) {
    app.innerHTML =
      '<div class="login-wrap"><div class="login-card">'
      + '<img src="/assets/img/logo-mark-128.png" alt="">'
      + '<h1>' + esc(S.title) + '</h1>'
      + (notConfigured ? '<div class="alert alert--warn" style="text-align:start"><span>' + esc(S.notConfigured) + '</span></div>' : '')
      + '<form id="login-form">'
      + '<div class="field"><label class="label" for="u">' + esc(S.username) + '</label>'
      + '<input class="input" id="u" name="username" autocomplete="username" value="admin"></div>'
      + '<div class="field"><label class="label" for="p">' + esc(S.password) + '</label>'
      + '<input class="input" id="p" name="password" type="password" autocomplete="current-password"></div>'
      + '<p class="field-error" role="alert" data-error></p>'
      + '<button class="btn btn--lg btn--block" type="submit">' + esc(S.signIn) + '</button>'
      + '</form></div></div>';

    document.getElementById('login-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var btn = e.target.querySelector('button');
      var err = e.target.querySelector('[data-error]');
      err.textContent = '';
      btn.setAttribute('aria-disabled', 'true');
      btn.textContent = S.signingIn;
      var r = await api('admin/login', {
        method: 'POST',
        body: { username: e.target.username.value, password: e.target.password.value },
      });
      btn.removeAttribute('aria-disabled');
      btn.textContent = S.signIn;
      if (r.ok) { location.hash = '#/'; route(); window.addEventListener('hashchange', route); return; }
      err.textContent = r.status === 429 ? S.locked
        : (r.data && r.data.error === 'not_configured' ? S.notConfigured : S.badLogin);
    });
  }

  /* -------------------------------------------------------------- shell -- */
  function shell(active, title, subtitle, bodyHtml, counts) {
    var nav = [
      ['', S.overview, 'grid'],
      ['orders', S.orders, 'list'],
      ['products', S.products, 'box'],
      ['content', S.content, 'edit'],
      ['settings', S.settings, 'cog'],
    ];
    var newCount = counts && counts.new ? counts.new : 0;

    return '<div class="admin-shell">'
      + '<aside class="admin-side">'
      + '<div class="admin-brand"><img src="/assets/img/logo-mark-96.png" alt="">'
      + '<span><strong>يا حكايتي</strong><span>لوحة التحكم</span></span></div>'
      + '<nav class="admin-nav">'
      + nav.map(function (n) {
          var isActive = n[0] === active;
          return '<a href="#/' + n[0] + '"' + (isActive ? ' class="is-active" aria-current="page"' : '') + '>'
            + esc(n[1])
            + (n[0] === 'orders' && newCount ? '<span class="admin-nav__count">' + newCount + '</span>' : '')
            + '</a>';
        }).join('')
      + '</nav>'
      + '<div class="admin-side__foot">'
      + '<a href="/ar/" target="_blank" rel="noopener">' + esc(S.viewSite) + ' ↗</a>'
      + '<button type="button" data-logout>' + esc(S.logout) + '</button>'
      + '</div></aside>'
      + '<main class="admin-main">'
      + '<div class="admin-head"><div><h1>' + esc(title) + '</h1>'
      + (subtitle ? '<p>' + esc(subtitle) + '</p>' : '') + '</div></div>'
      + bodyHtml + '</main></div>';
  }

  function bindShell() {
    var lo = app.querySelector('[data-logout]');
    if (lo) lo.addEventListener('click', async function () {
      await api('admin/logout', { method: 'POST' });
      location.hash = '';
      renderLogin(false);
    });
  }

  /* -------------------------------------------------------------- route -- */
  async function route() {
    var h = (location.hash || '#/').replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean);
    app.innerHTML = '<div class="admin-main"><div class="state" role="status">' + esc(S.loading) + '</div></div>';
    try {
      // Product, content and settings views live in admin-views.js and attach
      // themselves to the shared object once loaded.
      var V = window.__ykAdmin;
      if (!parts.length) return viewOverview();
      if (parts[0] === 'orders' && parts[1]) return viewOrder(parts[1]);
      if (parts[0] === 'orders') return viewOrders();
      if (parts[0] === 'products' && parts[1]) return V.viewProduct(parts[1]);
      if (parts[0] === 'products') return V.viewProducts();
      if (parts[0] === 'content') return V.viewContent();
      if (parts[0] === 'settings') return V.viewSettings();
      viewOverview();
    } catch (e) {
      app.innerHTML = shell('', S.error, '', '<div class="state state--error"><p>' + esc(S.error) + '</p></div>');
      bindShell();
    }
  }

  /* ----------------------------------------------------------- overview -- */
  async function viewOverview() {
    var r = await api('admin/overview');
    if (r.status === 401) return renderLogin(false);
    var c = r.data.counts, recent = r.data.recent;

    var tiles = [
      ['new', S.newO, c.new, true], ['designing', S.designing, c.designing],
      ['waiting_approval', S.waiting, c.waiting_approval], ['ready', S.ready, c.ready],
      ['shipped', S.shipped, c.shipped], ['', S.payFollow, c.payment_followup, true],
    ];

    app.innerHTML = shell('', S.overview, '', ''
      + '<div class="tiles">'
      + tiles.map(function (t) {
          var href = t[0] ? '#/orders?production=' + t[0] : '#/orders?payment=pending';
          return '<a class="tile' + (t[3] && t[2] ? ' tile--alert' : '') + '" href="' + href + '">'
            + '<span class="tile__n">' + (t[2] || 0) + '</span>'
            + '<span class="tile__l">' + esc(t[1]) + '</span></a>';
        }).join('')
      + '</div>'
      + '<div class="apanel"><h2>' + esc(S.recent) + '</h2>' + ordersTable(recent) + '</div>', c);
    bindShell();
  }

  function ordersTable(rows) {
    if (!rows || !rows.length) return '<div class="state"><p>' + esc(S.noOrders) + '</p></div>';
    return '<div class="table-wrap"><table class="admin-table"><thead><tr>'
      + ['orderNo', 'date', 'customer', 'phone', 'items', 'subtotal', 'payment', 'production']
          .map(function (k) { return '<th>' + esc(S[k]) + '</th>'; }).join('')
      + '<th></th></tr></thead><tbody>'
      + rows.map(function (o) {
          return '<tr>'
            + '<td data-label="' + esc(S.orderNo) + '"><a class="num" href="#/orders/' + esc(o.id) + '">' + esc(o.orderNumber) + '</a></td>'
            + '<td data-label="' + esc(S.date) + '">' + esc(dt(o.createdAt)) + '</td>'
            + '<td data-label="' + esc(S.customer) + '">' + esc(o.customerName) + '</td>'
            + '<td data-label="' + esc(S.phone) + '"><span dir="ltr">' + esc(o.phone) + '</span></td>'
            + '<td data-label="' + esc(S.items) + '">' + esc(o.itemCount) + '</td>'
            + '<td data-label="' + esc(S.subtotal) + '" class="num">' + esc(money(o.productsSubtotal)) + '</td>'
            + '<td data-label="' + esc(S.payment) + '">' + st(PAY_STATUS, o.paymentStatus) + '</td>'
            + '<td data-label="' + esc(S.production) + '">' + st(PROD_STATUS, o.productionStatus) + '</td>'
            + '<td><a class="btn btn--ghost btn--sm" href="#/orders/' + esc(o.id) + '">' + esc(S.open) + '</a></td>'
            + '</tr>';
        }).join('')
      + '</tbody></table></div>';
  }

  /* ------------------------------------------------------------- orders -- */
  async function viewOrders() {
    var qs = (location.hash.split('?')[1] || '');
    var params = new URLSearchParams(qs);
    var r = await api('admin/orders?' + params.toString());
    if (r.status === 401) return renderLogin(false);

    var opt = function (list, sel) {
      return '<option value="">' + esc(S.all) + '</option>'
        + list.map(function (x) {
            return '<option value="' + x[0] + '"' + (sel === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>';
          }).join('');
    };

    app.innerHTML = shell('orders', S.orders, r.data.total + '', ''
      + '<div class="toolbar">'
      + '<input class="input" id="q" placeholder="' + esc(S.search) + '" value="' + esc(params.get('q') || '') + '">'
      + '<select class="select" id="fprod">' + opt(PROD_STATUS, params.get('production')) + '</select>'
      + '<select class="select" id="fpay">' + opt(PAY_STATUS, params.get('payment')) + '</select>'
      + '</div>'
      + ordersTable(r.data.orders));
    bindShell();

    var apply = function () {
      var p = new URLSearchParams();
      var q = document.getElementById('q').value.trim();
      var pr = document.getElementById('fprod').value;
      var pa = document.getElementById('fpay').value;
      if (q) p.set('q', q);
      if (pr) p.set('production', pr);
      if (pa) p.set('payment', pa);
      location.hash = '#/orders' + (p.toString() ? '?' + p.toString() : '');
      route();
    };
    document.getElementById('fprod').addEventListener('change', apply);
    document.getElementById('fpay').addEventListener('change', apply);
    var qEl = document.getElementById('q');
    var timer;
    qEl.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(apply, 420); });
  }

  /* -------------------------------------------------------- order detail -- */
  async function viewOrder(id) {
    var r = await api('admin/orders/' + encodeURIComponent(id));
    if (r.status === 401) return renderLogin(false);
    if (!r.ok) return (app.innerHTML = shell('orders', S.error, '', ''), bindShell());

    var o = r.data.order, tl = r.data.timeline || [];
    var wa = String(o.customer.phone || '').replace(/\D/g, '');
    var waMsg = 'مرحبًا ' + o.customer.name + '، نتواصل معك من يا حكايتي بخصوص طلبك ' + o.orderNumber + '.';

    var sel = function (id2, list, cur) {
      return '<select class="select" id="' + id2 + '">'
        + list.map(function (x) {
            return '<option value="' + x[0] + '"' + (cur === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>';
          }).join('') + '</select>';
    };

    app.innerHTML = shell('orders', o.orderNumber, dt(o.createdAt), ''
      + '<p style="margin-block-end:var(--s-4)"><a class="btn btn--ghost btn--sm" href="#/orders">← ' + esc(S.back) + '</a></p>'
      + '<div class="grid-detail"><div>'

      // ---- items ----
      + '<div class="apanel"><h2>' + esc(S.orderItems) + '</h2>'
      + o.items.map(function (i) {
          var rows = i.fields.filter(function (f) { return f.type !== 'image_upload'; }).map(function (f) {
            var v = f.options && f.options.length
              ? f.options.map(function (x) { return x.label.ar || x.label.en; }).join('، ')
              : f.value;
            return '<div><dt>' + esc(f.label.ar || f.label.en) + '</dt><dd>' + esc(v) + '</dd></div>';
          }).join('');

          var photo;
          if (!i.photo) photo = '';
          else if (i.photo.state === 'deleted' || !i.photo.url) {
            photo = '<div class="oitem__photo"><div class="photo-gone">' + esc(S.photoDeleted) + '</div></div>';
          } else {
            photo = '<div class="oitem__photo">'
              + '<img src="' + esc(i.photo.url) + '" alt="' + esc(S.childPhoto) + '">'
              + '<div style="display:flex;flex-direction:column;gap:var(--s-2)">'
              + '<a class="btn btn--ghost btn--sm" href="' + esc(i.photo.url) + '" target="_blank" rel="noopener">' + esc(S.viewPhoto) + '</a>'
              + '<a class="btn btn--ghost btn--sm" href="' + esc(i.photo.url) + '" download>' + esc(S.downloadPhoto) + '</a>'
              + '<button class="btn btn--danger btn--sm" data-del-photo="' + esc(i.photo.uploadToken) + '">' + esc(S.deletePhoto) + '</button>'
              + '</div></div>';
          }

          return '<div class="oitem">'
            + '<div class="oitem__head"><strong>' + esc(i.productName.ar || i.productName.en) + '</strong>'
            + '<span>' + esc(i.quantity) + ' × ' + esc(money(i.unitPrice)) + ' = <b>' + esc(money(i.lineTotal)) + '</b></span></div>'
            + '<dl class="kv">' + rows + '</dl>' + photo + '</div>';
        }).join('')
      + '<dl class="kv" style="margin-block-start:var(--s-4)">'
      + '<div><dt>' + esc(S.subtotal) + '</dt><dd>' + esc(money(o.productsSubtotal)) + '</dd></div>'
      + '<div><dt>' + esc(S.shippingC) + '</dt><dd>' + (o.shippingCost == null
          ? '<span class="pending">' + esc(S.shippingUnknown) + '</span>' : esc(money(o.shippingCost))) + '</dd></div>'
      + '<div><dt>' + esc(S.finalTotal) + '</dt><dd>' + (o.finalTotal == null
          ? '<span class="pending">' + esc(S.shippingUnknown) + '</span>' : esc(money(o.finalTotal))) + '</dd></div>'
      + '</dl></div>'

      // ---- timeline ----
      + '<div class="apanel"><h2>' + esc(S.timeline) + '</h2><dl class="kv">'
      + (tl.length
          ? tl.map(function (e) {
              return '<div><dt>' + esc(dt(e.at)) + '</dt><dd>' + esc(EVENTS[e.event] || e.event) + '</dd></div>';
            }).join('')
          : '<div><dd>—</dd></div>') + '</dl></div>'

      + '</div><div>'

      // ---- customer ----
      + '<div class="apanel"><h2>' + esc(S.customerInfo) + '</h2><dl class="kv">'
      + '<div><dt>' + esc(S.name) + '</dt><dd>' + esc(o.customer.name) + '</dd></div>'
      + '<div><dt>' + esc(S.phone) + '</dt><dd dir="ltr">' + esc(o.customer.phone) + '</dd></div>'
      + (o.customer.email ? '<div><dt>' + esc(S.email) + '</dt><dd dir="ltr">' + esc(o.customer.email) + '</dd></div>' : '')
      + '<div><dt>' + esc(S.country) + '</dt><dd>' + esc(o.customer.country) + '</dd></div>'
      + '<div><dt>' + esc(S.city) + '</dt><dd>' + esc(o.customer.city) + '</dd></div>'
      + '<div><dt>' + esc(S.address) + '</dt><dd>' + esc(o.customer.address) + '</dd></div>'
      + (o.customer.addressNotes ? '<div><dt>' + esc(S.addressNotes) + '</dt><dd>' + esc(o.customer.addressNotes) + '</dd></div>' : '')
      + '</dl>'
      + (wa ? '<a class="btn btn--block" style="margin-block-start:var(--s-4)" target="_blank" rel="noopener" href="https://wa.me/'
          + esc(wa) + '?text=' + encodeURIComponent(waMsg) + '">' + esc(S.contactWa) + '</a>' : '')
      + '</div>'

      // ---- production / payment / shipping ----
      + '<div class="apanel"><h2>' + esc(S.productionPanel) + '</h2>'
      + sel('prod', PROD_STATUS, o.productionStatus)
      + (o.photoDeletionScheduledFor && !o.photosDeletedAt
          ? '<p class="help" style="margin-block-start:var(--s-3)">' + esc(S.photoScheduled) + ' ' + esc(dt(o.photoDeletionScheduledFor)) + '</p>' : '')
      + '</div>'
      + '<div class="apanel"><h2>' + esc(S.paymentPanel) + '</h2>'
      + '<p class="help">' + esc(o.paymentMethod === 'cod' ? S.cod : 'Whish Money') + '</p>'
      + sel('pay', PAY_STATUS, o.paymentStatus) + '</div>'
      + '<div class="apanel"><h2>' + esc(S.shippingPanel) + '</h2>'
      + '<div class="field"><label class="label" for="ship">' + esc(S.shippingCost) + '</label>'
      + '<input class="input" id="ship" type="number" step="0.5" min="0" inputmode="decimal" value="'
      + (o.shippingCost == null ? '' : esc(o.shippingCost)) + '" placeholder="' + esc(S.shippingUnknown) + '"></div>'
      + '<button class="btn btn--block" data-save-order>' + esc(S.save) + '</button></div>'

      + '</div></div>');
    bindShell();

    var save = async function (patch) {
      busy(true);
      var res = await api('admin/orders/' + encodeURIComponent(id), { method: 'PATCH', body: patch });
      busy(false);
      if (res.ok) { toast(S.saved, 'ok'); route(); }
      else toast(S.saveFailed, 'error');
    };

    document.getElementById('prod').addEventListener('change', function (e) { save({ productionStatus: e.target.value }); });
    document.getElementById('pay').addEventListener('change', function (e) { save({ paymentStatus: e.target.value }); });
    app.querySelector('[data-save-order]').addEventListener('click', function () {
      var v = document.getElementById('ship').value.trim();
      save({ shippingCost: v === '' ? null : Number(v) });
    });
    app.querySelectorAll('[data-del-photo]').forEach(function (b) {
      b.addEventListener('click', async function () {
        if (!confirm(S.deleteConfirm)) return;
        busy(true);
        await api('admin/photo/' + b.getAttribute('data-del-photo'), { method: 'DELETE' });
        busy(false);
        toast(S.saved, 'ok');
        route();
      });
    });
  }

  window.__ykAdmin = { api: api, esc: esc, money: money, toast: toast, shell: shell,
                       bindShell: bindShell, S: S, FIELD_TYPES: FIELD_TYPES, route: route, busy: busy };

  // admin-views.js is deferred too, so start once both have parsed.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
