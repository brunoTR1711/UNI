/* Arquivos de inspeção — editor, envio e apresentação independente para o FX. */
(() => {
  'use strict';
  const mount = document.getElementById('inspection-master-mount');
  if (!mount) return;
  const socket = window.nevoaSocket;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const styles = { handwritten: 'Manuscrito', typewritten: 'Datilografado', plain: 'Página impressa' };
  const $ = id => document.getElementById(id);
  let state = { characters: {}, inspectionDocuments: [] };
  let listSnapshot = '', selected = null, sendingId = null, uploadedImage = '', busy = false;
  let currentPresentation = null;
  let lastPresentationRevision = 0;
  let deferredOwnPresentation = null;

  mount.innerHTML = `
    <header class="vhs-block-head"><small>ARQUIVOS DA CENA</small><h2>Inspeção de documentos</h2></header>
    <p class="inspection-master-help">Prepare os arquivos, envie para os jogadores e apresente as pistas na transmissão.</p>
    <div class="inspection-master-actions"><button type="button" id="inspection-new">+ NOVO DOCUMENTO</button><span id="inspection-doc-count">00 ARQUIVOS</span></div>
    <div id="inspection-master-list" class="inspection-master-list"><small>Nenhum documento cadastrado.</small></div>`;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="inspection-editor-overlay" id="inspection-editor" hidden>
      <div class="inspection-overlay-shade" data-inspection-editor-dismiss="true"></div>
      <section class="inspection-editor-window" role="dialog" aria-modal="true" aria-labelledby="inspection-editor-title">
        <header class="inspection-editor-head"><div><small>◉ PAINEL DO MESTRE / ARQUIVOS</small><h2 id="inspection-editor-title">Novo documento</h2></div><button type="button" id="inspection-editor-x" class="inspection-round-close" aria-label="Cancelar">×</button></header>
        <div class="inspection-editor-main">
          <div class="inspection-edit-fields">
            <label>Nome do documento<input type="text" id="inspection-title" maxlength="110" placeholder="Ex.: Bilhete encontrado no porão"></label>
            <label>Estilo do texto<select id="inspection-style"><option value="handwritten">Manuscrito</option><option value="typewritten">Datilografado</option><option value="plain">Página impressa</option></select></label>
            <label>Conteúdo da leitura<textarea id="inspection-body" maxlength="18000" rows="10" placeholder="17 de outubro...\n\nO aquecedor não para de fazer barulho..."></textarea></label>
            <p class="inspection-hint">Quebras de linha, datas e assinaturas serão mantidas na leitura.</p>
            <div class="inspection-text-preview-wrap"><small>PRÉVIA DA LEITURA</small><div id="inspection-master-paper" class="inspection-document-paper inspection-paper-handwritten"></div></div>
          </div>
          <div class="inspection-edit-side">
            <small>IMAGEM DO OBJETO / INSPEÇÃO</small>
            <div class="inspection-image-preview" id="inspection-image-preview"><span>SEM IMAGEM</span></div>
            <label class="inspection-upload-button">↑ ESCOLHER IMAGEM PNG / WEBP / JPG<input id="inspection-image-file" type="file" accept="image/png,image/webp,image/jpeg"></label>
            <small class="inspection-hint">A transparência PNG é preservada. Arquivos em <code>public/inspection-images/</code> (máx. 6 MB).</small>
          </div>
        </div>
        <div class="inspection-editor-foot"><span id="inspection-editor-status" role="status"></span><button id="inspection-cancel" type="button">CANCELAR</button><button type="button" id="inspection-save" class="inspection-primary">SALVAR</button><button type="button" id="inspection-delete" class="inspection-danger" hidden>EXCLUIR</button></div>
      </section>
    </div>
    <div class="inspection-editor-overlay" id="inspection-send-overlay" hidden>
      <div class="inspection-overlay-shade" data-inspection-send-dismiss="true"></div>
      <section class="inspection-editor-window inspection-send-window" role="dialog" aria-modal="true" aria-labelledby="inspection-send-title">
        <header class="inspection-editor-head"><div><small>◉ PAINEL DO MESTRE / DESTINATÁRIOS</small><h2 id="inspection-send-title">Enviar documento</h2></div><button type="button" id="inspection-send-x" class="inspection-round-close" aria-label="Cancelar envio">×</button></header>
        <div class="inspection-send-body">
          <p class="inspection-hint">Selecione quais personagens receberão o arquivo. A sua apresentação será exibida no FX em tempo real.</p>
          <div id="inspection-recipient-list" class="inspection-send-recipients"></div>
        </div>
        <div class="inspection-editor-foot"><span id="inspection-send-status" role="status"></span><button id="inspection-send-cancel" type="button">CANCELAR</button><button id="inspection-send" type="button" class="inspection-primary">ENVIAR</button></div>
      </section>
    </div>
    <div class="inspection-player-overlay inspection-master-presentation" id="inspection-master-presentation" hidden>
      <div class="inspection-overlay-shade"></div>
      <section class="inspection-view-window" role="dialog" aria-modal="true" aria-labelledby="inspection-master-view-title">
        <header class="inspection-view-head"><div><small>◈ APRESENTAÇÃO / ESPELHO DO FX</small><h2 id="inspection-master-view-title"></h2></div><span>AO VIVO NA STREAM</span></header>
        <div class="inspection-view-content"><div id="inspection-master-view-art" class="inspection-view-art"></div><article id="inspection-master-view-paper" class="inspection-document-paper" hidden></article><small id="inspection-master-view-hint" class="inspection-hint">Clique em LER para revelar o texto ao público.</small></div>
        <footer class="inspection-view-foot"><button id="inspection-master-read" type="button" class="inspection-primary">LER</button><button id="inspection-master-close" type="button">FECHAR</button></footer>
      </section>
    </div>`);

  const docs = () => state.inspectionDocuments || [];
  const getDoc = id => docs().find(doc => doc.id === id);
  const chars = () => Object.values(state.characters || {});
  function modalLock() {
    document.body.classList.toggle('inspection-modal-open',
      !$('inspection-editor').hidden || !$('inspection-send-overlay').hidden || !$('inspection-master-presentation').hidden);
  }
  function message(text, error = false, id = 'inspection-editor-status') {
    $(id).textContent = text;
    $(id).classList.toggle('error', error);
  }
  function renderList() {
    $('inspection-doc-count').textContent = `${String(docs().length).padStart(2, '0')} ARQUIVOS`;
    $('inspection-master-list').innerHTML = docs().length ? docs().map(doc => `
      <div class="inspection-master-entry" data-inspection-id="${esc(doc.id)}">
        <span class="inspection-mini-art">${doc.image ? `<img src="${esc(doc.image)}" alt="">` : '▤'}</span>
        <div class="inspection-entry-details"><strong>${esc(doc.title)}</strong><small>${styles[doc.style] || 'Página impressa'}</small></div>
        <div class="inspection-entry-actions"><button type="button" data-inspection-edit="${esc(doc.id)}">EDITAR</button><button type="button" class="inspection-primary" data-inspection-send="${esc(doc.id)}">ENVIAR</button></div>
      </div>`).join('') : '<div class="inspection-empty">Nenhum documento cadastrado.<br>Crie um arquivo para enviar aos jogadores.</div>';
  }
  function renderRecipients() {
    const chosen = new Set(Array.from($('inspection-recipient-list').querySelectorAll('input:checked'), x => x.value));
    $('inspection-recipient-list').innerHTML = chars().length ? chars().map(char => `
      <label class="inspection-person-check"><input type="checkbox" value="${esc(char.id)}" ${chosen.has(char.id) ? 'checked' : ''}><span>${esc(char.nome || char.id)}</span></label>
    `).join('') : '<small>Nenhum personagem cadastrado.</small>';
  }
  function updatePaper() {
    const paper = $('inspection-master-paper');
    paper.className = `inspection-document-paper inspection-paper-${$('inspection-style').value}`;
    paper.textContent = $('inspection-body').value || 'Prévia de como o texto será apresentado ao jogador.';
  }
  function renderImagePreview() {
    $('inspection-image-preview').innerHTML = uploadedImage
      ? `<img src="${esc(uploadedImage)}" alt="Prévia do documento">` : '<span>SEM IMAGEM</span>';
  }
  function openEditor(id = null) {
    selected = id;
    const doc = id ? getDoc(id) : null;
    uploadedImage = doc?.image || '';
    $('inspection-title').value = doc?.title || '';
    $('inspection-style').value = doc?.style || 'handwritten';
    $('inspection-body').value = doc?.body || '';
    $('inspection-editor-title').textContent = doc ? `Editar: ${doc.title}` : 'Novo documento';
    $('inspection-delete').hidden = !doc;
    $('inspection-image-file').value = '';
    renderImagePreview(); updatePaper(); message('');
    $('inspection-editor').hidden = false; modalLock();
    $('inspection-title').focus({ preventScroll: true });
  }
  function closeEditor() {
    if (busy) return;
    $('inspection-editor').hidden = true; modalLock();
  }
  function openSend(id) {
    const doc = getDoc(id);
    if (!doc) return;
    sendingId = doc.id;
    $('inspection-send-title').textContent = `Enviar: ${doc.title}`;
    $('inspection-recipient-list').innerHTML = '';
    renderRecipients();
    message('', false, 'inspection-send-status');
    $('inspection-send-overlay').hidden = false; modalLock();
    $('inspection-recipient-list').querySelector('input')?.focus({ preventScroll: true });
  }
  function closeSend() {
    if (busy) return;
    sendingId = null;
    $('inspection-send-overlay').hidden = true; modalLock();
  }
  async function upload(file) {
    if (!file) return;
    if (!['image/png','image/webp','image/jpeg'].includes(file.type)) return message('Use PNG, WebP ou JPG.', true);
    if (file.size > 6 * 1024 * 1024) return message('Máximo de 6 MB por imagem.', true);
    busy = true; message('Salvando imagem no servidor...');
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result);
        reader.onerror = reject; reader.readAsDataURL(file);
      });
      const response = await fetch('/api/inspection-images', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw Error(result.error || 'Erro ao salvar imagem.');
      uploadedImage = result.image; renderImagePreview();
      message('Imagem enviada. Transparência preservada.');
    } catch (error) { message(error.message || 'Erro ao enviar imagem.', true); }
    finally { busy = false; }
  }
  function save() {
    if (busy) return;
    const title = $('inspection-title').value.trim();
    const body = $('inspection-body').value.trim();
    if (!title || !body) return message('É necessário preencher nome e texto.', true);
    busy = true; message('Salvando documento...');
    socket.timeout(10000).emit('inspection:saveDocument', {
      id: selected, title, body, style: $('inspection-style').value, image: uploadedImage
    }, (error, response) => {
      busy = false;
      if (error || !response?.ok) return message(response?.error || 'Falha de conexão ao salvar.', true);
      closeEditor();
    });
  }
  function send() {
    if (busy || !sendingId) return;
    const ids = Array.from($('inspection-recipient-list').querySelectorAll('input:checked'), x => x.value);
    if (!ids.length) return message('Selecione ao menos um destinatário.', true, 'inspection-send-status');
    busy = true; message('Enviando documento...', false, 'inspection-send-status');
    socket.timeout(12000).emit('inspection:send', { documentId: sendingId, characterIds: ids }, (error, response) => {
      busy = false;
      if (error || !response?.ok) return message(response?.error || 'Falha ao enviar.', true, 'inspection-send-status');
      closeSend();
      if (response.presentation) applyPresentation(response.presentation);
      if (deferredOwnPresentation) { applyPresentation(deferredOwnPresentation); deferredOwnPresentation = null; }
    });
  }
  function setPaper(node, entry) {
    node.className = `inspection-document-paper inspection-paper-${styles[entry.style] ? entry.style : 'plain'}`;
    node.textContent = entry.body || '';
  }
  function applyPresentation(presentation, revision) {
    if (!presentation || Number(presentation.revision) < lastPresentationRevision) return;
    lastPresentationRevision = Number(presentation.revision) || lastPresentationRevision;
    currentPresentation = presentation;
    $('inspection-master-view-title').textContent = presentation.title;
    const art = $('inspection-master-view-art');
    art.innerHTML = presentation.image
      ? `<img src="${esc(presentation.image)}" alt="Imagem do documento" class="${presentation.reading ? '' : 'inspection-floating'}">`
      : '<div class="inspection-no-image">▤</div>';
    setPaper($('inspection-master-view-paper'), presentation);
    $('inspection-master-view-paper').hidden = !presentation.reading;
    $('inspection-master-view-hint').hidden = !!presentation.reading;
    $('inspection-master-read').hidden = !!presentation.reading;
    $('inspection-master-presentation').querySelector('.inspection-view-window').classList.toggle('inspection-is-reading', !!presentation.reading);
    $('inspection-master-presentation').hidden = false;
    modalLock();
    (presentation.reading ? $('inspection-master-close') : $('inspection-master-read')).focus({ preventScroll: true });
  }
  function hidePresentation(revision) {
    if (revision && Number(revision) < lastPresentationRevision) return;
    if (revision) lastPresentationRevision = Number(revision);
    currentPresentation = null;
    $('inspection-master-presentation').hidden = true; modalLock();
  }
  function presentationAction(action) {
    if (!currentPresentation) return;
    const id = currentPresentation.id;
    socket.timeout(10000).emit('inspection:presentationAction', { id, action }, (error, response) => {
      if (error || !response?.ok) console.warn('Não foi possível controlar a apresentação.', response?.error);
    });
  }

  $('inspection-new').addEventListener('click', () => openEditor());
  $('inspection-master-list').addEventListener('click', event => {
    const edit = event.target.closest('[data-inspection-edit]');
    const sendButton = event.target.closest('[data-inspection-send]');
    if (edit) openEditor(edit.dataset.inspectionEdit);
    if (sendButton) openSend(sendButton.dataset.inspectionSend);
  });
  $('inspection-editor-x').addEventListener('click', closeEditor);
  $('inspection-cancel').addEventListener('click', closeEditor);
  $('inspection-editor').addEventListener('click', event => { if (event.target.dataset.inspectionEditorDismiss) closeEditor(); });
  $('inspection-save').addEventListener('click', save);
  $('inspection-delete').addEventListener('click', () => {
    if (busy || !selected || !confirm('Excluir este documento? Ele também será removido do histórico e das leituras pendentes de todos os jogadores.')) return;
    busy = true;
    socket.timeout(10000).emit('inspection:deleteDocument', { id: selected }, (error, result) => {
      busy = false;
      if (error || !result?.ok) return message(result?.error || 'Não foi possível excluir.', true);
      closeEditor();
    });
  });
  $('inspection-send-x').addEventListener('click', closeSend);
  $('inspection-send-cancel').addEventListener('click', closeSend);
  $('inspection-send-overlay').addEventListener('click', event => { if (event.target.dataset.inspectionSendDismiss) closeSend(); });
  $('inspection-send').addEventListener('click', send);
  $('inspection-master-read').addEventListener('click', () => presentationAction('read'));
  $('inspection-master-close').addEventListener('click', () => presentationAction('close'));
  $('inspection-image-file').addEventListener('change', event => upload(event.target.files?.[0]));
  $('inspection-body').addEventListener('input', updatePaper);
  $('inspection-style').addEventListener('change', updatePaper);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!$('inspection-send-overlay').hidden) closeSend();
    else if (!$('inspection-editor').hidden) closeEditor();
  });
  socket.on('inspection:presentation', event => {
    if (event.action === 'close') return hidePresentation(event.revision);
    if (!event.presentation) return;
    if (event.action === 'open' && event.presenterSocketId === socket.id && !$('inspection-send-overlay').hidden) {
      deferredOwnPresentation = event.presentation; return;
    }
    applyPresentation(event.presentation);
  });
  socket.on('state:update', next => {
    state = next;
    const snapshot = JSON.stringify([docs().map(({id,title,image,style}) => ({id,title,image,style})),chars().map(({id,nome}) => ({id,nome}))]);
    if (snapshot !== listSnapshot) {
      listSnapshot = snapshot; renderList();
      if (!$('inspection-send-overlay').hidden) renderRecipients();
    }
    // Retoma uma apresentação ativa caso o mestre recarregue a página.
    if (!currentPresentation && !$('inspection-send-overlay').hidden) return;
    if (next.inspectionPresentation && Number(next.inspectionPresentation.revision) > lastPresentationRevision)
      applyPresentation(next.inspectionPresentation);
    else if (!next.inspectionPresentation && currentPresentation && Number(next.inspectionPresentationRevision) > lastPresentationRevision)
      hidePresentation(next.inspectionPresentationRevision);
  });
})();
