/* =========================================================
   Lyng Assistent – chat-widget
   Taler med serveren på /api/chat, som sender spørgsmålet
   videre til Claude og streamer svaret tilbage.
   ========================================================= */
(function () {
  'use strict';

  var CHAT_ENDPOINT = '/api/chat';
  var MAX_TURNS = 20; // hvor mange beskeder der sendes med som kontekst

  var GREETING = 'Hej! Jeg er Lyng Ventilations digitale assistent. Spørg mig om **ventilation, indeklima, installation og indregulering** – fra hverdagsspørgsmål til tekniske detaljer.\n\nSkal du have hjælp til et konkret projekt, hjælper jeg dig også videre til en uforpligtende samtale.';

  var SUGGESTIONS = [
    { label: 'Hverdag', items: [
      'Hvor tit skal jeg skifte filter i mit ventilationsanlæg?',
      'Hvorfor dugger mine vinduer indvendigt?',
      'Hvad koster et ventilationsanlæg til et parcelhus?'
    ] },
    { label: 'Teknik', items: [
      'Hvad er indregulering, og hvorfor er det vigtigt?',
      'Hvilke krav stiller BR18 til ventilation i boliger?',
      'Hvordan virker varmegenvinding i et ventilationsanlæg?'
    ] }
  ];

  var launcher = document.getElementById('chat-launcher');
  var panel = document.getElementById('chat-panel');
  var log = document.getElementById('chat-log');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  var sendBtn = document.getElementById('chat-send');
  var stopBtn = document.getElementById('chat-stop');
  if (!launcher || !panel) return;

  var turns = [];
  var busy = false;
  var controller = null;
  var started = false;
  var lastQuestion = '';

  /* ---------- Sikker mini-Markdown (escape først) ---------- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }
  function md(src) {
    var out = [], para = [], list = null;
    function flushPara() { if (para.length) { out.push('<p>' + para.map(inline).join('<br>') + '</p>'); para = []; } }
    function flushList() {
      if (!list) return;
      out.push('<' + list.type + '>' + list.items.map(function (i) { return '<li>' + inline(i) + '</li>'; }).join('') + '</' + list.type + '>');
      list = null;
    }
    src.replace(/\r/g, '').split('\n').forEach(function (raw) {
      var line = raw.trim();
      var ul = line.match(/^[-*•]\s+(.*)$/);
      var ol = line.match(/^\d+[.)]\s+(.*)$/);
      var h = line.match(/^#{1,6}\s+(.*)$/);
      if (!line) { flushPara(); flushList(); return; }
      if (h) { flushPara(); flushList(); out.push('<span class="ch">' + inline(h[1]) + '</span>'); return; }
      if (ul || ol) {
        flushPara();
        var type = ul ? 'ul' : 'ol';
        if (!list || list.type !== type) { flushList(); list = { type: type, items: [] }; }
        list.items.push((ul || ol)[1]);
        return;
      }
      flushList();
      para.push(line);
    });
    flushPara(); flushList();
    return out.join('');
  }

  /* ---------- Visning ---------- */
  function scrollDown() { log.scrollTop = log.scrollHeight; }
  function nearBottom() { return log.scrollHeight - log.scrollTop - log.clientHeight < 80; }

  function addMessage(role, text) {
    var wrap = document.createElement('div');
    wrap.className = 'cmsg ' + (role === 'user' ? 'cmsg-user' : 'cmsg-bot');
    var bubble = document.createElement('div');
    bubble.className = 'cbubble';
    if (role === 'user') bubble.textContent = text;
    else if (text == null) bubble.innerHTML = '<span class="cthinking"><span class="cdots"><b></b><b></b><b></b></span>Tænker…</span>';
    else bubble.innerHTML = md(text);
    wrap.appendChild(bubble);
    log.appendChild(wrap);
    scrollDown();
    return bubble;
  }

  function addNote(text) {
    var n = document.createElement('p');
    n.className = 'cnote';
    n.textContent = text;
    log.appendChild(n);
    scrollDown();
  }

  function addError(text, retry) {
    var box = document.createElement('div');
    box.className = 'cerror';
    var span = document.createElement('span'); span.textContent = text;
    box.appendChild(span);
    if (retry) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = 'Prøv igen';
      b.addEventListener('click', function () {
        box.remove();
        // Fjern det mislykkede spørgsmål fra visningen; det stilles igen
        var users = log.querySelectorAll('.cmsg-user');
        var last = users[users.length - 1];
        if (last) last.remove();
        ask(lastQuestion);
      });
      box.appendChild(b);
    }
    log.appendChild(box);
    scrollDown();
  }

  function renderSuggestions() {
    var wrap = document.createElement('div');
    wrap.className = 'csugg';
    wrap.id = 'chat-suggestions';
    SUGGESTIONS.forEach(function (group) {
      var label = document.createElement('p');
      label.className = 'csugg-label';
      label.textContent = group.label;
      wrap.appendChild(label);
      group.items.forEach(function (q) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'cchip'; b.textContent = q;
        b.addEventListener('click', function () { ask(q); });
        wrap.appendChild(b);
      });
    });
    log.appendChild(wrap);
  }

  function resetChat() {
    if (controller) controller.abort();
    turns = [];
    log.innerHTML = '';
    addMessage('assistant', GREETING);
    renderSuggestions();
  }

  function setBusy(b) {
    busy = b;
    sendBtn.disabled = b;
    stopBtn.hidden = !b;
  }

  /* ---------- Åbn / luk ---------- */
  function openChat() {
    if (!started) { resetChat(); started = true; }
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    setTimeout(function () { input.focus(); }, 50);
  }
  function closeChat() {
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    launcher.focus();
  }
  launcher.addEventListener('click', openChat);
  document.getElementById('chat-close').addEventListener('click', closeChat);
  document.getElementById('chat-new').addEventListener('click', resetChat);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) closeChat(); });
  Array.prototype.forEach.call(document.querySelectorAll('[data-open-chat]'), function (b) {
    b.addEventListener('click', openChat);
  });

  /* ---------- Send spørgsmål ---------- */
  function ask(text) {
    text = (text || '').trim();
    if (!text || busy) return;
    var sugg = document.getElementById('chat-suggestions');
    if (sugg) sugg.remove();

    lastQuestion = text;
    addMessage('user', text);
    turns.push({ role: 'user', content: text });
    input.value = ''; autosize();

    var bubble = addMessage('assistant', null);
    var answer = '';
    setBusy(true);
    controller = new AbortController();
    var myController = controller;

    fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: turns.slice(-MAX_TURNS) }),
      signal: myController.signal
    }).then(function (res) {
      if (!res.ok || !res.body) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          var err = new Error(data.error || 'HTTP ' + res.status);
          err.status = res.status;
          throw err;
        });
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      function pump() {
        return reader.read().then(function (r) {
          if (r.done) return;
          answer += decoder.decode(r.value, { stream: true });
          var stick = nearBottom();
          bubble.innerHTML = md(answer);
          if (stick) scrollDown();
          return pump();
        });
      }
      return pump();
    }).then(function () {
      if (!answer.trim()) throw new Error('empty');
      turns.push({ role: 'assistant', content: answer });
    }).catch(function (err) {
      if (err && err.name === 'AbortError') {
        if (answer.trim()) { turns.push({ role: 'assistant', content: answer }); addNote('Stoppet.'); }
        else { bubble.parentElement.remove(); turns.pop(); }
        return;
      }
      if (answer.trim()) {
        turns.push({ role: 'assistant', content: answer });
        addError('Svaret blev afbrudt.', false);
        return;
      }
      bubble.parentElement.remove();
      turns.pop();
      var msg;
      if (err && err.status === 429) msg = 'Der er stillet mange spørgsmål på kort tid. Vent et øjeblik, og prøv igen.';
      else if (err && (err.status === 404 || err.status === 405 || err.status === 503 || err instanceof TypeError))
        msg = 'Chatten er ikke forbundet lige nu. Ring på 42 71 22 71 – så hjælper vi dig direkte.';
      else msg = 'Noget gik galt. Prøv igen, eller ring på 42 71 22 71.';
      addError(msg, !(err && err.status === 503));
    }).then(function () {
      if (controller === myController) { controller = null; setBusy(false); }
    });
  }

  /* ---------- Inputfelt ---------- */
  function autosize() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  }
  input.addEventListener('input', autosize);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); ask(input.value); }
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  stopBtn.addEventListener('click', function () { if (controller) controller.abort(); });
})();
