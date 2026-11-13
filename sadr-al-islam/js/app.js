(function () {
  'use strict';

  var TOTAL = 8;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var AR = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  var toAr = function (n) { return String(n).replace(/\d/g, function (d) { return AR[d]; }); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var pages = $$('.page');
  var current = 0;
  var baseTitle = 'عصر صدر الإسلام';

  /* ---------------------------------------------------------------
     التنقل بين الأقسام
  --------------------------------------------------------------- */
  function parseHash() {
    var m = /^#s([1-8])$/.exec(location.hash || '');
    return m ? +m[1] : 1;
  }

  function go(n, opts) {
    opts = opts || {};
    n = Math.max(1, Math.min(TOTAL, n | 0));
    if (n === current && !opts.force) return;
    var prev = current;
    var dir = n > prev ? 'fwd' : 'back';
    current = n;

    pages.forEach(function (p) {
      var idx = +p.dataset.index;
      if (idx === n) {
        p.hidden = false;
        p.classList.remove('leave', 'enter-fwd', 'enter-back', 'shown');
        if (!reduceMotion && prev) {
          void p.offsetWidth; // إعادة تشغيل الحركة
          p.classList.add('enter-' + dir);
        }
        playReveals(p);
      } else if (!p.hidden) {
        p.hidden = true;
        $$('.reveal', p).forEach(function (r) { r.classList.remove('in'); r.style.transitionDelay = ''; });
      }
    });

    window.scrollTo(0, 0);

    // حالة القائمة
    $$('#pagerList button').forEach(function (b) {
      var on = +b.dataset.go === n;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    // التقدم
    $('#progressFill').style.transform = 'scaleX(' + (n / TOTAL) + ')';
    var pr = $('#progress');
    pr.setAttribute('aria-valuenow', n);
    pr.setAttribute('aria-valuetext', 'القسم ' + n + ' من ' + TOTAL);
    $('#curN').textContent = toAr(n);
    $('#stepCount').lastChild.textContent = ' / ' + toAr(TOTAL);
    $('#prevBtn').disabled = n === 1;
    $('#nextBtn').disabled = n === TOTAL;
    document.body.dataset.page = n;

    var sec = window.SECTIONS[n - 1];
    document.title = n === 1 ? baseTitle + ' — من التحوّل الجاهلي إلى بناء حضارة جديدة' : sec.title + ' · ' + baseTitle;

    if (!opts.fromHash) {
      var h = '#s' + n;
      if (location.hash !== h) {
        try { if (opts.replace) history.replaceState(null, '', h); else history.pushState(null, '', h); }
        catch (err) { try { location.hash = h; } catch (e2) {} }
      }
    }
    if (opts.focus) {
      var heading = $('h1, h2', pages[n - 1]);
      if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    }
    renderNotes();
    broadcast();
  }

  function playReveals(page) {
    var items = $$('.reveal', page);
    items.forEach(function (el, i) {
      el.classList.remove('in');
      el.style.transitionDelay = reduceMotion ? '0ms' : Math.min(i * 90, 700) + 'ms';
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { items.forEach(function (el) { el.classList.add('in'); }); });
    });
  }

  var next = function () { go(current + 1, { focus: false }); };
  var prev = function () { go(current - 1, { focus: false }); };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-go]');
    if (!t) return;
    e.preventDefault();
    go(+t.dataset.go, { focus: !t.closest('#pagerList') && !t.classList.contains('brand') });
  });
  $('#nextBtn').addEventListener('click', next);
  $('#prevBtn').addEventListener('click', prev);
  window.addEventListener('popstate', function () { go(parseHash(), { fromHash: true }); });
  window.addEventListener('hashchange', function () { go(parseHash(), { fromHash: true }); });

  /* ---------------------------------------------------------------
     لوحة المفاتيح
  --------------------------------------------------------------- */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if ($('#helpDialog').open) return;
    var k = e.key;
    if (k === 'ArrowLeft' || k === 'PageDown') { e.preventDefault(); next(); }
    else if (k === 'ArrowRight' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'Home') { e.preventDefault(); go(1); }
    else if (k === 'End') { e.preventDefault(); go(TOTAL); }
    else if (/^[1-8]$/.test(k)) { go(+k); }
    else if (/^[١-٨]$/.test(k)) { go(AR.indexOf(k)); }
    else if (k === 'f' || k === 'F' || k === 'ب') { toggleFs(); }
    else if (k === 'n' || k === 'N' || k === 'ى') { toggleNotes(); }
    else if (k === 'p' || k === 'P' || k === 'ح') { openPresenter(); }
    else if (k === '?' || k === '؟') { openHelp(); }
    else if (k === 'Escape' && !$('#notesPanel').hidden) { toggleNotes(false); }
  });

  /* ---------------------------------------------------------------
     ملء الشاشة
  --------------------------------------------------------------- */
  var root = document.documentElement;
  var fsSupported = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement; }
  function toggleFs() {
    if (!fsSupported) { toast('وضع ملء الشاشة غير مدعوم في هذا المتصفح. على الجوال: أضف الصفحة إلى الشاشة الرئيسية.'); return; }
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else {
      var r = (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
      if (r && r.catch) r.catch(function () { toast('تعذّر تفعيل ملء الشاشة.'); });
    }
  }
  function onFs() {
    var on = !!fsEl();
    document.body.classList.toggle('is-fs', on);
    $('#fsBtn').setAttribute('aria-pressed', on);
    $('#fsBtn .tool-lbl').textContent = on ? 'إنهاء ملء الشاشة' : 'ملء الشاشة';
    $('#fsIcon').setAttribute('d', on ? 'M9 4v5H4 M20 9h-5V4 M15 20v-5h5 M4 15h5v5' : 'M4 9V4h5 M15 4h5v5 M20 15v5h-5 M9 20H4v-5');
  }
  document.addEventListener('fullscreenchange', onFs);
  document.addEventListener('webkitfullscreenchange', onFs);
  $('#fsBtn').addEventListener('click', toggleFs);

  /* ---------------------------------------------------------------
     ملاحظات المتحدث + نافذة المقدّم
  --------------------------------------------------------------- */
  function notesHTML(sec) {
    return '<p class="n-time">المدة المقترحة: ' + sec.time + '</p>' +
      '<h3>النص الشفهي</h3>' + sec.script.map(function (p) { return '<p class="n-script">' + p + '</p>'; }).join('') +
      '<h3>تنبيهات للمقدّم</h3><ul>' + sec.cues.map(function (c) { return '<li>' + c + '</li>'; }).join('') + '</ul>';
  }
  function renderNotes() {
    var sec = window.SECTIONS[current - 1];
    $('#notesSec').textContent = '— ' + toAr(current) + '. ' + sec.title;
    $('#notesBody').innerHTML = notesHTML(sec);
  }
  function toggleNotes(force) {
    var p = $('#notesPanel');
    var show = typeof force === 'boolean' ? force : p.hidden;
    p.hidden = !show;
    document.body.classList.toggle('notes-open', show);
    $('#notesBtn').setAttribute('aria-pressed', show);
    if (show) $('#notesClose').focus(); else $('#notesBtn').focus();
  }
  $('#notesBtn').addEventListener('click', function () { toggleNotes(); });
  $('#notesClose').addEventListener('click', function () { toggleNotes(false); });

  var presenterWin = null;
  var channel = null;
  try { channel = new BroadcastChannel('sadr-islam'); } catch (err) { channel = null; }
  function broadcast() {
    var msg = { type: 'sadr-sync', n: current };
    if (channel) { try { channel.postMessage(msg); } catch (err) {} }
    if (presenterWin && !presenterWin.closed) { try { presenterWin.postMessage(msg, '*'); } catch (err) {} }
    try { localStorage.setItem('sadr-current', String(current)); } catch (err) {}
  }
  var seenCmds = {};
  function handleCmd(d) {
    if (!d || d.type !== 'sadr-cmd') return;
    if (d.id) { if (seenCmds[d.id]) return; seenCmds[d.id] = 1; }
    if (d.cmd === 'next') next();
    else if (d.cmd === 'prev') prev();
    else if (d.cmd === 'go') go(d.n);
    else if (d.cmd === 'hello') broadcast();
  }
  if (channel) channel.onmessage = function (e) { handleCmd(e.data); };
  window.addEventListener('message', function (e) { handleCmd(e.data); });
  window.addEventListener('storage', function (e) {
    if (e.key === 'sadr-cmd' && e.newValue) { try { handleCmd(JSON.parse(e.newValue)); } catch (err) {} }
  });
  function openPresenter() {
    presenterWin = window.open('presenter.html#s' + current, 'sadr-presenter', 'width=980,height=760');
    if (!presenterWin) { toast('تعذّر فتح نافذة المقدّم هنا، فاعرض الملاحظات بالمفتاح N بدلاً منها.'); toggleNotes(true); }
    else setTimeout(broadcast, 600);
  }
  $('#presenterBtn').addEventListener('click', openPresenter);

  /* ---------------------------------------------------------------
     المساعدة والتنبيهات
  --------------------------------------------------------------- */
  function openHelp() {
    var d = $('#helpDialog');
    if (d.showModal) { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
  }
  $('#helpBtn').addEventListener('click', openHelp);
  $('#helpDialog').addEventListener('click', function (e) { if (e.target === this) this.close(); });

  var toastEl;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast'; toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove('show'); }, 4200);
  }

  /* ---------------------------------------------------------------
     بطاقات قابلة للتوسيع (aria-expanded)
  --------------------------------------------------------------- */
  $$('.xcard, .glow, .pc').forEach(function (b) {
    b.addEventListener('click', function () {
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open);
    });
  });

  /* أكورديون الثقافة */
  $$('[data-acc] > li > button').forEach(function (b) {
    b.addEventListener('click', function () {
      var body = b.nextElementSibling;
      var open = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', open);
      body.hidden = !open;
    });
  });

  /* ---------------------------------------------------------------
     الخط الزمني
  --------------------------------------------------------------- */
  var TL = [
    { y: '610م', t: 'بداية الدعوة الإسلامية', d: 'نزول الوحي وبدء رسالة الإسلام.' },
    { y: '622م', t: 'الهجرة النبوية', d: 'هجرة النبي ﷺ والمسلمين إلى المدينة المنورة، وبداية مرحلة جديدة في بناء المجتمع الإسلامي.' },
    { y: '632م', t: 'وفاة النبي ﷺ', d: 'انتقال قيادة المسلمين إلى عصر الخلفاء الراشدين.' },
    { y: '632–661م', t: 'عصر الخلفاء الراشدين', d: 'مرحلة اتساع الدولة الإسلامية وتنظيم شؤون المجتمع والدولة.' },
    { y: '661م', t: 'بداية الدولة الأموية', d: 'نهاية مرحلة الخلافة الراشدة وبداية العصر الأموي.' }
  ];
  var tlNodes = $$('.tl-node');
  function setTl(i) {
    tlNodes.forEach(function (b, j) {
      b.setAttribute('aria-selected', j === i);
      b.classList.toggle('done', j <= i);
    });
    var panel = $('#tl-panel');
    panel.setAttribute('aria-labelledby', 'tl-' + i);
    panel.classList.remove('pop'); void panel.offsetWidth; panel.classList.add('pop');
    $('#tlYear').textContent = TL[i].y;
    $('#tlTitle').textContent = TL[i].t;
    $('#tlText').textContent = TL[i].d;
    $('#tlFill').style.setProperty('--tl', i / (TL.length - 1));
  }
  tlNodes.forEach(function (b) { b.addEventListener('click', function () { setTl(+b.dataset.tl); }); });
  setTl(0);

  /* ---------------------------------------------------------------
     الخريطة
  --------------------------------------------------------------- */
  var CITIES = {
    makkah: ['مكة المكرمة', 'فيها بدأت الدعوة الإسلامية سنة 610م، وكانت مركزاً دينياً وتجارياً مهماً قبل الإسلام.'],
    madinah: ['المدينة المنورة (يثرب)', 'إليها كانت الهجرة سنة 622م، وفيها قام المجتمع الإسلامي الأول وتأسست الدولة الإسلامية.'],
    taif: ['الطائف', 'مدينة قريبة من مكة، وعلى مقربة منها كان سوق عكاظ من أشهر أسواق العرب قبل الإسلام، يجتمع فيه التجار والشعراء.'],
    khaybar: ['خيبر', 'واحة زراعية شمال المدينة المنورة.'],
    tabuk: ['تبوك', 'تقع في شمال غرب الجزيرة العربية على طريق بلاد الشام.'],
    sanaa: ['صنعاء', 'من مدن اليمن في جنوب الجزيرة العربية، وكان اليمن طرفاً مهماً في طرق التجارة.']
  };
  $$('.city').forEach(function (g) {
    var show = function () {
      var c = CITIES[g.dataset.city];
      $$('.city').forEach(function (o) { o.classList.toggle('on', o === g); });
      $('#mapInfoT').textContent = c[0];
      $('#mapInfoD').textContent = c[1];
    };
    g.addEventListener('click', show);
    g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); } });
  });

  /* ---------------------------------------------------------------
     تبويبات القسم الخامس
  --------------------------------------------------------------- */
  var tris = $$('.tri');
  tris.forEach(function (t) {
    t.addEventListener('click', function () {
      tris.forEach(function (o) {
        var on = o === t;
        o.setAttribute('aria-selected', on);
        var panel = document.getElementById(o.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on) { panel.classList.remove('pop'); void panel.offsetWidth; panel.classList.add('pop'); }
      });
    });
  });

  /* ---------------------------------------------------------------
     الآيات
  --------------------------------------------------------------- */
  var AYA_EXP = [
    'تذكر الآية أن فئة من الشعراء يتبعهم «الغاوون»، أي الضالون. فالنقد موجّه إلى نوع من الشعراء وأتباعهم، لا إلى الشعر بوصفه فناً.',
    'تصف الآية التيه والتنقل في أودية القول وأغراضه دون التزام بحق أو صدق، فيمدح الشاعر ويذم بحسب هواه.',
    'تشير الآية إلى التناقض بين القول والعمل: يقولون ما لا يفعلون.',
    'آية الاستثناء: تستثني الشعراء المؤمنين الذين يعملون الصالحات، ويذكرون الله كثيراً، وينتصرون (يردّون) بعد أن يتعرضوا للظلم. فالشعر الملتزم بالإيمان والحق مقبول، بل محمود.'
  ];
  var ayas = $$('.aya');
  ayas.forEach(function (a, i) {
    a.addEventListener('click', function () {
      ayas.forEach(function (o) { o.setAttribute('aria-expanded', o === a); o.classList.toggle('sel', o === a); });
      var box = $('#ayaExp');
      box.classList.toggle('key', i === 3);
      box.classList.remove('pop'); void box.offsetWidth; box.classList.add('pop');
      $('#ayaExpText').textContent = AYA_EXP[i];
    });
  });

  /* ---------------------------------------------------------------
     نشاط تصنيف الشعر
  --------------------------------------------------------------- */
  var ITEMS = [
    { t: 'قصيدة تثير العصبية والنزاع بين القبائل', a: 'bad', why: 'إثارة العصبية من أسباب نقد بعض الشعر.' },
    { t: 'أبيات تحمل حكمة وموعظة نافعة', a: 'good', why: '«إن من الشعر حكمة».' },
    { t: 'هجاء يشهّر بالناس وينتقص منهم بغير حق', a: 'bad', why: 'هذا ظلم واعتداء على الآخرين.' },
    { t: 'شعر يدافع عن الحق ويرد على من ظلم', a: 'good', why: 'كما في آية الاستثناء وشعر حسان بن ثابت.' },
    { t: 'مبالغة كاذبة وقول لا يطابقه فعل', a: 'bad', why: '«وأنهم يقولون ما لا يفعلون».' },
    { t: 'شعر يدعو إلى الصدق ومكارم الأخلاق', a: 'good', why: 'مضمونه نافع وهدفه نبيل.' }
  ];
  function buildSorter() {
    var list = $('#sortList');
    list.innerHTML = '';
    ITEMS.forEach(function (it, i) {
      var li = document.createElement('li');
      li.className = 'sort-item';
      li.innerHTML =
        '<p class="s-text" id="si' + i + '">' + it.t + '</p>' +
        '<div class="s-btns" role="group" aria-labelledby="si' + i + '">' +
        '<button type="button" class="s-btn bad" data-v="bad">مذموم</button>' +
        '<button type="button" class="s-btn good" data-v="good">هادف</button></div>' +
        '<p class="s-fb" aria-live="polite"></p>';
      $$('.s-btn', li).forEach(function (b) {
        b.addEventListener('click', function () {
          if (li.dataset.done) return;
          var ok = b.dataset.v === it.a;
          li.classList.add(ok ? 'right' : 'wrong');
          b.classList.add('picked');
          b.setAttribute('aria-pressed', 'true');
          if (ok) {
            li.dataset.done = '1';
            $$('.s-btn', li).forEach(function (x) { x.disabled = true; });
            $('.s-fb', li).textContent = '✓ صحيح: ' + it.why;
          } else {
            $('.s-fb', li).textContent = '✗ حاول مرة أخرى: فكّر في مضمون الشعر وهدفه.';
            setTimeout(function () { li.classList.remove('wrong'); b.classList.remove('picked'); b.removeAttribute('aria-pressed'); }, 1100);
          }
          score();
        });
      });
      list.appendChild(li);
    });
    score();
  }
  function score() {
    var done = $$('#sortList .sort-item[data-done]').length;
    $('#sortScore').textContent = done === ITEMS.length
      ? 'أحسنتم! صنّفتم الأوصاف الستة كلها: العبرة بمضمون الشعر وهدفه وأثره.'
      : 'صُنّف ' + toAr(done) + ' من ' + toAr(ITEMS.length);
  }
  $('#sortReset').addEventListener('click', buildSorter);
  buildSorter();

  /* ---------------------------------------------------------------
     سؤال الجمهور
  --------------------------------------------------------------- */
  $$('#quiz .opt').forEach(function (o) {
    o.addEventListener('click', function () {
      var ok = o.dataset.correct === 'true';
      $$('#quiz .opt').forEach(function (x) { x.classList.remove('right', 'wrong'); x.removeAttribute('aria-pressed'); });
      o.classList.add(ok ? 'right' : 'wrong');
      o.setAttribute('aria-pressed', 'true');
      var fb = $('#quizFb');
      fb.hidden = false;
      fb.className = 'quiz-fb ' + (ok ? 'ok' : 'no');
      fb.innerHTML = ok
        ? '<strong>إجابة صحيحة.</strong> الآيات انتقدت فئة من الشعراء، ثم استثنت في الآية 227 الذين آمنوا وعملوا الصالحات وذكروا الله كثيراً وانتصروا من بعد ما ظُلموا. وقال النبي ﷺ: «إن من الشعر حكمة»، وأيّد حسانَ بن ثابت في الدفاع عنه بشعره.'
        : '<strong>ليس تماماً.</strong> اقرأ الآيات كاملة: الآية الأخيرة (227) تستثني الشعراء المؤمنين. فالنقد موجّه إلى الشعر المذموم، لا إلى الشعر كله. جرّب مرة أخرى.';
    });
  });

  /* ---------------------------------------------------------------
     مصادر الصور
  --------------------------------------------------------------- */
  var CREDITS = window.IMAGE_CREDITS || [];
  $('#creditList').innerHTML = CREDITS.map(function (c) {
    return '<li><strong>' + c.ar + '</strong> — ' + c.author + ' · ' + c.license +
      ' · <a href="' + c.url + '" target="_blank" rel="noopener">ويكيميديا كومنز ↗</a></li>';
  }).join('');

  /* ---------------------------------------------------------------
     الإقلاع
  --------------------------------------------------------------- */
  var start = parseHash();
  go(start, { replace: true, force: true });
})();
