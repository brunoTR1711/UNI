/* Documentos de inspeção — painel do Mestre. Módulo isolado dos itens. */
(() => {
  'use strict';
  const mount = document.getElementById('inspection-master-mount');
  if (!mount) return;
  const socket = window.nevoaSocket;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const styles = { handwritten: 'Manuscrito', typewritten: 'Datilografado', plain: 'Página impressa' };
  let state = { characters: {}, inspectionDocuments: [] };
  let listSnapshot = '';
  let selected = null;
  let uploadedImage = '';
  let busy = false;

  mount.innerHTML = `
    <header class="vhs-block-head"><small>ARQUIVOS DA CENA</small><h2>Inspeção de documentos</h2></header>
    <p class="inspection-master-help">Envie pistas visuais para as fichas, sem ocupar o inventário.</p>
    <div class="inspection-master-actions"><button type="button" id="inspection-new">+ NOVO DOCUMENTO</button><span id="inspection-doc-count">00 ARQUIVOS</span></div>
    <div id="inspection-master-list" class="inspection-master-list"><small>Nenhum documento cadastrado.</small></div>
  `;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="inspection-editor-overlay" id="inspection-editor" hidden>
      <div class="inspection-overlay-shade" data-inspection-dismiss="true"></div>
      <section class="inspection-editor-window" role="dialog" aria-modal="true" aria-labelledby="inspection-editor-title">
        <header class="inspection-editor-head"><div><small>◉ PAINEL DO MESTRE / ARQUIVOS</small><h2 id="inspection-editor-title">Novo documento</h2></div><button type="button" id="inspection-editor-x" class="inspection-round-close" aria-label="Fechar editor">×</button></header>
        <div class="inspection-editor-main">
          <div class="inspection-edit-fields">
            <label>Nome do documento<input type="text" id="inspection-title" maxlength="110" placeholder="Ex.: Bilhete encontrado no porão"></label>
            <label>Estilo do texto<select id="inspection-style"><option value="handwritten">Manuscrito</option><option value="typewritten">Datilografado</option><option value="plain">Página impressa</option></select></label>
            <label>Conteúdo da leitura<textarea id="inspection-body" maxlength="18000" rows="10" placeholder="17 de outubro...\n\nO aquecedor não para de fazer barulho..."></textarea></label>
            <p class="inspection-hint">Parágrafos, datas, assinaturas e quebras de linha aparecerão da mesma forma na ficha.</p>
            <div class="inspection-text-preview-wrap"><small>PRÉVIA DA LEITURA</small><div id="inspection-master-paper" class="inspection-document-paper inspection-paper-handwritten"></div></div>
          </div>
          <div class="inspection-edit-side">
            <small>IMAGEM DO OBJETO / INSPEÇÃO</small>
            <div class="inspection-image-preview" id="inspection-image-preview"><span>SEM IMAGEM</span></div>
            <label class="inspection-upload-button">↑ ESCOLHER IMAGEM PNG / WEBP / JPG<input id="inspection-image-file" type="file" accept="image/png,image/webp,image/jpeg"></label>
            <small class="inspection-hint">A transparência de imagens PNG é preservada. Arquivos ficam em <code>public/inspection-images/</code> (máx. 6 MB).</small>
            <div class="inspection-recipients"><strong>DESTINATÁRIOS</strong><small>Escolha um ou mais personagens</small><div id="inspection-recipient-list"></div></div>
          </div>
        </div>
        <div class="inspection-editor-foot"><span id="inspection-editor-status" role="status"></span><button type="button" id="inspection-save">SALVAR</button><button type="button" id="inspection-send" class="inspection-primary">SALVAR E ENVIAR</button><button type="button" id="inspection-delete" class="inspection-danger" hidden>EXCLUIR</button></div>
      </section>
    </div>
  `);

  const $ = (id) => document.getElementById(id);
  const overlay = $('inspection-editor');
  const message = (text, error = false) => {
    const status = $('inspection-editor-status');
    status.textContent = text;
    status.classList.toggle('error', error);
  };
  const docs = () => state.inspectionDocuments || [];
  const getDoc = (id) => docs().find((doc) => doc.id === id);
  const chars = () => Object.values(state.characters || {});
  function renderList() {
    $('inspection-doc-count').textContent = `${String(docs().length).padStart(2, '0')} ARQUIVOS`;
    $('inspection-master-list').innerHTML = docs().length ? docs().map(doc => `
      <button class="inspection-master-entry" type="button" data-inspection-id="${esc(doc.id)}">
        <span class="inspection-mini-art">${doc.image ? `<img src="${esc(doc.image)}" alt="">` : '▤'}</span>
        <span><strong>${esc(doc.title)}</strong><small>${styles[doc.style] || 'Página impressa'} · ATRIBUIR / EDITAR</small></span><span class="inspection-entry-chevron">›</span>
      </button>`).join('') : '<div class="inspection-empty">Nenhum documento cadastrado.<br>Crie um arquivo para enviar aos jogadores.</div>';
  }
  function renderRecipients() {
    const chosen = new Set(Array.from($('inspection-recipient-list').querySelectorAll('input:checked'), x => x.value));
    $('inspection-recipient-list').innerHTML = chars().length ? chars().map(char => `
      <label class="inspection-person-check"><input type="checkbox" value="${esc(char.id)}" ${chosen.has(char.id) ? 'checked' : ''}><span>${esc(char.nome || char.id)}</span></label>
    `).join('') : '<small>Crie um personagem primeiro.</small>';
  }
  function updatePaper() {
    const paper = $('inspection-master-paper');
    paper.className = `inspection-document-paper inspection-paper-${$('inspection-style').value}`;
    paper.textContent = $('inspection-body').value || 'Prévia de como o texto será apresentado ao jogador.';
  }
  function renderImagePreview() {
    $('inspection-image-preview').innerHTML = uploadedImage
      ? `<img src="${esc(uploadedImage)}" alt="Prévia do documento">`
      : '<span>SEM IMAGEM</span>';
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
    $('inspection-recipient-list').innerHTML = '';
    renderRecipients();
    renderImagePreview();
    updatePaper();
    message('');
    overlay.hidden = false;
    document.body.classList.add('inspection-modal-open');
    $('inspection-title').focus({ preventScroll: true });
  }
  function closeEditor() {
    if (busy) return;
    overlay.hidden = true;
    document.body.classList.remove('inspection-modal-open');
  }
  async function upload(file) {
    if (!file) return;
    if (!['image/png', 'image/webp', 'image/jpeg'].includes(file.type)) { message('Use PNG, WebP ou JPG.', true); return; }
    if (file.size > 6 * 1024 * 1024) { message('Máximo de 6 MB por imagem.', true); return; }
    busy = true; message('Salvando imagem no servidor...');
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result);
        reader.onerror = reject; reader.readAsDataURL(file);
      });
      const response = await fetch('/api/inspection-images', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw Error(result.error || 'Erro ao salvar imagem.');
      uploadedImage = result.image;
      renderImagePreview();
      message('Imagem enviada. Transparência original preservada.');
    } catch (error) { message(error.message || 'Erro ao enviar imagem.', true); }
    finally { busy = false; }
  }
  function saveAndMaybeSend(send) {
    if (busy) return;
    const title = $('inspection-title').value.trim();
    const body = $('inspection-body').value.trim();
    if (!title || !body) return message('É necessário preencher nome e texto.', true);
    const ids = Array.from($('inspection-recipient-list').querySelectorAll('input:checked'), input => input.value);
    if (send && !ids.length) return message('Selecione ao menos um destinatário.', true);
    busy = true; message(send ? 'Salvando e enviando...' : 'Salvando documento...');
    socket.timeout(10000).emit('inspection:saveDocument', {
      id: selected, title, body, style: $('inspection-style').value, image: uploadedImage
    }, (error, result) => {
      if (error || !result?.ok) { busy = false; return message(result?.error || 'Falha de conexão ao salvar.', true); }
      selected = result.document.id;
      $('inspection-delete').hidden = false;
      $('inspection-editor-title').textContent = `Editar: ${title}`;
      if (!send) { busy = false; message('Documento salvo com sucesso.'); return; }
      socket.timeout(10000).emit('inspection:send', { documentId: selected, characterIds: ids }, (sendError, response) => {
        busy = false;
        if (sendError || !response?.ok) return message(response?.error || 'Falha ao enviar.', true);
        message(`✓ Documento enviado para ${response.count} personagem(ns).`);
      });
    });
  }
  $('inspection-new').addEventListener('click', () => openEditor());
  $('inspection-master-list').addEventListener('click', (event) => {
    const button = event.target.closest('[data-inspection-id]');
    if (button) openEditor(button.dataset.inspectionId);
  });
  $('inspection-editor-x').addEventListener('click', closeEditor);
  overlay.addEventListener('click', (event) => { if (event.target.dataset.inspectionDismiss) closeEditor(); });
  $('inspection-save').addEventListener('click', () => saveAndMaybeSend(false));
  $('inspection-send').addEventListener('click', () => saveAndMaybeSend(true));
  $('inspection-delete').addEventListener('click', () => {
    if (busy || !selected || !confirm('Excluir este documento do catálogo? Documentos já recebidos continuarão no histórico dos jogadores.')) return;
    busy = true;
    socket.timeout(10000).emit('inspection:deleteDocument', { id: selected }, (error, result) => {
      busy = false;
      if (error || !result?.ok) return message(result?.error || 'Não foi possível excluir.', true);
      closeEditor();
    });
  });
  $('inspection-image-file').addEventListener('change', (event) => upload(event.target.files?.[0]));
  $('inspection-body').addEventListener('input', updatePaper);
  $('inspection-style').addEventListener('change', updatePaper);
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !overlay.hidden) closeEditor(); });
  socket.on('state:update', (next) => {
    state = next;
    const snapshot = JSON.stringify([docs().map(({ id, title, image, style }) => ({ id, title, image, style })), chars().map(({ id, nome }) => ({ id, nome }))]);
    if (snapshot !== listSnapshot) {
      listSnapshot = snapshot;
      renderList();
      if (!overlay.hidden) renderRecipients();
    }
  });
})();
