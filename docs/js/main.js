/* =========================================================
   Lyng Ventilation ApS – interaktivitet på hjemmesiden
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Indstillinger (ret her) ---------- */
  var OPENING_HOURS = {
    // 0 = søndag, 1 = mandag ... 6 = lørdag. [fra, til] i hele timer. Pladsholder: hverdage 07–16
    1: [7, 16], 2: [7, 16], 3: [7, 16], 4: [7, 16], 5: [7, 16]
  };
  // Hvor tilbudsformularen sendes hen. '/api/kontakt' virker, når siden kører via server.js.
  // Ligger siden på GitHub Pages eller et webhotel, kan I indsætte en Formspree-adresse her,
  // fx 'https://formspree.io/f/abcdwxyz'. Kan der ikke sendes, åbnes en udfyldt e-mail i stedet.
  var FORM_ENDPOINT = '/api/kontakt';
  var COMPANY_EMAIL = 'info@lyngventilation.dk';
  var COMPANY_PHONE = '42 71 22 71';
  var DRAFT_KEY = 'lyng-tilbud-kladde';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Måling (Google Tag Manager / GA4 kan lytte på dataLayer) ---------- */
  function track(event, data) {
    try {
      window.dataLayer = window.dataLayer || [];
      var obj = { event: event };
      for (var k in data) obj[k] = data[k];
      window.dataLayer.push(obj);
    } catch (e) { /* ignorer */ }
  }
  window.lyngTrack = track;
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-track]');
    if (el) track('cta_click', { cta: el.getAttribute('data-track') });
  });

  /* ---------- Lille besked nederst på skærmen ---------- */
  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3500);
  }

  /* ---------- Årstal i footer ---------- */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Mobilmenu ---------- */
  var navToggle = $('.nav-toggle');
  var nav = $('#main-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? 'Luk menu' : 'Åbn menu');
    });
    $$('a', nav).forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Åbent / lukket ---------- */
  (function () {
    var now = new Date();
    var hours = OPENING_HOURS[now.getDay()];
    var h = now.getHours() + now.getMinutes() / 60;
    var isOpen = !!hours && h >= hours[0] && h < hours[1];
    $$('[data-open-dot]').forEach(function (d) { d.classList.toggle('is-closed', !isOpen); });
    $$('[data-open-text]').forEach(function (t) {
      t.textContent = isOpen ? 'Åbent nu – ring direkte' : 'Lukket nu – bliv ringet op';
    });
  })();

  /* ---------- Telefonnummer på computer: kopier i stedet for at "ringe" ---------- */
  var hasTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  $$('a[href^="tel:"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      track('phone_click', { device: hasTouch ? 'mobil' : 'computer' });
      if (hasTouch) return; // på mobil ringer linket op som normalt
      e.preventDefault();
      var done = function () { toast('Nummeret ' + COMPANY_PHONE + ' er kopieret – ring fra din telefon.'); };
      try { navigator.clipboard.writeText(COMPANY_PHONE).then(done, function () { toast('Ring til os på ' + COMPANY_PHONE); }); }
      catch (err) { toast('Ring til os på ' + COMPANY_PHONE); }
    });
  });

  /* =========================================================
     INDEKLIMA-TJEK
     ========================================================= */
  var SOLUTIONS = [
    { service: 'Nyt anlæg – bolig', title: 'Ventilation til boligen', why: 'Balanceret ventilation med varmegenvinding: frisk luft og mindre fugt – uden at smide varmen ud.', hits: ['fugt', 'luft', 'byg'] },
    { service: 'Nyt anlæg – erhverv', title: 'Ventilation til erhverv', why: 'Godt indeklima på kontoret, i butikken eller institutionen, så folk trives og kan koncentrere sig.', hits: ['kontor', 'luft', 'byg'] },
    { service: 'Indregulering', title: 'Indregulering', why: 'Vi måler og justerer anlægget, så hvert rum får den rigtige luftmængde – stille og energirigtigt.', hits: ['stoej', 'ujaevn', 'energi', 'kontor'] },
    { service: 'Rådgivning og planlægning', title: 'Rådgivning og planlægning', why: 'Vi finder den rigtige løsning, før der investeres – og planlægger hele forløbet.', hits: ['byg', 'energi'] }
  ];

  var symptomBtns = $$('.symptom');
  var recoList = $('#reco-list');
  var recoEmpty = $('#reco-empty');
  var recoActions = $('#reco-actions');
  var recoCta = $('#reco-cta');
  var recoCount = $('#reco-count');
  var topService = null;

  function selectedSymptomLabels() {
    return symptomBtns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })
      .map(function (b) { return b.textContent.trim(); });
  }

  function renderRecommendations() {
    var selected = symptomBtns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; })
      .map(function (b) { return b.dataset.id; });
    recoCount.textContent = selected.length + ' valgt';

    var recs = SOLUTIONS.map(function (s) {
      var n = s.hits.filter(function (h) { return selected.indexOf(h) >= 0; }).length;
      return { s: s, n: n };
    }).filter(function (r) { return r.n > 0; })
      .sort(function (a, b) { return b.n - a.n; })
      .slice(0, 3);

    recoList.innerHTML = '';
    recs.forEach(function (r, i) {
      var li = document.createElement('li');
      li.className = 'reco-item';
      var top = document.createElement('div'); top.className = 'reco-top';
      var rank = document.createElement('span'); rank.className = 'reco-rank'; rank.textContent = '0' + (i + 1);
      var title = document.createElement('h3'); title.className = 'reco-title'; title.textContent = r.s.title;
      top.appendChild(rank); top.appendChild(title);
      var why = document.createElement('p'); why.className = 'reco-why'; why.textContent = r.s.why;
      var meter = document.createElement('div'); meter.className = 'reco-meter';
      var bar = document.createElement('div'); bar.className = 'reco-bar';
      var fill = document.createElement('div'); fill.className = 'reco-fill';
      fill.style.width = Math.round(r.n / selected.length * 100) + '%';
      bar.appendChild(fill);
      var hits = document.createElement('span'); hits.className = 'reco-hits';
      hits.textContent = r.n + ' af ' + selected.length + ' punkter';
      meter.appendChild(bar); meter.appendChild(hits);
      li.appendChild(top); li.appendChild(why); li.appendChild(meter);
      recoList.appendChild(li);
    });

    var has = recs.length > 0;
    recoEmpty.hidden = has;
    recoActions.hidden = !has;
    topService = has ? recs[0].s.service : null;
    if (has) recoCta.textContent = 'Få tilbud på ' + recs[0].s.title.toLowerCase();
  }

  symptomBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      renderRecommendations();
    });
  });
  if (recoCta) {
    recoCta.addEventListener('click', function (e) {
      e.preventDefault();
      if (topService) Quote.open(topService, 'Det driller: ' + selectedSymptomLabels().join(', ') + '.');
      track('cta_click', { cta: 'indeklima-tjek', service: topService });
    });
  }

  /* =========================================================
     YDELSER – faner
     ========================================================= */
  var tabs = $$('.svc-tab');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) panel.hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(t); });
    t.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home') next = tabs[0];
      if (e.key === 'End') next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); selectTab(next, true); }
    });
  });

  /* =========================================================
     PROJEKTER – filter
     ========================================================= */
  var filters = $$('.filter');
  var projects = $$('.project');
  filters.forEach(function (f) {
    f.addEventListener('click', function () {
      var cat = f.dataset.filter;
      filters.forEach(function (x) { x.setAttribute('aria-pressed', x === f ? 'true' : 'false'); });
      projects.forEach(function (p) { p.hidden = !(cat === 'alle' || p.dataset.cat === cat); });
    });
  });

  /* =========================================================
     UDTALELSER – slider
     ========================================================= */
  var reviews = $$('.review');
  var dotsWrap = $('#review-dots');
  var reviewPos = $('#review-pos');
  var current = 0;
  var dotBtns = reviews.map(function (r, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'dot-btn';
    b.setAttribute('aria-label', 'Vis udtalelse ' + (i + 1));
    b.addEventListener('click', function () { showReview(i); });
    dotsWrap.appendChild(b);
    return b;
  });
  function showReview(i) {
    current = (i + reviews.length) % reviews.length;
    reviews.forEach(function (r, j) { r.hidden = j !== current; });
    dotBtns.forEach(function (d, j) { d.setAttribute('aria-current', j === current ? 'true' : 'false'); });
    if (reviewPos) reviewPos.textContent = (current + 1) + ' / ' + reviews.length;
  }
  if (reviews.length) {
    $('#review-prev').addEventListener('click', function () { showReview(current - 1); });
    $('#review-next').addEventListener('click', function () { showReview(current + 1); });
    showReview(0);
  }

  /* =========================================================
     FAQ – kun ét svar åbent ad gangen
     ========================================================= */
  var faqs = $$('.faq');
  faqs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) faqs.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* =========================================================
     TILBUDSFORMULAR – 2 TRIN
     Trin 1: klik på en ydelse (går selv videre)
     Trin 2: navn + telefon (resten er valgfrit)
     ========================================================= */
  var Quote = (function () {
    var form = $('#quote');
    if (!form) return { open: function () {} };

    var CALLBACK = 'Bliv ringet op';
    var state = { step: 1, service: '', building: '' };
    var panes = $$('.step-pane', form);
    var stepNum = $('#step-num'), stepName = $('#step-name'), bar = $('#progress-bar');
    var errorEl = $('#form-error');
    var formWrap = $('#quote-form'), done = $('#quote-done'), fallback = $('#quote-fallback');
    var btnSubmit = $('#btn-submit');
    var fName = $('#f-name'), fPhone = $('#f-phone'), fEmail = $('#f-email'), fZip = $('#f-zip'), fMsg = $('#f-msg');
    var NAMES = ['', 'Hvad skal vi hjælpe med?', 'Dine kontaktoplysninger'];

    /* --- kladde: husk det, kunden har skrevet --- */
    function saveDraft() {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          service: state.service, building: state.building,
          name: fName.value, phone: fPhone.value, email: fEmail.value, zip: fZip.value, msg: fMsg.value
        }));
      } catch (e) { /* ignorer */ }
    }
    function loadDraft() {
      try {
        var d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
        if (!d) return;
        fName.value = d.name || ''; fPhone.value = d.phone || ''; fEmail.value = d.email || '';
        fZip.value = d.zip || ''; fMsg.value = d.msg || '';
        if (d.building) setTile('building', d.building);
      } catch (e) { /* ignorer */ }
    }
    function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) { /* ignorer */ } }

    function setTile(field, value) {
      state[field] = value;
      $$('.tiles[data-field="' + field + '"] .tile', form).forEach(function (t) {
        t.setAttribute('aria-pressed', t.dataset.value === value ? 'true' : 'false');
      });
    }

    function setService(service) {
      setTile('service', service);
      var isCallback = service === CALLBACK;
      $('#chosen-service').textContent = service;
      btnSubmit.textContent = isCallback ? 'Ring mig op' : 'Få mit uforpligtende tilbud';
      form.classList.toggle('is-callback', isCallback);
    }

    function go(step, focus) {
      state.step = step;
      panes.forEach(function (p) { p.hidden = Number(p.dataset.step) !== step; });
      stepNum.textContent = step;
      stepName.textContent = NAMES[step];
      bar.style.width = (step === 1 ? 50 : 100) + '%';
      hideError();
      if (focus && step === 2) setTimeout(function () { (fName.value ? fPhone : fName).focus({ preventScroll: true }); }, 60);
    }

    function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
    function hideError() { errorEl.hidden = true; }

    // Trin 1: et klik på en ydelse går direkte videre
    $$('.tiles[data-field="service"] .tile', form).forEach(function (t) {
      t.addEventListener('click', function () {
        setService(t.dataset.value);
        saveDraft();
        go(2, true);
        track('form_step', { step: 2, service: t.dataset.value });
      });
    });
    $$('.tiles[data-field="building"] .tile', form).forEach(function (t) {
      t.addEventListener('click', function () {
        setTile('building', state.building === t.dataset.value ? '' : t.dataset.value);
        saveDraft();
      });
    });
    $('#btn-callback').addEventListener('click', function () {
      setService(CALLBACK);
      go(2, true);
      track('form_step', { step: 2, service: CALLBACK });
    });
    $('#btn-change').addEventListener('click', function () { go(1); });
    [fName, fPhone, fEmail, fZip, fMsg].forEach(function (el) { el.addEventListener('input', saveDraft); });

    // Dansk telefonnummer: 8 cifre, evt. med +45 / 0045 foran
    function cleanPhone(v) {
      var d = (v || '').replace(/\D/g, '');
      if (d.length === 10 && d.indexOf('45') === 0) d = d.slice(2);
      if (d.length === 12 && d.indexOf('0045') === 0) d = d.slice(4);
      return d;
    }

    function mailtoLink(p) {
      var lines = [
        'Hej Lyng Ventilation', '',
        'Jeg vil gerne ' + (p.service === CALLBACK ? 'ringes op.' : 'høre mere om: ' + p.service + '.'),
        p.building ? 'Bygning: ' + p.building : '',
        p.message ? 'Besked: ' + p.message : '',
        '',
        'Navn: ' + p.name,
        'Telefon: ' + p.phone,
        p.email ? 'E-mail: ' + p.email : '',
        p.zip ? 'Postnummer: ' + p.zip : ''
      ].filter(function (l, i, a) { return l !== '' || (a[i - 1] !== ''); });
      return 'mailto:' + COMPANY_EMAIL +
        '?subject=' + encodeURIComponent((p.service === CALLBACK ? 'Ring mig op' : 'Tilbud: ' + p.service) + ' – ' + p.name) +
        '&body=' + encodeURIComponent(lines.join('\n'));
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (state.step !== 2) return;
      var phone = cleanPhone(fPhone.value);
      fName.setAttribute('aria-invalid', fName.value.trim() ? 'false' : 'true');
      fPhone.setAttribute('aria-invalid', phone.length === 8 ? 'false' : 'true');
      if (!fName.value.trim()) { fName.focus(); return showError('Skriv venligst dit navn.'); }
      if (phone.length !== 8) { fPhone.focus(); return showError('Telefonnummeret skal have 8 cifre, fx 12 34 56 78.'); }
      if (fEmail.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fEmail.value)) { fEmail.focus(); return showError('E-mailadressen ser ikke rigtig ud.'); }

      var payload = {
        service: state.service,
        building: state.building,
        message: fMsg.value.trim(),
        name: fName.value.trim(),
        phone: fPhone.value.trim(),
        email: fEmail.value.trim(),
        zip: fZip.value.trim(),
        website: $('#f-web').value // honeypot
      };

      btnSubmit.disabled = true;
      var label = btnSubmit.textContent;
      btnSubmit.textContent = 'Sender…';

      function showDone() {
        $('#done-name').textContent = payload.name.split(' ')[0];
        $('#done-what').textContent = payload.service === CALLBACK ? 'at blive ringet op' : 'om ' + payload.service.toLowerCase();
        $('#done-phone').textContent = payload.phone;
        formWrap.hidden = true; done.hidden = false; fallback.hidden = true;
        done.focus();
        clearDraft();
        track('lead_submit', { service: payload.service, method: 'formular' });
      }
      function showFallback() {
        $('#fallback-mail').href = mailtoLink(payload);
        formWrap.hidden = true; fallback.hidden = false; done.hidden = true;
        fallback.focus();
        track('lead_fallback', { service: payload.service });
      }

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        showDone();
      }).catch(showFallback).then(function () {
        btnSubmit.disabled = false;
        btnSubmit.textContent = label;
      });
    });

    $('#fallback-mail').addEventListener('click', function () {
      clearDraft();
      track('lead_submit', { service: state.service, method: 'e-mail' });
    });

    $$('[data-reset]').forEach(function (b) {
      b.addEventListener('click', function () {
        form.reset();
        setTile('service', ''); setTile('building', '');
        $$('input', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
        done.hidden = true; fallback.hidden = true; formWrap.hidden = false;
        go(1);
      });
    });

    loadDraft();
    go(1);

    function scrollToForm() {
      var target = $('#kontakt');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return {
      /** Åbn formularen – evt. med en valgt ydelse og en forudfyldt besked */
      open: function (service, note) {
        formWrap.hidden = false; done.hidden = true; fallback.hidden = true;
        if (note && !fMsg.value.trim()) { fMsg.value = note; saveDraft(); }
        if (service) { setService(service); go(2, true); }
        else go(1);
        scrollToForm();
      }
    };
  })();
  window.LyngQuote = Quote;

  // Alle knapper med data-service springer direkte til kontaktfelterne
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      Quote.open(a.dataset.service);
    });
  });
  $$('[data-open-quote]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var v = a.getAttribute('data-open-quote');
      Quote.open(v === 'callback' ? 'Bliv ringet op' : '');
    });
  });

  /* ---------- Mobil bundbjælke: skjul den, når formularen er i billedet ---------- */
  var bar = $('#mobile-cta');
  var contact = $('#kontakt');
  if (bar && contact && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var inView = entries[0].isIntersecting;
      bar.classList.toggle('is-hidden', inView);
      document.body.classList.toggle('in-contact', inView);
    }, { threshold: 0.05 }).observe(contact);
  }
})();
