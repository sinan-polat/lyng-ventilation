/* =========================================================
   Air Plus ApS – interaktivitet på hjemmesiden
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Indstillinger (ret her) ---------- */
  var OPENING_HOURS = {
    // 0 = søndag, 1 = mandag ... 6 = lørdag. [fra, til] i hele timer. Pladsholder: hverdage 07–16
    1: [7, 16], 2: [7, 16], 3: [7, 16], 4: [7, 16], 5: [7, 16]
  };
  var CONTACT_ENDPOINT = '/api/kontakt';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

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
      t.textContent = isOpen ? 'Åbent nu – ring direkte' : 'Lukket nu – skriv, så ringer vi';
    });
  })();

  /* =========================================================
     INDEKLIMA-TJEK
     ========================================================= */
  var SOLUTIONS = [
    { service: 'Ventilation & varmegenvinding', title: 'Ventilation med varmegenvinding', why: 'Fjerner fugt og brugt luft døgnet rundt – uden at smide varmen ud.', hits: ['fugt', 'luft', 'byg'] },
    { service: 'Varmepumper', title: 'Varmepumpe', why: 'Erstatter fyret og sænker udgiften til opvarmning.', hits: ['regning', 'fyr'] },
    { service: 'Isolering', title: 'Efterisolering', why: 'Mindsker varmetab og træk gennem loft, mure og rør.', hits: ['traek', 'regning'] },
    { service: 'Klima & køl', title: 'Klima & køl', why: 'Holder temperaturen nede på varme dage – stille og uden træk.', hits: ['varmt'] },
    { service: 'VVS & varmeanlæg', title: 'VVS & gulvvarme', why: 'Jævn varme i gulvet og et varmeanlæg, der passer til fremtiden.', hits: ['traek', 'fyr', 'byg'] },
    { service: 'Teknisk rådgivning', title: 'Teknisk rådgivning', why: 'Vi måler og beregner, så du investerer i det, der virker.', hits: ['byg', 'luft', 'fugt'] }
  ];

  var symptomBtns = $$('.symptom');
  var recoList = $('#reco-list');
  var recoEmpty = $('#reco-empty');
  var recoActions = $('#reco-actions');
  var recoCta = $('#reco-cta');
  var recoCount = $('#reco-count');
  var topService = null;

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
    recoCta.addEventListener('click', function () {
      if (topService) Quote.chooseService(topService);
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
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () { Quote.chooseService(a.dataset.service); });
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
     TILBUDSFORMULAR I 3 TRIN
     ========================================================= */
  var Quote = (function () {
    var form = $('#quote');
    if (!form) return { chooseService: function () {} };

    var state = { step: 1, service: '', building: '' };
    var panes = $$('.step-pane', form);
    var stepNum = $('#step-num'), stepName = $('#step-name'), bar = $('#progress-bar');
    var btnBack = $('#btn-back'), btnNext = $('#btn-next'), btnSubmit = $('#btn-submit');
    var errorEl = $('#form-error');
    var formWrap = $('#quote-form'), done = $('#quote-done');
    var NAMES = ['', 'Ydelse', 'Bygning', 'Kontaktinfo'];

    function setTile(field, value) {
      state[field] = value;
      $$('.tiles[data-field="' + field + '"] .tile', form).forEach(function (t) {
        t.setAttribute('aria-pressed', t.dataset.value === value ? 'true' : 'false');
      });
      if (field === 'service') $('#chosen-service').textContent = value || '–';
      hideError();
    }

    function go(step) {
      state.step = step;
      panes.forEach(function (p) { p.hidden = Number(p.dataset.step) !== step; });
      stepNum.textContent = step;
      stepName.textContent = NAMES[step];
      bar.style.width = Math.round(step / 3 * 100) + '%';
      btnBack.hidden = step === 1;
      btnNext.hidden = step === 3;
      btnSubmit.hidden = step !== 3;
      hideError();
    }

    function showError(msg) { errorEl.textContent = msg; errorEl.hidden = false; }
    function hideError() { errorEl.hidden = true; }

    $$('.tile', form).forEach(function (t) {
      t.addEventListener('click', function () {
        setTile(t.parentElement.dataset.field, t.dataset.value);
      });
    });

    btnNext.addEventListener('click', function () {
      if (state.step === 1 && !state.service) return showError('Vælg venligst, hvad vi skal hjælpe med.');
      if (state.step === 2 && !state.building) return showError('Vælg venligst en type bygning.');
      go(state.step + 1);
      var first = $('.step-pane:not([hidden]) input, .step-pane:not([hidden]) .tile', form);
      if (first) first.focus({ preventScroll: true });
    });
    btnBack.addEventListener('click', function () { go(Math.max(1, state.step - 1)); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (state.step !== 3) return;
      var name = $('#f-name'), phone = $('#f-phone'), email = $('#f-email');
      var digits = phone.value.replace(/\D/g, '');
      name.setAttribute('aria-invalid', name.value.trim() ? 'false' : 'true');
      phone.setAttribute('aria-invalid', digits.length >= 8 ? 'false' : 'true');
      if (!name.value.trim() || digits.length < 8) return showError('Udfyld venligst navn og et gyldigt telefonnummer.');
      if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) return showError('E-mailadressen ser ikke rigtig ud.');

      var payload = {
        service: state.service,
        building: state.building,
        message: $('#f-msg').value.trim(),
        name: name.value.trim(),
        phone: phone.value.trim(),
        email: email.value.trim(),
        zip: $('#f-zip').value.trim(),
        website: $('#f-web').value // honeypot
      };

      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Sender…';
      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        $('#done-name').textContent = payload.name.split(' ')[0];
        $('#done-service').textContent = payload.service.toLowerCase();
        $('#done-phone').textContent = payload.phone;
        formWrap.hidden = true;
        done.hidden = false;
      }).catch(function () {
        showError('Forespørgslen kunne ikke sendes lige nu. Ring venligst på 50 50 50 50 – så hjælper vi dig med det samme.');
      }).then(function () {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Send forespørgsel';
      });
    });

    $('#btn-reset').addEventListener('click', function () {
      form.reset();
      setTile('service', ''); setTile('building', '');
      $$('input', form).forEach(function (i) { i.removeAttribute('aria-invalid'); });
      done.hidden = true; formWrap.hidden = false;
      go(1);
    });

    go(1);

    return {
      chooseService: function (service) {
        setTile('service', service);
        formWrap.hidden = false; done.hidden = true;
        go(2);
      }
    };
  })();
})();
