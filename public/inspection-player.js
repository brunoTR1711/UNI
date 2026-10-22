/* Inspeção de documentos — ficha individual. Não altera os itens/cargas. */
(() => {
  'use strict';
  if (!document.getElementById('sheet-root')) return;
  const socket = window.nevoaSocket;
  const characterId = decodeURIComponent(location.pathname.split('/').filter(Boolean).pop() || '');
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let deliveries = [];
  let activeId = null;
  let reading = false;
  let historyVisible = false;
  let historyId = null;
  let hasLoaded = false;
  let known = new Set();
  let audio = null;

  document.body.insertAdjacentHTML('beforeend', `
    <div id="inspection-player-overlay" class="inspection-player-overlay" hidden>
      <div class="inspection-overlay-shade"></div>
      <section class="inspection-view-window" role="dialog" aria-modal="true" aria-labelledby="inspection-view-title">
        <header class="inspection-view-head"><div><small>◈ DOCUMENTO RECEBIDO</small><h2 id="inspection-view-title"></h2></div><span>ARQUIVO DE INSPEÇÃO</span></header>
        <div class="inspection-view-content"><div id="inspection-view-art" class="inspection-view-art"></div><article id="inspection-view-paper" class="inspection-document-paper" hidden></article><small id="inspection-view-hint" class="inspection-hint">Clique em LER para consultar o conteúdo.</small></div>
        <footer class="inspection-view-foot"><button id="inspection-read" class="inspection-primary" type="button">LER</button><button id="inspection-finish" type="button" hidden>FECHAR</button></footer>
      </section>
    </div>
    <div id="inspection-history-overlay" class="inspection-player-overlay" hidden>
      <div class="inspection-overlay-shade" data-history-close="true"></div>
      <section class="inspection-view-window inspection-history-window" role="dialog" aria-modal="true" aria-labelledby="inspection-history-title">
        <header class="inspection-view-head"><div><small>REGISTRO RECUPERADO / HISTÓRICO</small><h2 id="inspection-history-title"></h2></div><span>APENAS TEXTO</span></header>
        <div class="inspection-view-content"><article id="inspection-history-paper" class="inspection-document-paper"></article></div>
        <footer class="inspection-view-foot"><button id="inspection-history-close" type="button">FECHAR LEITURA</button></footer>
      </section>
    </div>
  `);
  const $ = id => document.getElementById(id);
  const active = () => deliveries.find(entry => entry.id === activeId);
  const unread = () => deliveries.filter(entry => !entry.closedAt);
  const read = () => deliveries.filter(entry => !!entry.readAt).slice().reverse();
  function primeAudio() {
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      if (!audio) audio = new Context();
      if (audio.state === 'suspended') audio.resume().catch(() => {});
    } catch (_e) { /* Android/browser audio policy: no sound until first touch. */ }
  }
  document.addEventListener('pointerdown', primeAudio, { passive: true });
  document.addEventListener('keydown', primeAudio);
  function arrivalChime() {
    try {
      primeAudio();
      if (!audio || audio.state !== 'running') return;
      const t = audio.currentTime;
      [[540, 0], [800, 0.095]].forEach(([hz, delay]) => {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.type = 'sine'; oscillator.frequency.value = hz;
        gain.gain.setValueAtTime(0.0001, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.038, t + delay + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + delay + 0.22);
        oscillator.connect(gain); gain.connect(audio.destination);
        oscillator.start(t + delay); oscillator.stop(t + delay + 0.23);
      });
    } catch (_e) { /* Indicador visual permanece em qualquer navegador. */ }
  }
  function setPaper(node, entry) {
    node.className = `inspection-document-paper inspection-paper-${['handwritten','typewritten','plain'].includes(entry.style) ? entry.style : 'plain'}`;
    node.textContent = entry.body || '';
  }
  function setTheme() {
    const sheet = document.querySelector('.cabana-sheet');
    const color = sheet && getComputedStyle(sheet).getPropertyValue('--character-accent').trim();
    if (color) $('inspection-player-overlay').style.setProperty('--inspection-accent', color);
  }
  function showDelivery(entry, sound = true) {
    if (!entry || activeId || historyVisible) return;
    activeId = entry.id;
    reading = !!entry.readAt;
    setTheme();
    $('inspection-view-title').textContent = entry.title;
    $('inspection-view-art').innerHTML = entry.image
      ? `<img src="${esc(entry.image)}" alt="Imagem do documento" class="${reading ? '' : 'inspection-floating'}">`
      : '<div class="inspection-no-image">▤</div>';
    setPaper($('inspection-view-paper'), entry);
    $('inspection-view-paper').hidden = !reading;
    $('inspection-view-hint').hidden = reading;
    $('inspection-read').hidden = reading;
    $('inspection-finish').hidden = !reading;
    $('inspection-player-overlay').hidden = false;
    $('inspection-player-overlay').querySelector('.inspection-view-window').classList.remove('inspection-is-reading');
    if (reading) $('inspection-player-overlay').querySelector('.inspection-view-window').classList.add('inspection-is-reading');
    document.body.classList.add('inspection-modal-open');
    if (sound) arrivalChime();
    (reading ? $('inspection-finish') : $('inspection-read')).focus({ preventScroll: true });
  }
  function nextDelivery(sound = false) {
    if (activeId || historyVisible) return;
    const entry = unread()[0];
    if (entry) showDelivery(entry, sound);
  }
  function renderHistory() {
    const slot = $('inspection-history-slot');
    if (!slot) return;
    const count = read().length;
    const waiting = unread().length;
    slot.innerHTML = `
      <header class="inspection-history-head"><div><small>ARQUIVOS / CONSULTA</small><h3>Histórico de leitura</h3></div><span>${String(count).padStart(2, '0')} LIDOS</span></header>
      <div class="inspection-history-list">${count ? read().map(entry => `<button type="button" data-history-id="${esc(entry.id)}"><span>▤</span><strong>${esc(entry.title)}</strong><small>LER TEXTO ›</small></button>`).join('') : '<span class="inspection-empty-history">Nenhum documento lido ainda.</span>'}</div>
      ${waiting ? `<button type="button" id="inspection-open-pending" class="inspection-pending-button">◈ ${waiting} documento(s) aguardando leitura</button>` : ''}
    `;
  }
  function closeHistory() {
    $('inspection-history-overlay').hidden = true;
    historyVisible = false;
    historyId = null;
    if (!activeId) document.body.classList.remove('inspection-modal-open');
    nextDelivery(false);
  }
  function openHistory(entry) {
    if (!entry?.readAt || activeId) return;
    historyVisible = true;
    historyId = entry.id;
    $('inspection-history-title').textContent = entry.title;
    setPaper($('inspection-history-paper'), entry);
    $('inspection-history-overlay').hidden = false;
    document.body.classList.add('inspection-modal-open');
    $('inspection-history-close').focus({ preventScroll: true });
  }
  function readActive() {
    const entry = active(); if (!entry || reading) return;
    reading = true;
    $('inspection-view-art').querySelector('.inspection-floating')?.classList.remove('inspection-floating');
    $('inspection-view-paper').hidden = false;
    $('inspection-view-hint').hidden = true;
    $('inspection-read').hidden = true;
    $('inspection-finish').hidden = false;
    $('inspection-player-overlay').querySelector('.inspection-view-window').classList.add('inspection-is-reading');
    socket.emit('inspection:markRead', { characterId, deliveryId: entry.id });
    $('inspection-finish').focus({ preventScroll: true });
  }
  function finishActive() {
    const entry = active(); if (!entry || !reading) return;
    const completedId = activeId;
    $('inspection-player-overlay').hidden = true;
    activeId = null; reading = false;
    document.body.classList.remove('inspection-modal-open');
    socket.emit('inspection:finish', { characterId, deliveryId: completedId }, (response) => {
      if (!response?.ok) console.warn('Não foi possível confirmar leitura.', response?.error);
    });
    // Aguarda state:update para não reabrir uma entrega que ainda não foi confirmada.
  }
  $('inspection-read').addEventListener('click', readActive);
  $('inspection-finish').addEventListener('click', finishActive);
  $('inspection-history-close').addEventListener('click', closeHistory);
  $('inspection-history-overlay').addEventListener('click', (event) => { if (event.target.dataset.historyClose) closeHistory(); });
  document.getElementById('sheet-root').addEventListener('click', (event) => {
    const historyButton = event.target.closest('[data-history-id]');
    if (historyButton) openHistory(deliveries.find(entry => entry.id === historyButton.dataset.historyId));
    if (event.target.closest('#inspection-open-pending')) nextDelivery(false);
  });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && historyVisible) closeHistory(); });
  window.UNIInspectionPlayer = { refresh: renderHistory };
  socket.on('state:update', (state) => {
    // O catálogo do mestre é a autoridade: entradas sem documento não
    // podem reaparecer no histórico, nem após reconexão ou dados antigos.
    const currentCatalog = new Set((state.inspectionDocuments || []).map(doc => doc.id));
    deliveries = (state.characters?.[characterId]?.inspectionDeliveries || [])
      .filter(entry => currentCatalog.has(entry.documentId));

    // Excluir o documento fecha imediatamente qualquer janela dele que
    // já estava aberta; isso vale tanto para a leitura quanto para o histórico.
    if (activeId && !active()) {
      $('inspection-player-overlay').hidden = true;
      activeId = null;
      reading = false;
      if (!historyVisible) document.body.classList.remove('inspection-modal-open');
    }
    if (historyId && !deliveries.some(entry => entry.id === historyId)) {
      $('inspection-history-overlay').hidden = true;
      historyVisible = false;
      historyId = null;
      if (!activeId) document.body.classList.remove('inspection-modal-open');
    }
    const currentNew = new Set(deliveries.filter(entry => !entry.closedAt).map(entry => entry.id));
    const hasNew = [...currentNew].some(id => !known.has(id));
    const shouldSound = hasLoaded && hasNew;
    known = currentNew;
    hasLoaded = true;
    renderHistory();
    if (!activeId) nextDelivery(shouldSound);
  });
})();
