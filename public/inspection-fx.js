/* Camada de inspeção para OBS: espelho somente-leitura dos comandos do mestre. */
(() => {
  'use strict';
  if (!location.pathname.startsWith('/efeitos')) return;
  const socket = window.nevoaSocket || (window.nevoaSocket = io({ autoConnect: false }));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let active = null;
  let revision = 0;
  document.body.insertAdjacentHTML('beforeend', `
    <div id="inspection-fx-presentation" class="inspection-fx-presentation" hidden aria-hidden="true">
      <section class="inspection-view-window">
        <header class="inspection-view-head"><div><small>◈ ARQUIVO ENCONTRADO</small><h2 id="inspection-fx-title"></h2></div><span>INSPEÇÃO</span></header>
        <div class="inspection-view-content"><div class="inspection-view-art" id="inspection-fx-art"></div><article id="inspection-fx-paper" class="inspection-document-paper" hidden></article><small id="inspection-fx-hint" class="inspection-hint">Clique em LER para consultar o conteúdo.</small></div>
        <footer class="inspection-view-foot"><span id="inspection-fx-read-label" class="inspection-fx-button inspection-primary">LER</span><span id="inspection-fx-close-label" class="inspection-fx-button" hidden>FECHAR</span></footer>
      </section>
    </div>`);
  const $ = id => document.getElementById(id);
  const node = $('inspection-fx-presentation');
  const windowNode = node.querySelector('.inspection-view-window');
  function render(presentation) {
    if (!presentation || Number(presentation.revision) < revision) return;
    revision = Number(presentation.revision) || revision;
    // Recriar o conteúdo somente na abertura; ao ler, preserva a posição da imagem.
    const changed = !active || active.id !== presentation.id;
    active = presentation;
    if (changed) {
      $('inspection-fx-title').textContent = presentation.title;
      $('inspection-fx-art').innerHTML = presentation.image
        ? `<img src="${esc(presentation.image)}" alt="" class="inspection-floating">` : '<div class="inspection-no-image">▤</div>';
      $('inspection-fx-paper').className = `inspection-document-paper inspection-paper-${['handwritten','typewritten','plain'].includes(presentation.style) ? presentation.style : 'plain'}`;
      $('inspection-fx-paper').textContent = presentation.body || '';
    }
    $('inspection-fx-art').querySelector('img')?.classList.toggle('inspection-floating', !presentation.reading);
    $('inspection-fx-paper').hidden = !presentation.reading;
    $('inspection-fx-hint').hidden = !!presentation.reading;
    $('inspection-fx-read-label').hidden = !!presentation.reading;
    $('inspection-fx-close-label').hidden = false;
    windowNode.classList.toggle('inspection-is-reading', !!presentation.reading);
    node.hidden = false;
    document.body.classList.add('inspection-fx-active');
  }
  function close(nextRevision) {
    if (Number(nextRevision) && Number(nextRevision) < revision) return;
    revision = Number(nextRevision) || revision;
    active = null;
    node.hidden = true;
    document.body.classList.remove('inspection-fx-active');
  }
  socket.on('inspection:presentation', event => {
    if (!event) return;
    if (event.action === 'close') close(event.revision);
    else render(event.presentation);
  });
  socket.on('state:update', state => {
    if (state.inspectionPresentation && Number(state.inspectionPresentation.revision) > revision)
      render(state.inspectionPresentation);
    else if (!state.inspectionPresentation && active && Number(state.inspectionPresentationRevision) > revision)
      close(state.inspectionPresentationRevision);
  });
})();
