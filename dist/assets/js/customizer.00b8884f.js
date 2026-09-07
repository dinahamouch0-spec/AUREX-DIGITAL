/* Product customizer.
   Every step and field is generated from the product's configuration, so a
   product with a different field set renders correctly with no code change.
   Part 2 §7, §9, §15, §16. */
(function () {
  'use strict';
  var root = document.getElementById('customizer');
  if (!root || !window.YK) return;

  var YK = window.YK, t = YK.t, esc = YK.esc, money = YK.money;
  var slug = root.getAttribute('data-product');

  var state = {
    product: null,
    answers: {},
    quantity: 1,
    upload: null,          // { token, previewUrl, name }
    step: 0,
    steps: [],
    editingLineId: null,
    errors: {},
    price: { unit: null, total: null },
    busy: false,
  };

  /* ------------------------------------------------------------- setup -- */
  init();

  async function init() {
    root.innerHTML = '<div class="state" role="status"><div class="skeleton" style="block-size:120px"></div></div>';
    var cfg = await YK.getConfig();
    if (!cfg) return fail();

    state.product = cfg.products.find(function (p) { return p.slug === slug; });
    if (!state.product) return fail();
    state.maxUploadMb = cfg.settings.maxUploadMb || 12;
    state.quantity = state.product.quantity ? state.product.quantity.min : 1;

    // Reopening a cart line for editing keeps its answers, photo and quantity.
    var editing = new URLSearchParams(location.search).get('edit');
    if (editing) {
      var line = YK.cart.get(editing);
      if (line && line.productSlug === slug) {
        state.editingLineId = editing;
        state.answers = Object.assign({}, line.answers);
        state.quantity = line.quantity;
        if (line.uploadToken) state.upload = { token: line.uploadToken, previewUrl: null, name: t('photoUploaded') };
      }
    }

    state.steps = buildSteps(state.product);
    recalc();
    render();
  }

  function fail() {
    root.innerHTML = '<div class="state state--error" role="alert"><h3>' + esc(t('orderFailed')) + '</h3>'
      + '<p><button class="btn btn--ghost" onclick="location.reload()">' + esc(t('next')) + '</button></p></div>';
  }

  /**
   * Group the product's fields into steps. The photo always gets its own step
   * (it is the slowest action), and the rest are grouped so no screen becomes a
   * wall of inputs. A product with two fields gets two steps, not five. §9
   */
  function buildSteps(product) {
    var fields = (product.fields || []).filter(function (f) { return f.active; })
      .sort(function (a, b) { return a.order - b.order; });

    var photo = fields.filter(function (f) { return f.type === 'image_upload'; });
    var rest = fields.filter(function (f) { return f.type !== 'image_upload'; });

    var steps = [];
    // Priced choices come first so the price appears as early as possible.
    var priced = rest.filter(function (f) { return f.options && f.pricing; });
    var plain = rest.filter(function (f) { return !(f.options && f.pricing); });

    if (priced.length) steps.push({ key: 'options', label: t('stepDetails'), fields: priced });
    if (plain.length) {
      // Split long field lists so a mobile step stays a single clear task.
      for (var i = 0; i < plain.length; i += 3) {
        steps.push({ key: 'details' + i, label: t('stepDetails'), fields: plain.slice(i, i + 3) });
      }
    }
    if (photo.length) steps.push({ key: 'photo', label: t('stepPhoto'), fields: photo });
    steps.push({ key: 'review', label: t('stepReview'), fields: [] });
    return steps;
  }

  /* ------------------------------------------------------------ pricing -- */
  function recalc() {
    var p = state.product;
    var unit = null, overridden = false, modifiers = 0;
    var base = p.pricing.basePrice != null ? p.pricing.basePrice : null;

    (p.fields || []).forEach(function (f) {
      if (!f.active || !f.options) return;
      var v = state.answers[f.key];
      if (v == null || v === '') return;
      (Array.isArray(v) ? v : [v]).forEach(function (key) {
        var o = f.options.find(function (x) { return x.key === key && x.active; });
        if (!o) return;
        if (o.priceOverride != null) { base = o.priceOverride; overridden = true; }
        if (o.priceModifier != null) modifiers += o.priceModifier;
      });
    });

    if (p.pricing.type === 'option_override' && !overridden) unit = null;
    else if (base == null) unit = null;
    else unit = Math.round((base + modifiers) * 100) / 100;

    state.price.unit = unit;
    state.price.total = unit == null ? null : Math.round(unit * state.quantity * 100) / 100;
  }

  /** The server is asked to confirm before anything enters the cart. §6 */
  async function confirmPrice() {
    var r = await YK.api('price', {
      method: 'POST',
      body: { productSlug: slug, answers: state.answers, quantity: state.quantity },
    });
    if (r.ok && r.data) {
      state.price.unit = r.data.unitPrice;
      state.price.total = r.data.lineTotal;
      if (r.data.quantity !== state.quantity) state.quantity = r.data.quantity;
    }
  }

  /* ------------------------------------------------------------- render -- */
  function render() {
    var step = state.steps[state.step];
    var isReview = step.key === 'review';
    var html = stepBar() + '<div class="customizer-body">';

    html += isReview ? reviewStep() : step.fields.map(fieldHtml).join('');

    // Quantity lives on the last input step, next to the running total.
    if (!isReview && state.step === state.steps.length - 2) html += quantityHtml();

    html += '</div>' + priceRail() + actions();
    root.innerHTML = html;
    bind();

    // Focus management between steps. Part 2 §55.
    var first = root.querySelector('input, textarea, select, button');
    if (first && state.step > 0) {
      var heading = root.querySelector('.label');
      if (heading) heading.setAttribute('tabindex', '-1'), heading.focus();
    }
  }

  function stepBar() {
    if (state.steps.length < 2) return '';
    return '<ol class="steps-bar" aria-label="' + esc(t('review')) + '">'
      + state.steps.map(function (s, i) {
          var cls = i === state.step ? ' is-active' : (i < state.step ? ' is-done' : '');
          return '<li class="steps-bar__item' + cls + '">'
            + '<span class="steps-bar__n" aria-hidden="true">' + (i < state.step ? '✓' : (i + 1)) + '</span>'
            + esc(s.label) + '</li>';
        }).join('')
      + '</ol>';
  }

  function fieldHtml(f) {
    var v = state.answers[f.key];
    var err = state.errors[f.key];
    var id = 'f_' + f.key;
    var label = f.t[YK.LOCALE].label;
    var help = f.t[YK.LOCALE].help;
    var ph = f.t[YK.LOCALE].placeholder || '';
    var reqTag = f.required
      ? '<span class="req">' + esc(YK.LOCALE === 'ar' ? 'مطلوب' : 'Required') + '</span>'
      : '<span class="req req--opt">' + esc(YK.LOCALE === 'ar' ? 'اختياري' : 'Optional') + '</span>';

    var out = '<div class="field" data-field="' + esc(f.key) + '">'
      + '<label class="label" for="' + id + '">' + esc(label) + reqTag + '</label>'
      + (help ? '<span class="help" id="' + id + '_h">' + esc(help) + '</span>' : '');

    var describedBy = help ? ' aria-describedby="' + id + '_h"' : '';
    var invalid = err ? ' aria-invalid="true"' : '';

    if (f.type === 'image_upload') out += uploadHtml(f, id);
    else if (f.type === 'long_text') {
      out += '<textarea class="textarea" id="' + id + '" name="' + esc(f.key) + '" placeholder="' + esc(ph) + '"'
        + describedBy + invalid + '>' + esc(v || '') + '</textarea>';
    } else if (f.type === 'number') {
      out += '<input class="input" type="number" inputmode="numeric" id="' + id + '" name="' + esc(f.key) + '"'
        + ' value="' + esc(v == null ? '' : v) + '" placeholder="' + esc(ph) + '"' + describedBy + invalid + '>';
    } else if (f.type === 'select') {
      out += '<select class="select" id="' + id + '" name="' + esc(f.key) + '"' + describedBy + invalid + '>'
        + '<option value="">' + esc(ph || '—') + '</option>'
        + activeOptions(f).map(function (o) {
            return '<option value="' + esc(o.key) + '"' + (v === o.key ? ' selected' : '') + '>'
              + esc(o.t[YK.LOCALE].label) + '</option>';
          }).join('')
        + '</select>';
    } else if (f.type === 'radio' || f.type === 'checkbox') {
      var multi = f.type === 'checkbox';
      out += '<div class="choices" role="' + (multi ? 'group' : 'radiogroup') + '" aria-labelledby="' + id + '">'
        + activeOptions(f).map(function (o, i) {
            var checked = multi
              ? Array.isArray(v) && v.indexOf(o.key) >= 0
              : v === o.key;
            var price = o.priceOverride != null ? money(o.priceOverride)
                      : (o.priceModifier ? '+' + money(o.priceModifier) : '');
            return '<label class="choice">'
              + '<input type="' + (multi ? 'checkbox' : 'radio') + '" name="' + esc(f.key) + '"'
              + ' value="' + esc(o.key) + '" id="' + id + '_' + i + '"' + (checked ? ' checked' : '') + '>'
              + '<span class="choice__dot" aria-hidden="true"></span>'
              + '<span class="choice__body"><span class="choice__title">' + esc(o.t[YK.LOCALE].label) + '</span></span>'
              + (price ? '<span class="choice__price">' + esc(price) + '</span>' : '')
              + '</label>';
          }).join('')
        + '</div>';
    } else {
      out += '<input class="input" type="text" id="' + id + '" name="' + esc(f.key) + '"'
        + ' value="' + esc(v || '') + '" placeholder="' + esc(ph) + '"' + describedBy + invalid + '>';
    }

    out += '<p class="field-error" role="alert" data-error="' + esc(f.key) + '">' + esc(err || '') + '</p></div>';
    return out;
  }

  var activeOptions = function (f) {
    return (f.options || []).filter(function (o) { return o.active; })
      .sort(function (a, b) { return (a.sortOrder || 0) - (b.sortOrder || 0); });
  };

  function uploadHtml(f, id) {
    if (state.upload) {
      var thumb = state.upload.previewUrl
        ? '<img src="' + esc(state.upload.previewUrl) + '" alt="">'
        : '<div class="upload-done__ico" style="inline-size:72px;block-size:72px;display:grid;place-items:center;background:#e6f6ee;border-radius:12px">✓</div>';
      return '<div class="upload-done">' + thumb
        + '<div class="upload-done__txt"><strong>' + esc(t('uploaded')) + '</strong>'
        + '<span>' + esc(state.upload.name || '') + '</span></div>'
        + '<div class="upload-done__acts">'
        + '<button type="button" class="link-btn" data-upload-replace>' + esc(t('replace')) + '</button>'
        + '<button type="button" class="link-btn link-btn--danger" data-upload-remove>' + esc(t('remove')) + '</button>'
        + '</div></div>'
        + '<div class="privacy-note" style="margin-block-start:var(--s-4)">'
        + '<span>' + esc(t('privacy')) + '</span></div>';
    }
    return '<label class="upload" data-upload>'
      + '<input type="file" id="' + id + '" accept="image/jpeg,image/png,image/webp,image/heic" '
      + 'aria-describedby="' + id + '_h">'
      + '<span class="upload__ico" aria-hidden="true">'
      + '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
      + '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>'
      + '<circle cx="12" cy="13" r="4"/></svg></span>'
      + '<span class="upload__title">' + esc(t('uploadTitle')) + '</span>'
      + '<span class="upload__hint">' + esc(t('uploadHint', { mb: state.maxUploadMb })) + '</span>'
      + '<span class="progress" hidden><span class="progress__bar"></span></span>'
      + '</label>'
      + '<div class="privacy-note" style="margin-block-start:var(--s-4)">'
      + '<span>' + esc(t('privacy')) + '</span></div>';
  }

  function quantityHtml() {
    var q = state.product.quantity || { min: 1, max: 99, step: 1 };
    var unit = q.t ? q.t[YK.LOCALE] : '';
    return '<div class="field"><span class="label">' + esc(t('quantity')) + '</span>'
      + '<div class="qty">'
      + '<button type="button" class="qty__btn" data-qty="-1" aria-label="-"' + (state.quantity <= q.min ? ' disabled' : '') + '>−</button>'
      + '<input type="number" inputmode="numeric" value="' + state.quantity + '" min="' + q.min + '" max="' + q.max + '" step="' + (q.step || 1) + '" data-qty-input aria-label="' + esc(t('quantity')) + '">'
      + '<button type="button" class="qty__btn" data-qty="1" aria-label="+"' + (state.quantity >= q.max ? ' disabled' : '') + '>+</button>'
      + (unit ? '<span class="qty__unit">' + esc(unit) + '</span>' : '')
      + '</div></div>';
  }

  function reviewStep() {
    var p = state.product;
    var rows = (p.fields || []).filter(function (f) { return f.active; })
      .sort(function (a, b) { return a.order - b.order; })
      .map(function (f) {
        var v = state.answers[f.key];
        var shown;
        if (f.type === 'image_upload') shown = state.upload ? t('photoUploaded') : '—';
        else if (f.options) {
          var keys = Array.isArray(v) ? v : (v ? [v] : []);
          shown = keys.map(function (k) {
            var o = (f.options || []).find(function (x) { return x.key === k; });
            return o ? o.t[YK.LOCALE].label : k;
          }).join(', ') || '—';
        } else shown = (v == null || v === '') ? '—' : String(v);
        return '<div class="summary__row"><dt>' + esc(f.t[YK.LOCALE].label) + '</dt>'
          + '<dd>' + esc(shown) + '</dd></div>';
      }).join('');

    var q = state.product.quantity || {};
    return '<h3 style="font-size:1.1rem">' + esc(t('review')) + '</h3>'
      + '<dl class="summary">' + rows
      + '<div class="summary__row"><dt>' + esc(t('quantity')) + '</dt><dd>' + state.quantity
      + (q.t ? ' ' + esc(q.t[YK.LOCALE]) : '') + '</dd></div>'
      + '</dl>'
      + '<div class="note-inline" style="margin-block-start:var(--s-5)"><span>' + esc(t('productionNote')) + '</span></div>';
  }

  function priceRail() {
    return '<div class="price-rail"><span class="price-rail__label">' + esc(t('total')) + '</span>'
      + '<span class="price-rail__value">'
      + (state.price.total == null ? esc(t('choosePrice')) : esc(money(state.price.total)))
      + '</span></div>';
  }

  function actions() {
    var last = state.step === state.steps.length - 1;
    var label = last ? (state.editingLineId ? t('saveChanges') : t('addToCart')) : t('next');
    return '<div class="step-actions customizer-sticky">'
      + (state.step > 0 ? '<button type="button" class="btn btn--ghost" data-back>' + esc(t('back')) + '</button>' : '')
      + '<button type="button" class="btn" data-next' + (state.busy ? ' aria-disabled="true"' : '') + '>'
      + (state.busy ? '<span class="spinner"></span>' : '') + esc(label) + '</button>'
      + '</div>';
  }

  /* -------------------------------------------------------------- bind -- */
  function bind() {
    root.querySelectorAll('input, textarea, select').forEach(function (el) {
      if (el.type === 'file') return;
      var handler = function () {
        var name = el.name;
        if (!name) return;
        if (el.type === 'checkbox') {
          var picked = Array.prototype.slice.call(
            root.querySelectorAll('input[type=checkbox][name="' + name + '"]:checked')
          ).map(function (x) { return x.value; });
          state.answers[name] = picked;
        } else if (el.type === 'radio') {
          if (!el.checked) return;
          state.answers[name] = el.value;
        } else {
          state.answers[name] = el.value;
        }
        delete state.errors[name];
        var errEl = root.querySelector('[data-error="' + name + '"]');
        if (errEl) errEl.textContent = '';
        el.removeAttribute('aria-invalid');
        recalc();
        var rail = root.querySelector('.price-rail__value');
        if (rail) rail.textContent = state.price.total == null ? t('choosePrice') : money(state.price.total);
      };
      el.addEventListener('change', handler);
      if (['text', 'textarea', 'number'].indexOf(el.type) >= 0 || el.tagName === 'TEXTAREA') {
        el.addEventListener('input', handler);
      }
    });

    var qtyInput = root.querySelector('[data-qty-input]');
    root.querySelectorAll('[data-qty]').forEach(function (b) {
      b.addEventListener('click', function () {
        var q = state.product.quantity || { min: 1, max: 99, step: 1 };
        var d = Number(b.getAttribute('data-qty')) * (q.step || 1);
        state.quantity = Math.min(q.max, Math.max(q.min, state.quantity + d));
        recalc(); render();
      });
    });
    if (qtyInput) {
      qtyInput.addEventListener('change', function () {
        var q = state.product.quantity || { min: 1, max: 99, step: 1 };
        var n = Math.round(Number(qtyInput.value) || q.min);
        state.quantity = Math.min(q.max, Math.max(q.min, n));
        recalc(); render();
      });
    }

    var fileInput = root.querySelector('.upload input[type=file]');
    if (fileInput) fileInput.addEventListener('change', function () { doUpload(fileInput.files[0]); });

    var dropZone = root.querySelector('[data-upload]');
    if (dropZone) {
      ['dragenter', 'dragover'].forEach(function (e) {
        dropZone.addEventListener(e, function (ev) { ev.preventDefault(); dropZone.classList.add('is-drag'); });
      });
      ['dragleave', 'drop'].forEach(function (e) {
        dropZone.addEventListener(e, function (ev) { ev.preventDefault(); dropZone.classList.remove('is-drag'); });
      });
      dropZone.addEventListener('drop', function (ev) {
        if (ev.dataTransfer && ev.dataTransfer.files[0]) doUpload(ev.dataTransfer.files[0]);
      });
    }

    var replace = root.querySelector('[data-upload-replace]');
    if (replace) replace.addEventListener('click', function () { state.upload = null; render(); });

    var removeBtn = root.querySelector('[data-upload-remove]');
    if (removeBtn) removeBtn.addEventListener('click', async function () {
      var tok = state.upload && state.upload.token;
      state.upload = null; render();
      if (tok) YK.api('upload/' + tok, { method: 'DELETE' });
    });

    var back = root.querySelector('[data-back]');
    if (back) back.addEventListener('click', function () { state.step--; render(); window.scrollTo({ top: root.offsetTop - 90, behavior: 'smooth' }); });

    var next = root.querySelector('[data-next]');
    if (next) next.addEventListener('click', onNext);
  }

  /* ------------------------------------------------------------ upload -- */
  async function doUpload(file) {
    if (!file) return;
    var zone = root.querySelector('[data-upload]');
    var bar = root.querySelector('.progress');
    var fill = root.querySelector('.progress__bar');
    if (bar) { bar.hidden = false; fill.style.inlineSize = '15%'; }

    var maxBytes = state.maxUploadMb * 1024 * 1024;
    if (file.size > maxBytes) return uploadError(t('uploadFailedSize', { mb: state.maxUploadMb }));

    var form = new FormData();
    form.append('photo', file);
    if (fill) fill.style.inlineSize = '55%';

    var r;
    try { r = await YK.api('upload', { method: 'POST', form: form }); }
    catch (e) { return uploadError(t('uploadFailed')); }

    if (!r.ok) {
      if (r.status === 415) return uploadError(t('uploadFailedType'));
      if (r.status === 413) return uploadError(t('uploadFailedSize', { mb: state.maxUploadMb }));
      return uploadError(t('uploadFailed'));
    }

    if (fill) fill.style.inlineSize = '100%';
    state.upload = {
      token: r.data.token,
      previewUrl: URL.createObjectURL(file),   // local preview only, never uploaded back
      name: file.name,
    };
    var photoField = (state.product.fields || []).find(function (f) { return f.type === 'image_upload'; });
    if (photoField) delete state.errors[photoField.key];
    render();
  }

  function uploadError(message) {
    var f = (state.product.fields || []).find(function (x) { return x.type === 'image_upload'; });
    if (f) state.errors[f.key] = message;
    render();
  }

  /* -------------------------------------------------------- validation -- */
  function validateStep() {
    var step = state.steps[state.step];
    var ok = true;
    state.errors = {};
    step.fields.forEach(function (f) {
      if (!f.required) return;
      if (f.type === 'image_upload') {
        if (!state.upload) { state.errors[f.key] = t('photoRequired'); ok = false; }
        return;
      }
      var v = state.answers[f.key];
      if (v == null || v === '' || (Array.isArray(v) && !v.length)) {
        state.errors[f.key] = t('required'); ok = false;
      }
    });
    return ok;
  }

  async function onNext() {
    if (state.busy) return;
    if (!validateStep()) {
      render();
      var firstErr = root.querySelector('[data-error]:not(:empty)');
      if (firstErr) {
        var field = firstErr.closest('.field');
        var input = field && field.querySelector('input, textarea, select');
        (input || firstErr).scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (input) input.focus();
      }
      return;
    }

    if (state.step < state.steps.length - 1) {
      state.busy = true; render();
      await confirmPrice();          // server truth before the review screen
      state.busy = false;
      state.step++;
      render();
      window.scrollTo({ top: root.offsetTop - 90, behavior: 'smooth' });
      return;
    }

    // Final step: confirm price once more, then commit the line.
    state.busy = true; render();
    await confirmPrice();
    state.busy = false;

    var line = {
      lineId: state.editingLineId || YK.uid(),
      productSlug: state.product.slug,
      productId: state.product.id,
      productName: state.product.t[YK.LOCALE].name,
      productAsset: state.product.asset,
      answers: state.answers,
      quantity: state.quantity,
      uploadToken: state.upload ? state.upload.token : null,
      displayPrice: state.price.total,
      childName: state.answers.child_name || null,
    };

    if (state.editingLineId) YK.cart.update(state.editingLineId, line);
    else YK.cart.add(line);

    done();
  }

  function done() {
    root.innerHTML = '<div class="alert alert--success" style="margin:0">'
      + '<span><strong>' + esc(t('addedToCart')) + '</strong>'
      + '<span class="alert__actions">'
      + '<a class="btn" href="' + YK.localeUrl('cart') + '">' + esc(t('goToCart')) + '</a>'
      + '<a class="btn btn--ghost" href="' + YK.localeUrl('shop') + '">' + esc(t('keepShopping')) + '</a>'
      + '</span></span></div>';
    root.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}());
