/* Cart, checkout and order confirmation. */
(function () {
  'use strict';
  if (!window.YK) return;
  var YK = window.YK, t = YK.t, esc = YK.esc, money = YK.money;

  var cartRoot = document.querySelector('[data-cart-root]');
  var checkoutRoot = document.querySelector('[data-checkout-root]');
  var confirmRoot = document.querySelector('[data-confirm-root]');

  if (cartRoot) initCart();
  if (checkoutRoot) initCheckout();
  if (confirmRoot) initConfirm();

  /* ================================ CART ================================ */
  async function initCart() {
    var items = YK.cart.items();
    if (!items.length) return renderEmptyCart();

    cartRoot.innerHTML = '<div class="state" role="status"><div class="skeleton" style="block-size:100px"></div></div>';
    var check = await YK.api('cart/validate', { method: 'POST', body: { items: items, locale: YK.LOCALE } });
    var issues = (check.ok && check.data.issues) || [];
    var lines = (check.ok && check.data.lines) || [];

    // Server totals win over anything cached in the browser. Part 2 §6
    var byId = {};
    lines.forEach(function (l) { byId[l.lineId] = l; });
    var subtotal = (check.ok && check.data.subtotal) || 0;

    var html = issuesHtml(issues);
    html += items.map(function (it) { return cartLine(it, byId[it.lineId], issues); }).join('');
    html += '<div class="panel" style="margin-block-start:var(--s-5)">'
      + '<dl class="summary">'
      + '<div class="summary__row"><dt>' + esc(t('subtotal')) + '</dt><dd>' + esc(money(subtotal)) + '</dd></div>'
      // Part 2 §26: unknown shipping is shown as unknown, never as $0.
      + '<div class="summary__row"><dt>' + esc(t('shipping')) + '</dt>'
      + '<dd><span class="pending">' + esc(t('shippingTBC')) + '</span></dd></div>'
      + '</dl>'
      + '<p class="help" style="margin-block-start:var(--s-3)">' + esc(t('shippingNote')) + '</p>'
      + '<div class="step-actions">'
      + '<a class="btn btn--ghost" href="' + YK.localeUrl('shop') + '">' + esc(t('continueShopping')) + '</a>'
      + '<a class="btn" href="' + YK.localeUrl('checkout') + '"'
      + (blocking(issues).length ? ' aria-disabled="true"' : '') + '>' + esc(t('checkout')) + '</a>'
      + '</div></div>';

    cartRoot.innerHTML = html;
    bindCart();
  }

  var blocking = function (issues) {
    return issues.filter(function (i) { return i.code !== 'quantity_adjusted'; });
  };

  function issuesHtml(issues) {
    if (!issues.length) return '';
    return issues.map(function (i) {
      var name = i.productName || '';
      var msg;
      switch (i.code) {
        case 'price_changed':        msg = t('priceChanged', { name: name, from: money(i.from), to: money(i.to) }); break;
        case 'product_unavailable':  msg = t('productUnavailable', { name: name }); break;
        case 'option_unavailable':
        case 'option_missing':       msg = t('optionUnavailable', { name: name }); break;
        case 'upload_missing':       msg = t('uploadMissing', { name: name }); break;
        case 'missing_required':     msg = t('missingRequired', { name: name }); break;
        case 'quantity_adjusted':    msg = t('quantityAdjusted', { name: name, to: i.to }); break;
        default:                     msg = t('cartProblem');
      }
      var severity = i.code === 'quantity_adjusted' ? 'info' : 'warn';
      var edit = i.lineId
        ? '<span class="alert__actions"><a class="link-btn" href="' + editHref(i.lineId) + '">'
          + esc(t('editCustomization')) + '</a></span>'
        : '';
      return '<div class="alert alert--' + severity + '" role="alert"><span>' + esc(msg) + edit + '</span></div>';
    }).join('');
  }

  function editHref(lineId) {
    var item = YK.cart.get(lineId);
    if (!item) return YK.localeUrl('cart');
    return YK.localeUrl('product/' + item.productSlug) + '?edit=' + encodeURIComponent(lineId);
  }

  function cartLine(item, server, issues) {
    var problem = issues.find(function (i) { return i.lineId === item.lineId && i.code !== 'quantity_adjusted'; });
    var price = server ? server.lineTotal : item.displayPrice;
    var qty = server ? server.quantity : item.quantity;

    var bits = [];
    if (item.childName) bits.push('<b>' + esc(item.childName) + '</b>');
    if (item.answers && item.answers.theme) bits.push(esc(item.answers.theme));
    if (item.uploadToken) bits.push(esc(t('photoUploaded')));

    return '<article class="cart-line' + (problem ? ' is-problem' : '') + '" data-line="' + esc(item.lineId) + '">'
      + '<div class="cart-line__media">'
      + (item.productAsset
          ? '<img src="/assets/img/' + esc(item.productAsset) + '-480.webp" alt="" loading="lazy" width="480" height="320">'
          : '')
      + '</div>'
      + '<div class="cart-line__body">'
      + '<h2 class="cart-line__title">' + esc(item.productName || item.productSlug) + '</h2>'
      + '<p class="cart-line__meta">' + bits.join(' · ') + '</p>'
      + '<div class="cart-line__foot">'
      + '<a class="link-btn" href="' + editHref(item.lineId) + '">' + esc(t('editCustomization')) + '</a>'
      + '<button type="button" class="link-btn link-btn--danger" data-remove="' + esc(item.lineId) + '">'
      + esc(t('removeItem')) + '</button>'
      + '<span class="cart-line__price">' + esc(money(price)) + '</span>'
      + '</div>'
      + '<p class="help" style="margin-block-start:var(--s-2)">' + esc(t('quantity')) + ': ' + esc(qty) + '</p>'
      + '</div></article>';
  }

  function bindCart() {
    cartRoot.querySelectorAll('[data-remove]').forEach(function (b) {
      b.addEventListener('click', function () {
        if (!confirm(t('removeConfirm'))) return;
        YK.cart.remove(b.getAttribute('data-remove'));
        initCart();
      });
    });
  }

  function renderEmptyCart() {
    cartRoot.innerHTML = '<div class="state"><h2>' + esc(t('cartEmpty')) + '</h2>'
      + '<p style="margin-block-start:var(--s-5)"><a class="btn" href="' + YK.localeUrl('shop') + '">'
      + esc(t('browse')) + '</a></p></div>';
  }

  /* ============================== CHECKOUT ============================== */
  async function initCheckout() {
    var items = YK.cart.items();
    if (!items.length) {
      checkoutRoot.innerHTML = '<div class="state"><h2>' + esc(t('cartEmpty')) + '</h2>'
        + '<p style="margin-block-start:var(--s-5)"><a class="btn" href="' + YK.localeUrl('shop') + '">'
        + esc(t('browse')) + '</a></p></div>';
      return;
    }

    var cfg = await YK.getConfig();
    var check = await YK.api('cart/validate', { method: 'POST', body: { items: items, locale: YK.LOCALE } });
    var issues = (check.ok && check.data.issues) || [];
    var subtotal = (check.ok && check.data.subtotal) || 0;

    if (blocking(issues).length) {
      checkoutRoot.innerHTML = issuesHtml(issues)
        + '<p><a class="btn btn--ghost" href="' + YK.localeUrl('cart') + '">' + esc(t('review')) + '</a></p>';
      return;
    }

    var d = YK.checkoutDraft.read();
    var whish = (cfg && cfg.settings.whish) || '';

    checkoutRoot.innerHTML =
      '<form id="checkout-form" novalidate>'
      + '<div class="panel"><h2>' + esc(t('yourInfo')) + '</h2>'
      + input('name', t('fullName'), d.name, 'text', true, 'name')
      + input('phone', t('phone'), d.phone, 'tel', true, 'tel')
      + input('email', t('email'), d.email, 'email', false, 'email')
      + '</div>'

      + '<div class="panel"><h2>' + esc(t('delivery')) + '</h2>'
      + input('country', t('country'), d.country, 'text', true, 'country-name')
      + input('city', t('city'), d.city, 'text', true, 'address-level2')
      + textarea('address', t('address'), d.address, true)
      + textarea('addressNotes', t('addressNotes'), d.addressNotes, false)
      + '</div>'

      + '<div class="panel"><h2>' + esc(t('payment')) + '</h2>'
      + '<div class="choices" role="radiogroup" aria-label="' + esc(t('payment')) + '">'
      + payChoice('cod', t('cod'), t('codNote'), d.paymentMethod === 'cod')
      + payChoice('whish', t('whish'), t('whishNote') + (whish ? ' — ' + whish : ''), d.paymentMethod === 'whish')
      + '</div>'
      + '<p class="field-error" role="alert" data-error="paymentMethod"></p>'
      + '</div>'

      + '<div class="panel"><h2>' + esc(t('review')) + '</h2>'
      + '<dl class="summary">'
      + items.map(function (i) {
          var line = (check.data.lines || []).find(function (l) { return l.lineId === i.lineId; });
          return '<div class="summary__row"><dt>' + esc(i.productName)
            + (i.childName ? ' — ' + esc(i.childName) : '')
            + ' × ' + esc(line ? line.quantity : i.quantity) + '</dt>'
            + '<dd>' + esc(money(line ? line.lineTotal : i.displayPrice)) + '</dd></div>';
        }).join('')
      + '<div class="summary__row"><dt>' + esc(t('subtotal')) + '</dt><dd>' + esc(money(subtotal)) + '</dd></div>'
      + '<div class="summary__row"><dt>' + esc(t('shipping')) + '</dt>'
      + '<dd><span class="pending">' + esc(t('shippingTBC')) + '</span></dd></div>'
      + '</dl>'
      + '<p class="help" style="margin-block-start:var(--s-3)">' + esc(t('shippingNote')) + '</p>'
      + '<p class="help">' + esc(t('productionNote')) + '</p>'
      + '<p class="field-error" role="alert" data-error="_form"></p>'
      + '<div class="step-actions customizer-sticky">'
      + '<button type="submit" class="btn btn--lg btn--block" data-submit>' + esc(t('placeOrder')) + '</button>'
      + '</div>'
      + '</div></form>';

    bindCheckout(items);
  }

  function input(name, label, value, type, required, autocomplete) {
    return '<div class="field"><label class="label" for="c_' + name + '">' + esc(label)
      + (required ? '<span class="req">' + esc(YK.LOCALE === 'ar' ? 'مطلوب' : 'Required') + '</span>' : '')
      + '</label>'
      + '<input class="input" id="c_' + name + '" name="' + name + '" type="' + type + '"'
      + ' value="' + esc(value || '') + '" autocomplete="' + autocomplete + '"'
      + (type === 'tel' ? ' inputmode="tel"' : '') + '>'
      + '<p class="field-error" role="alert" data-error="' + name + '"></p></div>';
  }

  function textarea(name, label, value, required) {
    return '<div class="field"><label class="label" for="c_' + name + '">' + esc(label)
      + (required ? '<span class="req">' + esc(YK.LOCALE === 'ar' ? 'مطلوب' : 'Required') + '</span>' : '')
      + '</label>'
      + '<textarea class="textarea" id="c_' + name + '" name="' + name + '" autocomplete="street-address">'
      + esc(value || '') + '</textarea>'
      + '<p class="field-error" role="alert" data-error="' + name + '"></p></div>';
  }

  function payChoice(value, title, note, checked) {
    return '<label class="choice"><input type="radio" name="paymentMethod" value="' + value + '"'
      + (checked ? ' checked' : '') + '>'
      + '<span class="choice__dot" aria-hidden="true"></span>'
      + '<span class="choice__body"><span class="choice__title">' + esc(title) + '</span>'
      + '<span class="choice__note">' + esc(note) + '</span></span></label>';
  }

  function bindCheckout(items) {
    var form = document.getElementById('checkout-form');
    var submitting = false;
    // One key per checkout attempt: a retry after a lost response resolves to
    // the same order rather than creating a second one. Part 2 §31/§43.
    var idem = sessionStorage.getItem('yk_idem') || (YK.LOCALE + '-' + Date.now() + '-' + Math.random().toString(36).slice(2));
    sessionStorage.setItem('yk_idem', idem);

    var saveDraft = function () {
      var fd = new FormData(form);
      var o = {};
      fd.forEach(function (v, k) { o[k] = v; });
      YK.checkoutDraft.write(o);
    };
    form.addEventListener('input', saveDraft);
    form.addEventListener('change', saveDraft);

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (submitting) return;

      var fd = new FormData(form);
      var customer = {};
      fd.forEach(function (v, k) { customer[k] = String(v).trim(); });

      form.querySelectorAll('[data-error]').forEach(function (el) { el.textContent = ''; });
      form.querySelectorAll('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });

      var local = {};
      ['name', 'phone', 'country', 'city', 'address'].forEach(function (k) {
        if (!customer[k]) local[k] = t('required');
      });
      if (!customer.paymentMethod) local.paymentMethod = t('required');
      if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) local.email = t('invalid');
      if (Object.keys(local).length) return showErrors(form, local);

      submitting = true;
      var btn = form.querySelector('[data-submit]');
      btn.setAttribute('aria-disabled', 'true');
      btn.innerHTML = '<span class="spinner"></span>' + esc(t('placing'));

      var r;
      try {
        r = await YK.api('order', {
          method: 'POST',
          body: { customer: customer, items: items, locale: YK.LOCALE, idempotencyKey: idem },
        });
      } catch (err) {
        submitting = false;
        btn.removeAttribute('aria-disabled');
        btn.textContent = t('placeOrder');
        return showErrors(form, { _form: t('networkError') });
      }

      if (r.status === 422 && r.data && r.data.errors) {
        submitting = false;
        btn.removeAttribute('aria-disabled');
        btn.textContent = t('placeOrder');
        var mapped = {};
        Object.keys(r.data.errors).forEach(function (k) {
          mapped[k] = r.data.errors[k] === 'invalid' ? t('invalid') : t('required');
        });
        return showErrors(form, mapped);
      }

      if (!r.ok || !r.data || !r.data.orderNumber) {
        submitting = false;
        btn.removeAttribute('aria-disabled');
        btn.textContent = t('placeOrder');
        if (r.data && r.data.issues && r.data.issues.length) {
          checkoutRoot.insertAdjacentHTML('afterbegin', issuesHtml(r.data.issues));
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        return showErrors(form, { _form: t('orderFailed') });
      }

      // The order exists before anything else happens. Part 2 §30/§34.
      YK.cart.clear();
      YK.checkoutDraft.clear();
      sessionStorage.removeItem('yk_idem');
      location.href = YK.localeUrl('order') + '?n=' + encodeURIComponent(r.data.orderNumber)
        + '&t=' + encodeURIComponent(r.data.token);
    });
  }

  function showErrors(form, errors) {
    Object.keys(errors).forEach(function (k) {
      var el = form.querySelector('[data-error="' + k + '"]');
      if (el) el.textContent = errors[k];
      var input = form.querySelector('[name="' + k + '"]');
      if (input) input.setAttribute('aria-invalid', 'true');
    });
    var first = form.querySelector('[aria-invalid="true"]') || form.querySelector('[data-error]:not(:empty)');
    if (first) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (first.focus) first.focus(); }
  }

  /* =========================== CONFIRMATION ============================= */
  async function initConfirm() {
    var params = new URLSearchParams(location.search);
    var number = params.get('n');
    var token = params.get('t');
    if (!number || !token) return confirmMissing();

    var r = await YK.api('order/' + encodeURIComponent(number) + '?token=' + encodeURIComponent(token));
    if (!r.ok || !r.data.order) return confirmMissing();

    var o = r.data.order;
    var cfg = await YK.getConfig();
    var wa = cfg && cfg.settings.whatsapp;

    var msg = YK.LOCALE === 'ar'
      ? 'مرحبًا يا حكايتي ✨ أرسلت طلبي رقم ' + number + ' وأرغب بمتابعة التفاصيل.'
      : 'Hello Ya 7kayti ✨ I’ve placed order ' + number + ' and would like to continue with the details.';

    var payLabel = o.paymentMethod === 'cod' ? t('cod') : t('whish');

    confirmRoot.innerHTML =
      '<div class="center" style="margin-block-end:var(--s-7)">'
      + '<div class="state__ico" style="background:#e6f6ee;color:#1d6a4a">✓</div>'
      + '<h1>' + esc(YK.LOCALE === 'ar' ? 'تم استلام طلبك! ✨' : 'Your order is in! ✨') + '</h1>'
      + '<p class="lead">' + esc(YK.LOCALE === 'ar'
          ? 'سنراجع طلبك ونتواصل معك لتأكيد الدفع والتوصيل والخطوات التالية.'
          : 'We’ll review your order and contact you to confirm payment, delivery and the next steps.') + '</p>'
      + '<p class="price-rail" style="justify-content:center"><span class="price-rail__value">' + esc(number) + '</span></p>'
      + '</div>'

      + '<div class="panel"><h2>' + esc(t('review')) + '</h2><dl class="summary">'
      + o.items.map(function (i) {
          return '<div class="summary__row"><dt>' + esc(i.productName[YK.LOCALE])
            + (i.childName ? ' — ' + esc(i.childName) : '') + ' × ' + esc(i.quantity) + '</dt>'
            + '<dd>' + esc(money(i.lineTotal)) + '</dd></div>';
        }).join('')
      + '<div class="summary__row"><dt>' + esc(t('subtotal')) + '</dt><dd>' + esc(money(o.productsSubtotal)) + '</dd></div>'
      + '<div class="summary__row"><dt>' + esc(t('shipping')) + '</dt>'
      + '<dd>' + (o.shippingCost == null
          ? '<span class="pending">' + esc(t('shippingTBC')) + '</span>'
          : esc(money(o.shippingCost))) + '</dd></div>'
      + '<div class="summary__row"><dt>' + esc(t('payment')) + '</dt><dd>' + esc(payLabel) + '</dd></div>'
      + '</dl>'
      + '<p class="help" style="margin-block-start:var(--s-3)">' + esc(t('shippingNote')) + '</p>'
      + '<p class="help">' + esc(t('productionNote')) + '</p>'
      + (wa ? '<div class="step-actions"><a class="btn btn--lg btn--block" href="https://wa.me/'
          + esc(String(wa).replace(/\D/g, '')) + '?text=' + encodeURIComponent(msg) + '" rel="noopener">'
          + esc(YK.LOCALE === 'ar' ? 'متابعة عبر واتساب' : 'Continue on WhatsApp') + '</a></div>' : '')
      + '</div>';
  }

  function confirmMissing() {
    confirmRoot.innerHTML = '<div class="state"><h1>'
      + esc(YK.LOCALE === 'ar' ? 'تعذّر عرض الطلب' : 'Order not available') + '</h1>'
      + '<p>' + esc(YK.LOCALE === 'ar'
          ? 'الرابط غير صالح أو انتهت صلاحيته. تواصلوا معنا وسنساعدكم.'
          : 'This link is not valid. Please contact us and we’ll help.') + '</p>'
      + '<p style="margin-block-start:var(--s-5)"><a class="btn" href="' + YK.localeUrl('') + '">'
      + esc(YK.LOCALE === 'ar' ? 'العودة للرئيسية' : 'Back to home') + '</a></p></div>';
  }
}());
