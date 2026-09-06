/* Admin: products, the customization builder, content and settings.
   Part 3 §13-§27. Extends the core dashboard module. */
(function () {
  'use strict';
  var A = window.__ykAdmin;
  if (!A) return;
  var api = A.api, esc = A.esc, money = A.money, toast = A.toast, S = A.S, FIELD_TYPES = A.FIELD_TYPES;
  var app = document.getElementById('admin-app');

  var STATUS = [['active', S.active], ['draft', S.draft], ['archived', S.archived]];
  var PRICING = [['fixed', S.fixed], ['unit', S.unit], ['option_override', S.optionOverride]];

  var field = function (id, lbl, val, type, attrs) {
    return '<div class="field"><label class="label" for="' + id + '">' + esc(lbl) + '</label>'
      + '<input class="input" id="' + id + '" type="' + (type || 'text') + '" value="' + esc(val == null ? '' : val) + '" '
      + (attrs || '') + '></div>';
  };
  var area = function (id, lbl, val) {
    return '<div class="field"><label class="label" for="' + id + '">' + esc(lbl) + '</label>'
      + '<textarea class="textarea" id="' + id + '">' + esc(val || '') + '</textarea></div>';
  };
  var select = function (id, lbl, list, cur) {
    return '<div class="field"><label class="label" for="' + id + '">' + esc(lbl) + '</label>'
      + '<select class="select" id="' + id + '">'
      + list.map(function (x) {
          return '<option value="' + esc(x[0]) + '"' + (cur === x[0] ? ' selected' : '') + '>' + esc(x[1]) + '</option>';
        }).join('') + '</select></div>';
  };
  var val = function (id) { var e = document.getElementById(id); return e ? e.value.trim() : ''; };

  /* ------------------------------------------------------------ products -- */
  A.viewProducts = async function () {
    var r = await api('admin/products');
    var cats = r.data.categories || [];
    var catName = function (id) {
      var c = cats.find(function (x) { return x.id === id; });
      return c ? (c.t.ar.name || c.t.en.name) : '—';
    };

    app.innerHTML = A.shell('products', S.products, '',
      '<p style="margin-block-end:var(--s-4)"><a class="btn" href="#/products/new">+ ' + esc(S.addProduct) + '</a></p>'
      + '<div class="table-wrap"><table class="admin-table"><thead><tr>'
      + '<th>' + esc(S.nameAr) + '</th><th>' + esc(S.category) + '</th><th>' + esc(S.price) + '</th>'
      + '<th>' + esc(S.status) + '</th><th></th></tr></thead><tbody>'
      + (r.data.products || []).map(function (p) {
          var pr = p.pricing.type === 'option_override'
            ? (function () {
                var d = (p.fields || []).find(function (f) { return f.key === p.pricing.driverField; });
                var prices = ((d && d.options) || []).filter(function (o) { return o.priceOverride != null; })
                  .map(function (o) { return o.priceOverride; });
                return prices.length ? money(Math.min.apply(null, prices)) + '+' : '—';
              }())
            : money(p.pricing.basePrice);
          return '<tr>'
            + '<td data-label="' + esc(S.nameAr) + '"><a href="#/products/' + esc(p.id) + '">' + esc(p.t.ar.name) + '</a></td>'
            + '<td data-label="' + esc(S.category) + '">' + esc(catName(p.categoryId)) + '</td>'
            + '<td data-label="' + esc(S.price) + '" class="num">' + esc(pr) + '</td>'
            + '<td data-label="' + esc(S.status) + '"><span class="st st--' + (p.status === 'active' ? 'approved' : 'cancelled') + '">'
            + esc(({ active: S.active, draft: S.draft, archived: S.archived })[p.status] || p.status) + '</span></td>'
            + '<td><a class="btn btn--ghost btn--sm" href="#/products/' + esc(p.id) + '">' + esc(S.edit) + '</a></td>'
            + '</tr>';
        }).join('')
      + '</tbody></table></div>');
    A.bindShell();
  };

  /* ------------------------------------------------- product + builder --- */
  A.viewProduct = async function (id) {
    var r = await api('admin/products');
    var cats = r.data.categories || [];
    var isNew = id === 'new';
    var p = isNew ? blankProduct(cats) : (r.data.products || []).find(function (x) { return x.id === id; });
    if (!p) { location.hash = '#/products'; return; }

    // Local working copy; nothing is written until Save.
    var draft = JSON.parse(JSON.stringify(p));

    function render() {
      app.innerHTML = A.shell('products', isNew ? S.addProduct : draft.t.ar.name, '',
        '<p style="margin-block-end:var(--s-4)"><a class="btn btn--ghost btn--sm" href="#/products">← ' + esc(S.back) + '</a></p>'
        + '<div id="problems"></div>'

        + '<div class="apanel"><h2>' + esc(S.products) + '</h2><div class="grid2">'
        + field('p_name_ar', S.nameAr, draft.t.ar.name)
        + field('p_name_en', S.nameEn, draft.t.en.name)
        + field('p_slug', 'slug', draft.slug, 'text', 'dir="ltr"')
        + select('p_cat', S.category, cats.map(function (c) { return [c.id, c.t.ar.name || c.t.en.name]; }), draft.categoryId)
        + field('p_short_ar', S.shortAr, draft.t.ar.short)
        + field('p_short_en', S.shortEn, draft.t.en.short)
        + '</div>'
        + area('p_desc_ar', S.descAr, draft.t.ar.desc)
        + area('p_desc_en', S.descEn, draft.t.en.desc)
        + '<div class="grid2">'
        + select('p_status', S.status, STATUS, draft.status)
        + select('p_featured', S.featured, [['yes', S.yes], ['no', S.no]], draft.featured ? 'yes' : 'no')
        + '</div></div>'

        + '<div class="apanel"><h2>' + esc(S.price)
        + ' <span class="apanel__hint">' + esc(S.pricingType) + '</span></h2><div class="grid2">'
        + select('p_ptype', S.pricingType, PRICING, draft.pricing.type)
        + (draft.pricing.type === 'option_override'
            ? select('p_driver', S.driverField,
                (draft.fields || []).filter(function (f) { return f.options; })
                  .map(function (f) { return [f.key, f.t.ar.label || f.key]; }),
                draft.pricing.driverField)
            : field('p_base', S.basePrice, draft.pricing.basePrice, 'number', 'step="0.25" min="0" inputmode="decimal"'))
        + '</div></div>'

        + '<div class="apanel"><h2>' + esc(S.fields)
        + ' <span class="apanel__hint">' + esc(S.publishBlocked.replace('—', '')) + '</span></h2>'
        + (draft.fields || []).map(fieldEditor).join('')
        + '<button class="btn btn--ghost btn--sm" data-add-field>+ ' + esc(S.addField) + '</button>'
        + '</div>'

        + '<div class="step-actions">'
        + '<button class="btn btn--lg" data-save>' + esc(S.save) + '</button>'
        + (isNew ? '' : '<button class="btn btn--ghost btn--lg" data-archive>' + esc(S.archive) + '</button>')
        + '</div>');
      A.bindShell();
      bind();
    }

    function fieldEditor(f, i) {
      var hasOpts = ['select', 'radio', 'checkbox'].indexOf(f.type) >= 0;
      return '<div class="builder-field" data-fi="' + i + '">'
        + '<div class="builder-field__head"><strong>' + esc(f.t.ar.label || f.key) + '</strong>'
        + '<button class="link-btn link-btn--danger" data-rm-field="' + i + '">' + esc(S.remove) + '</button></div>'
        + '<div class="grid2">'
        + field('f_' + i + '_key', S.fieldKey, f.key, 'text', 'dir="ltr"')
        + select('f_' + i + '_type', S.fieldType, FIELD_TYPES, f.type)
        + field('f_' + i + '_lar', S.labelAr, f.t.ar.label)
        + field('f_' + i + '_len', S.labelEn, f.t.en.label)
        + field('f_' + i + '_har', 'شرح (عربي)', f.t.ar.help)
        + field('f_' + i + '_hen', 'شرح (إنجليزي)', f.t.en.help)
        + select('f_' + i + '_req', S.required, [['yes', S.yes], ['no', S.no]], f.required ? 'yes' : 'no')
        + select('f_' + i + '_act', S.status, [['yes', S.active], ['no', S.draft]], f.active ? 'yes' : 'no')
        + '</div>'
        + (hasOpts
            ? (f.options || []).map(function (o, j) {
                return '<div class="builder-opt">'
                  + '<input class="input" id="o_' + i + '_' + j + '_ar" value="' + esc(o.t.ar.label) + '" placeholder="' + esc(S.optLabelAr) + '">'
                  + '<input class="input" id="o_' + i + '_' + j + '_en" value="' + esc(o.t.en.label) + '" placeholder="' + esc(S.optLabelEn) + '" dir="ltr">'
                  + '<input class="input" id="o_' + i + '_' + j + '_pr" type="number" step="0.25" min="0" inputmode="decimal" value="'
                  + (o.priceOverride == null ? '' : esc(o.priceOverride)) + '" placeholder="' + esc(S.optPrice) + '" dir="ltr">'
                  + '<button class="link-btn link-btn--danger" data-rm-opt="' + i + ':' + j + '">' + esc(S.remove) + '</button>'
                  + '</div>';
              }).join('')
              + '<button class="btn btn--ghost btn--sm" data-add-opt="' + i + '">+ ' + esc(S.addOption) + '</button>'
            : '')
        + '</div>';
    }

    /** Read every input back into the draft before any structural change. */
    function collect() {
      draft.slug = val('p_slug');
      draft.categoryId = val('p_cat');
      draft.status = val('p_status');
      draft.featured = val('p_featured') === 'yes';
      draft.t.ar = { name: val('p_name_ar'), short: val('p_short_ar'), desc: val('p_desc_ar') };
      draft.t.en = { name: val('p_name_en'), short: val('p_short_en'), desc: val('p_desc_en') };
      draft.pricing.type = val('p_ptype');
      if (draft.pricing.type === 'option_override') {
        draft.pricing.driverField = val('p_driver');
        draft.pricing.basePrice = null;
      } else {
        draft.pricing.basePrice = Number(val('p_base')) || 0;
        delete draft.pricing.driverField;
      }
      (draft.fields || []).forEach(function (f, i) {
        f.key = val('f_' + i + '_key') || f.key;
        f.type = val('f_' + i + '_type');
        f.required = val('f_' + i + '_req') === 'yes';
        f.active = val('f_' + i + '_act') === 'yes';
        f.order = i + 1;
        f.t.ar = { label: val('f_' + i + '_lar'), help: val('f_' + i + '_har'), placeholder: f.t.ar.placeholder || '' };
        f.t.en = { label: val('f_' + i + '_len'), help: val('f_' + i + '_hen'), placeholder: f.t.en.placeholder || '' };
        if (['select', 'radio', 'checkbox'].indexOf(f.type) < 0) { delete f.options; return; }
        (f.options || []).forEach(function (o, j) {
          o.t.ar = { label: val('o_' + i + '_' + j + '_ar') };
          o.t.en = { label: val('o_' + i + '_' + j + '_en') };
          var pr = val('o_' + i + '_' + j + '_pr');
          o.priceOverride = pr === '' ? null : Number(pr);
          o.sortOrder = j + 1;
          if (o.active === undefined) o.active = true;
        });
      });
    }

    function bind() {
      var ptype = document.getElementById('p_ptype');
      if (ptype) ptype.addEventListener('change', function () { collect(); render(); });

      var addF = app.querySelector('[data-add-field]');
      if (addF) addF.addEventListener('click', function () {
        collect();
        draft.fields = draft.fields || [];
        draft.fields.push({
          key: 'field_' + (draft.fields.length + 1), type: 'short_text',
          required: false, active: true, order: draft.fields.length + 1,
          t: { ar: { label: '', help: '', placeholder: '' }, en: { label: '', help: '', placeholder: '' } },
        });
        render();
      });

      app.querySelectorAll('[data-rm-field]').forEach(function (b) {
        b.addEventListener('click', function () {
          collect();
          draft.fields.splice(Number(b.getAttribute('data-rm-field')), 1);
          render();
        });
      });

      app.querySelectorAll('[data-add-opt]').forEach(function (b) {
        b.addEventListener('click', function () {
          collect();
          var i = Number(b.getAttribute('data-add-opt'));
          var f = draft.fields[i];
          f.options = f.options || [];
          f.options.push({
            key: 'opt_' + (f.options.length + 1), sortOrder: f.options.length + 1, active: true,
            priceOverride: null, t: { ar: { label: '' }, en: { label: '' } },
          });
          render();
        });
      });

      app.querySelectorAll('[data-rm-opt]').forEach(function (b) {
        b.addEventListener('click', function () {
          collect();
          var parts = b.getAttribute('data-rm-opt').split(':');
          draft.fields[Number(parts[0])].options.splice(Number(parts[1]), 1);
          render();
        });
      });

      app.querySelector('[data-save]').addEventListener('click', async function () {
        collect();
        A.busy(true);
        var res = await api('admin/products', { method: 'POST', body: { product: draft } });
        A.busy(false);
        var box = document.getElementById('problems');
        if (res.ok) { toast(S.saved, 'ok'); location.hash = '#/products'; return; }
        // Publishing is refused with the specific problems, never a vague message. §19
        box.innerHTML = '<div class="alert alert--error" role="alert"><span><strong>' + esc(S.publishBlocked) + '</strong><br>'
          + ((res.data && res.data.problems) || [S.saveFailed]).map(esc).join('<br>') + '</span></div>';
        box.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });

      var arch = app.querySelector('[data-archive]');
      if (arch) arch.addEventListener('click', async function () {
        if (!confirm(S.archiveConfirm)) return;
        await api('admin/products/' + encodeURIComponent(draft.id), { method: 'DELETE' });
        toast(S.saved, 'ok');
        location.hash = '#/products';
      });
    }

    render();
  };

  function blankProduct(cats) {
    return {
      slug: '', categoryId: cats[0] ? cats[0].id : '', status: 'draft', featured: false,
      asset: 'stories',
      pricing: { type: 'unit', basePrice: 0 },
      quantity: { min: 1, max: 50, step: 1, t: { ar: 'قطعة', en: 'item' } },
      t: { ar: { name: '', short: '', desc: '' }, en: { name: '', short: '', desc: '' } },
      fields: [],
    };
  }

  /* ------------------------------------------------------------- content -- */
  A.viewContent = async function () {
    var faqs = (await api('admin/content/faqs')).data.items || [];
    var reviews = (await api('admin/content/reviews')).data.items || [];

    app.innerHTML = A.shell('content', S.content, '',
      '<div class="apanel"><h2>' + esc(S.faqs) + '</h2><div id="faq-list">'
      + faqs.map(faqRow).join('')
      + '</div><button class="btn btn--ghost btn--sm" data-add-faq>+ ' + esc(S.addItem) + '</button>'
      + '<div class="step-actions"><button class="btn" data-save-faq>' + esc(S.save) + '</button></div></div>'

      + '<div class="apanel"><h2>' + esc(S.reviews)
      + ' <span class="apanel__hint">' + esc(S.noReviews) + '</span></h2><div id="rev-list">'
      + reviews.map(revRow).join('')
      + '</div><button class="btn btn--ghost btn--sm" data-add-rev>+ ' + esc(S.addItem) + '</button>'
      + '<div class="step-actions"><button class="btn" data-save-rev>' + esc(S.save) + '</button></div></div>');
    A.bindShell();

    function refreshFaq(items) { document.getElementById('faq-list').innerHTML = items.map(faqRow).join(''); bindRm(); }
    function refreshRev(items) { document.getElementById('rev-list').innerHTML = items.map(revRow).join(''); bindRm(); }
    function bindRm() {
      app.querySelectorAll('[data-rm-row]').forEach(function (b) {
        b.addEventListener('click', function () { b.closest('.builder-field').remove(); });
      });
    }
    bindRm();

    app.querySelector('[data-add-faq]').addEventListener('click', function () {
      document.getElementById('faq-list').insertAdjacentHTML('beforeend',
        faqRow({ id: 'f' + Date.now(), published: true, ar: { q: '', a: '' }, en: { q: '', a: '' } },
               document.querySelectorAll('#faq-list .builder-field').length));
      bindRm();
    });
    app.querySelector('[data-add-rev]').addEventListener('click', function () {
      document.getElementById('rev-list').insertAdjacentHTML('beforeend',
        revRow({ id: 'r' + Date.now(), published: true, ar: { text: '', author: '' }, en: { text: '', author: '' } },
               document.querySelectorAll('#rev-list .builder-field').length));
      bindRm();
    });

    app.querySelector('[data-save-faq]').addEventListener('click', async function () {
      var items = Array.prototype.map.call(document.querySelectorAll('#faq-list .builder-field'), function (el, i) {
        var g = function (n) { var x = el.querySelector('[data-k="' + n + '"]'); return x ? x.value.trim() : ''; };
        return { id: el.getAttribute('data-id') || 'f' + i, published: true, sortOrder: i + 1,
                 ar: { q: g('qar'), a: g('aar') }, en: { q: g('qen'), a: g('aen') } };
      }).filter(function (x) { return x.ar.q || x.en.q; });
      var r = await api('admin/content/faqs', { method: 'POST', body: { items: items } });
      toast(r.ok ? S.saved : S.saveFailed, r.ok ? 'ok' : 'error');
    });

    app.querySelector('[data-save-rev]').addEventListener('click', async function () {
      var items = Array.prototype.map.call(document.querySelectorAll('#rev-list .builder-field'), function (el, i) {
        var g = function (n) { var x = el.querySelector('[data-k="' + n + '"]'); return x ? x.value.trim() : ''; };
        return { id: el.getAttribute('data-id') || 'r' + i, published: true, sortOrder: i + 1,
                 ar: { text: g('tar'), author: g('nar') }, en: { text: g('ten'), author: g('nen') } };
      }).filter(function (x) { return x.ar.text || x.en.text; });
      var r = await api('admin/content/reviews', { method: 'POST', body: { items: items } });
      toast(r.ok ? S.saved : S.saveFailed, r.ok ? 'ok' : 'error');
    });
  };

  function faqRow(f, i) {
    return '<div class="builder-field" data-id="' + esc(f.id) + '">'
      + '<div class="builder-field__head"><strong>' + esc(S.question) + ' ' + ((i || 0) + 1) + '</strong>'
      + '<button class="link-btn link-btn--danger" data-rm-row>' + esc(S.remove) + '</button></div>'
      + '<div class="grid2">'
      + '<div class="field"><label class="label">عربي</label><input class="input" data-k="qar" value="' + esc(f.ar.q) + '"></div>'
      + '<div class="field"><label class="label">English</label><input class="input" data-k="qen" value="' + esc(f.en.q) + '" dir="ltr"></div>'
      + '</div><div class="grid2">'
      + '<div class="field"><textarea class="textarea" data-k="aar" placeholder="' + esc(S.answer) + '">' + esc(f.ar.a) + '</textarea></div>'
      + '<div class="field"><textarea class="textarea" data-k="aen" placeholder="' + esc(S.answer) + '" dir="ltr">' + esc(f.en.a) + '</textarea></div>'
      + '</div></div>';
  }

  function revRow(r, i) {
    return '<div class="builder-field" data-id="' + esc(r.id) + '">'
      + '<div class="builder-field__head"><strong>' + esc(S.reviews) + ' ' + ((i || 0) + 1) + '</strong>'
      + '<button class="link-btn link-btn--danger" data-rm-row>' + esc(S.remove) + '</button></div>'
      + '<div class="grid2">'
      + '<div class="field"><label class="label">' + esc(S.reviewAuthor) + ' (عربي)</label><input class="input" data-k="nar" value="' + esc(r.ar.author || '') + '"></div>'
      + '<div class="field"><label class="label">' + esc(S.reviewAuthor) + ' (English)</label><input class="input" data-k="nen" value="' + esc(r.en.author || '') + '" dir="ltr"></div>'
      + '</div><div class="grid2">'
      + '<div class="field"><textarea class="textarea" data-k="tar" placeholder="' + esc(S.reviewText) + '">' + esc(r.ar.text || '') + '</textarea></div>'
      + '<div class="field"><textarea class="textarea" data-k="ten" placeholder="' + esc(S.reviewText) + '" dir="ltr">' + esc(r.en.text || '') + '</textarea></div>'
      + '</div></div>';
  }

  /* ------------------------------------------------------------ settings -- */
  A.viewSettings = async function () {
    var s = (await api('admin/settings')).data.settings;
    app.innerHTML = A.shell('settings', S.settings, '',
      '<div class="apanel"><h2>' + esc(S.settings) + '</h2><div class="grid2">'
      + field('s_name', S.businessName, s.businessName)
      + field('s_wa', S.whatsapp, s.whatsapp, 'text', 'dir="ltr" inputmode="tel"')
      + field('s_whish', S.whish, s.whish, 'text', 'dir="ltr" inputmode="tel"')
      + field('s_ig', S.instagram, s.instagram, 'url', 'dir="ltr"')
      + field('s_email', S.bizEmail, s.email, 'email', 'dir="ltr"')
      + '</div></div>'

      + '<div class="apanel"><h2>' + esc(S.production) + '</h2><div class="grid2">'
      + field('s_pmin', S.prodMin, s.productionMinDays, 'number', 'min="0" max="60"')
      + field('s_pmax', S.prodMax, s.productionMaxDays, 'number', 'min="0" max="90"')
      + '</div></div>'

      + '<div class="apanel"><h2>' + esc(S.childPhoto) + '</h2><div class="grid2">'
      + field('s_ret', S.retention, s.photoRetentionHours, 'number', 'min="1" max="720"')
      + field('s_ab', S.abandoned, s.abandonedUploadHours, 'number', 'min="1" max="720"')
      + field('s_max', S.maxUpload, s.maxUploadMb, 'number', 'min="1" max="40"')
      + '</div>'
      + '<button class="btn btn--ghost btn--sm" data-cleanup>' + esc(S.runCleanup) + '</button></div>'

      + '<div class="step-actions"><button class="btn btn--lg" data-save-settings>' + esc(S.save) + '</button></div>');
    A.bindShell();

    app.querySelector('[data-save-settings]').addEventListener('click', async function () {
      A.busy(true);
      var r = await api('admin/settings', { method: 'POST', body: { settings: {
        businessName: val('s_name'), whatsapp: val('s_wa'), whish: val('s_whish'),
        instagram: val('s_ig'), email: val('s_email'),
        productionMinDays: val('s_pmin'), productionMaxDays: val('s_pmax'),
        photoRetentionHours: val('s_ret'), abandonedUploadHours: val('s_ab'),
        maxUploadMb: val('s_max'),
      } } });
      A.busy(false);
      toast(r.ok ? S.saved : S.saveFailed, r.ok ? 'ok' : 'error');
    });

    app.querySelector('[data-cleanup]').addEventListener('click', async function () {
      A.busy(true);
      var r = await api('admin/cleanup', { method: 'POST' });
      A.busy(false);
      toast(r.ok ? S.cleanupDone : S.saveFailed, r.ok ? 'ok' : 'error');
    });
  };
}());
