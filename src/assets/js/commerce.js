/* Ya 7kayti - shared commerce client.
   Cart persistence, API access and localized strings. Loaded on the product,
   cart, checkout and confirmation pages only. */
(function (global) {
  'use strict';

  var LOCALE = document.documentElement.lang === 'en' ? 'en' : 'ar';
  var CART_KEY = 'yk_cart';
  var CHECKOUT_KEY = 'yk_checkout';

  /* ------------------------------------------------------------ strings -- */
  var T = {
    ar: {
      required: 'هذا الحقل مطلوب.',
      invalid: 'القيمة غير صحيحة.',
      photoRequired: 'صورة الطفل مطلوبة.',
      uploadTitle: 'اضغطوا لرفع صورة طفلك',
      uploadHint: 'JPG أو PNG أو WEBP — حتى {mb} ميغابايت',
      uploading: 'جارٍ الرفع…',
      uploaded: 'تم رفع الصورة',
      replace: 'استبدال',
      remove: 'حذف',
      uploadFailedType: 'صيغة الملف غير مدعومة. الرجاء رفع صورة JPG أو PNG أو WEBP.',
      uploadFailedSize: 'حجم الصورة كبير جدًا. الحد الأقصى {mb} ميغابايت.',
      uploadFailed: 'تعذّر رفع الصورة. حاولوا مرة أخرى.',
      privacy: 'نستخدم صورة طفلك فقط لتجهيز طلبك، ولا ننشرها لأغراض تسويقية دون موافقتكم.',
      next: 'التالي', back: 'رجوع', addToCart: 'أضف إلى السلة', saveChanges: 'حفظ التعديلات',
      review: 'مراجعة', edit: 'تعديل',
      stepDetails: 'التفاصيل', stepPhoto: 'الصورة', stepReview: 'المراجعة',
      total: 'الإجمالي', quantity: 'الكمية', price: 'السعر',
      choosePrice: 'اختاروا الخيارات لعرض السعر',
      addedToCart: 'تمت الإضافة إلى السلة',
      goToCart: 'الذهاب إلى السلة', keepShopping: 'متابعة التسوّق',
      photoUploaded: 'الصورة مرفوعة ✓',
      cartEmpty: 'سلتك فارغة حاليًا.',
      browse: 'تصفّح المنتجات',
      editCustomization: 'تعديل التخصيص', removeItem: 'إزالة',
      removeConfirm: 'هل تريدون إزالة هذا المنتج من السلة؟',
      subtotal: 'مجموع المنتجات', shipping: 'التوصيل',
      shippingTBC: 'يُحدَّد لاحقًا', shippingNote: 'نتواصل معكم لتحديد تكلفة التوصيل بعد تأكيد الطلب.',
      checkout: 'إتمام الطلب', continueShopping: 'متابعة التسوّق',
      priceChanged: 'تغيّر سعر «{name}» من {from} إلى {to}. راجعوا الطلب قبل المتابعة.',
      productUnavailable: '«{name}» غير متوفّر حاليًا. أزيلوه أو عدّلوه للمتابعة.',
      optionUnavailable: 'أحد الخيارات المختارة في «{name}» لم يعد متاحًا. عدّلوا التخصيص.',
      uploadMissing: 'صورة الطفل مفقودة في «{name}». عدّلوا التخصيص لرفعها.',
      missingRequired: 'ينقص «{name}» معلومات مطلوبة. عدّلوا التخصيص.',
      quantityAdjusted: 'تم تعديل الكمية في «{name}» إلى {to}.',
      cartProblem: 'يوجد ما يحتاج انتباهكم قبل إتمام الطلب.',
      yourInfo: 'معلوماتكم', delivery: 'التوصيل', payment: 'طريقة الدفع',
      fullName: 'الاسم الكامل', phone: 'رقم الهاتف / واتساب', email: 'البريد الإلكتروني (اختياري)',
      country: 'البلد', city: 'المدينة / المنطقة', address: 'العنوان الكامل',
      addressNotes: 'تفاصيل إضافية للعنوان (اختياري)',
      cod: 'الدفع عند الاستلام', codNote: 'تدفعون نقدًا عند استلام الطلب.',
      whish: 'Whish Money', whishNote: 'ننسّق معكم تفاصيل الدفع مباشرةً بعد استلام الطلب.',
      placeOrder: 'إتمام الطلب', placing: 'جارٍ إرسال الطلب…',
      orderFailed: 'تعذّر إرسال الطلب. تحقّقوا من اتصالكم وحاولوا مرة أخرى.',
      networkError: 'تعذّر الاتصال. طلبكم محفوظ — حاولوا مرة أخرى.',
      productionNote: 'مدة التنفيذ عادةً من ٢ إلى ٥ أيام. مدة التوصيل منفصلة وتُنسَّق معكم.',
      of: 'من',
    },
    en: {
      required: 'This field is required.',
      invalid: 'That value is not valid.',
      photoRequired: 'Your child’s photo is required.',
      uploadTitle: 'Tap to upload your child’s photo',
      uploadHint: 'JPG, PNG or WEBP — up to {mb} MB',
      uploading: 'Uploading…',
      uploaded: 'Photo uploaded',
      replace: 'Replace',
      remove: 'Remove',
      uploadFailedType: 'That file type isn’t supported. Please upload a JPG, PNG or WEBP image.',
      uploadFailedSize: 'That image is too large. The maximum is {mb} MB.',
      uploadFailed: 'The photo could not be uploaded. Please try again.',
      privacy: 'We use your child’s photo only to prepare your order, and never for marketing without your permission.',
      next: 'Next', back: 'Back', addToCart: 'Add to cart', saveChanges: 'Save changes',
      review: 'Review', edit: 'Edit',
      stepDetails: 'Details', stepPhoto: 'Photo', stepReview: 'Review',
      total: 'Total', quantity: 'Quantity', price: 'Price',
      choosePrice: 'Choose your options to see the price',
      addedToCart: 'Added to your cart',
      goToCart: 'Go to cart', keepShopping: 'Keep shopping',
      photoUploaded: 'Photo uploaded ✓',
      cartEmpty: 'Your cart is empty.',
      browse: 'Browse products',
      editCustomization: 'Edit personalization', removeItem: 'Remove',
      removeConfirm: 'Remove this item from your cart?',
      subtotal: 'Products subtotal', shipping: 'Delivery',
      shippingTBC: 'To be confirmed', shippingNote: 'We’ll contact you to confirm the delivery cost after your order.',
      checkout: 'Checkout', continueShopping: 'Continue shopping',
      priceChanged: 'The price of “{name}” changed from {from} to {to}. Please review before continuing.',
      productUnavailable: '“{name}” is currently unavailable. Remove or edit it to continue.',
      optionUnavailable: 'An option chosen for “{name}” is no longer available. Please update it.',
      uploadMissing: 'The photo for “{name}” is missing. Edit the personalization to upload it.',
      missingRequired: '“{name}” is missing required details. Edit the personalization.',
      quantityAdjusted: 'The quantity for “{name}” was adjusted to {to}.',
      cartProblem: 'Something needs your attention before checkout.',
      yourInfo: 'Your details', delivery: 'Delivery', payment: 'Payment method',
      fullName: 'Full name', phone: 'Phone / WhatsApp number', email: 'Email (optional)',
      country: 'Country', city: 'City / region', address: 'Full address',
      addressNotes: 'Extra directions (optional)',
      cod: 'Cash on delivery', codNote: 'You pay in cash when your order arrives.',
      whish: 'Whish Money', whishNote: 'We’ll arrange the payment details with you directly after your order.',
      placeOrder: 'Place order', placing: 'Placing your order…',
      orderFailed: 'Your order could not be sent. Check your connection and try again.',
      networkError: 'Connection failed. Your order is saved — please try again.',
      productionNote: 'Production usually takes 2–5 days. Delivery time is separate and arranged with you.',
      of: 'of',
    },
  }[LOCALE];

  function t(key, vars) {
    var s = T[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace('{' + k + '}', vars[k]); });
    return s;
  }

  /* ---------------------------------------------------------------- api -- */
  async function api(path, options) {
    var opts = options || {};
    var init = { method: opts.method || 'GET', headers: {} };
    if (opts.form) init.body = opts.form;
    else if (opts.body !== undefined) {
      init.body = JSON.stringify(opts.body);
      init.headers['content-type'] = 'application/json';
    }
    var res = await fetch('/api/' + path, init);
    var data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    return { ok: res.ok, status: res.status, data: data };
  }

  /* --------------------------------------------------------------- cart -- */
  // Part 2 §21: survives refresh and navigation, and is locale-independent so
  // switching language never clears it.
  var cart = {
    read: function () {
      try {
        var raw = localStorage.getItem(CART_KEY);
        if (!raw) return { items: [] };
        var p = JSON.parse(raw);
        return Array.isArray(p.items) ? p : { items: [] };
      } catch (e) { return { items: [] }; }
    },
    write: function (data) {
      try { localStorage.setItem(CART_KEY, JSON.stringify(data)); } catch (e) { /* private mode */ }
      cart.updateBadge();
      return data;
    },
    items: function () { return cart.read().items; },
    // Each personalized configuration is its own line. Part 2 §17.
    add: function (item) {
      var c = cart.read();
      c.items.push(item);
      return cart.write(c);
    },
    // Editing updates the same line rather than creating a duplicate. §20
    update: function (lineId, item) {
      var c = cart.read();
      var i = c.items.findIndex(function (x) { return x.lineId === lineId; });
      if (i >= 0) c.items[i] = item; else c.items.push(item);
      return cart.write(c);
    },
    get: function (lineId) {
      return cart.items().find(function (x) { return x.lineId === lineId; }) || null;
    },
    remove: function (lineId) {
      var c = cart.read();
      c.items = c.items.filter(function (x) { return x.lineId !== lineId; });
      return cart.write(c);
    },
    clear: function () { return cart.write({ items: [] }); },
    count: function () { return cart.items().length; },
    updateBadge: function () {
      var n = cart.count();
      document.querySelectorAll('[data-cart-count]').forEach(function (el) {
        el.textContent = String(n);
        el.setAttribute('data-count', String(n));
      });
    },
  };

  /* ------------------------------------------------------------ helpers -- */
  var money = function (n) {
    if (n == null) return '—';
    var s = Number(n).toFixed(2).replace(/\.00$/, '');
    return '$' + s;
  };

  var esc = function (s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  var uid = function () {
    return 'ln_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  };

  // Always trailing-slashed, matching every built route and the canonicals,
  // so the browser never takes an extra redirect hop.
  var localeUrl = function (p) {
    var clean = String(p).replace(/^\/+|\/+$/g, '');
    return '/' + LOCALE + '/' + (clean ? clean + '/' : '');
  };

  // Part 2 §42: checkout details survive a failed submission.
  var checkoutDraft = {
    read: function () {
      try { return JSON.parse(sessionStorage.getItem(CHECKOUT_KEY)) || {}; } catch (e) { return {}; }
    },
    write: function (v) {
      try { sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(v)); } catch (e) { /* ignore */ }
    },
    clear: function () { try { sessionStorage.removeItem(CHECKOUT_KEY); } catch (e) { /* ignore */ } },
  };

  var config = null;
  async function getConfig() {
    if (config) return config;
    var r = await api('config');
    config = r.ok ? r.data : null;
    return config;
  }

  /* Keeps a fixed mobile CTA from covering inputs behind the keyboard. §56 */
  function watchKeyboard() {
    if (!global.visualViewport) return;
    var vv = global.visualViewport;
    var base = vv.height;
    vv.addEventListener('resize', function () {
      document.body.classList.toggle('kb-open', vv.height < base * 0.75);
    });
  }

  global.YK = {
    LOCALE: LOCALE, t: t, api: api, cart: cart, money: money, esc: esc, uid: uid,
    localeUrl: localeUrl, getConfig: getConfig, checkoutDraft: checkoutDraft,
    watchKeyboard: watchKeyboard,
  };

  cart.updateBadge();
  watchKeyboard();
}(window));
