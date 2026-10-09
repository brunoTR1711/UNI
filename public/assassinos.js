const socket = io();
const C = window.NEVOA_ASSASSIN_CATALOG;
const grid = document.getElementById('assassin-grid');
let state = { characters: {}, assassins: {} };
let modalMode = '', modalAssassin = '', modalSlot = 0;
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
const icon = (k) => C.svg[k] || C.svg.skull;

socket.on('state:update', (s) => { state = s; render(); });
document.getElementById('assassin-create-form').addEventListener('submit', (e) => {
  e.preventDefault();
  socket.emit('assassin:create', { id: document.getElementById('assassin-create-id').value, nome: document.getElementById('assassin-create-name').value }, (r) => {
    if (!r?.ok) return alert(r?.error || 'Erro');
    e.target.reset();
  });
});

function optionsCharacters(value = '') {
  const chars = Object.values(state.characters || {});
  return `<option value="">— NENHUM —</option>${chars.map((c) => `<option value="${esc(c.id)}" ${c.id === value ? 'selected' : ''}>${esc(c.nome)}</option>`).join('')}`;
}
function statControl(a, key, label, ico) {
  const value = key === 'bloodlust' ? a.bloodlust.current : a[key];
  return `<section class="killer-stat"><span class="killer-stat-icon">${icon(ico)}</span><div><small>${label}</small><strong>${value}</strong></div><div class="killer-stat-actions"><button data-action="stat" data-id="${a.id}" data-key="${key}" data-value="${value - 1}">−</button><button data-action="stat" data-id="${a.id}" data-key="${key}" data-value="${value + 1}">+</button></div></section>`;
}
function panelButtons(items, type, assassin) {
  return `<div class="show-buttons action-panel-grid">${items.map((item) => `<button class="show-${item.intensity || 'light'}" data-action="${type}" data-id="${assassin.id}" data-key="${esc(item.key)}"><span>${icon(item.icon || 'skull')}</span><strong>${esc(item.nome)}</strong><small>${esc(item.description || item.descricao || '')}</small></button>`).join('')}</div>`;
}
function render() {
  const list = Object.values(state.assassins || {});
  if (!list.length) {
    grid.innerHTML = '<section class="assassin-empty"><h2>NENHUM ASSASSINO CRIADO</h2><p>Crie a primeira ameaça para começar.</p></section>';
    return;
  }
  grid.innerHTML = list.map((a) => {
    const style = C.styles.find((x) => x.key === a.styleKey) || C.styles[0];
    const overlay = `${location.origin}/assassino/overlay/${a.id}`;
    const fx = `${location.origin}/efeitos/${a.id}`;
    const targetName = state.characters?.[a.chase.targetId]?.nome || 'Nenhum alvo';
    return `<article class="assassin-control-card style-${a.styleKey}">
<header class="assassin-card-header"><label class="assassin-portrait-upload">${a.portrait ? `<img src="${a.portrait}">` : `<span>${icon('skull')}</span>`}<input type="file" accept="image/*" data-upload="portrait" data-id="${a.id}"></label><div class="assassin-card-title"><input class="assassin-name-input" data-edit-name="${a.id}" value="${esc(a.nome)}"><strong>${esc(a.styleName)}</strong><small>${esc(a.id)}</small></div><div class="assassin-card-links"><button data-copy="${esc(overlay)}">COPIAR OVERLAY</button><button data-copy="${esc(fx)}">COPIAR FX</button><button data-action="visible" data-id="${a.id}" data-visible="${a.publicVisible}">${a.publicVisible ? 'OCULTAR' : 'MOSTRAR'}</button></div></header>
<section class="assassin-style-row"><div><p class="eyebrow">ESTILO DO ASSASSINO</p><h3>${esc(style.nome)}</h3><p>${esc(style.descricao)}</p></div><button data-action="choose-style" data-id="${a.id}">ALTERAR ESTILO</button></section>
<section class="killer-stats">${statControl(a, 'violencia', 'VIOLÊNCIA', 'violence')}${statControl(a, 'tormento', 'TORMENTO', 'torment')}${statControl(a, 'bloodlust', 'SEDE DE SANGUE', 'bloodlust')}</section>
<section class="assassin-two-col"><div class="assassin-panel"><p class="eyebrow">HABILIDADE ESPECIAL</p>${a.specialAbility ? `<div class="selected-special"><span>${icon(a.specialAbility.icon)}</span><div><h3>${esc(a.specialAbility.nome)}</h3><p>${esc(a.specialAbility.descricao)}</p></div></div>` : '<p class="muted">Nenhuma habilidade escolhida.</p>'}<div class="row-actions"><button data-action="choose-special" data-id="${a.id}">ESCOLHER</button><button data-action="special-used" data-id="${a.id}" data-used="${a.specialUsed}">${a.specialUsed ? 'RECARREGAR' : 'MARCAR COMO USADA'}</button></div></div>
<div class="assassin-panel"><p class="eyebrow">CONTROLE DA CAÇADA</p><div class="chase-grid"><button class="${a.chase.active ? 'active' : ''}" data-action="trigger" data-id="${a.id}" data-event="${a.chase.active ? 'chaseEnd' : 'chaseStart'}">${a.chase.active ? 'ENCERRAR PERSEGUIÇÃO' : 'INICIAR PERSEGUIÇÃO'}</button><label>ALVO<select data-chase="targetId" data-id="${a.id}">${optionsCharacters(a.chase.targetId)}</select></label><label>OBSESSÃO<select data-chase="obsessionId" data-id="${a.id}">${optionsCharacters(a.chase.obsessionId)}</select></label><label>FASE<input type="number" min="1" max="4" value="${a.chase.phase}" data-chase="phase" data-id="${a.id}"></label><label class="toggle"><input type="checkbox" ${a.chase.revealTarget ? 'checked' : ''} data-chase="revealTarget" data-id="${a.id}"> revelar alvo no overlay</label></div></div></section>
<section class="assassin-panel"><p class="eyebrow">VANTAGENS DO ASSASSINO</p><div class="killer-advantages">${a.advantages.map((v, i) => `<button data-action="choose-advantage" data-id="${a.id}" data-slot="${i}"><span>${v ? icon(v.icon) : icon('skull')}</span><div><small>VANTAGEM ${i + 1}</small><strong>${esc(v?.nome || 'ESCOLHER')}</strong><p>${esc(v?.descricao || 'Clique para selecionar uma vantagem.')}</p></div></button>`).join('')}</div></section>
<section class="assassin-panel"><div class="section-heading compact"><div><small>ALVO ATUAL</small><strong>${esc(targetName)}</strong></div></div>${panelButtons(C.effects, 'apply-effect', a)}</section>
<section class="assassin-panel"><div class="section-heading compact"><div><small>AÇÕES VIOLENTAS</small><strong>FERIR E PRESSIONAR</strong></div></div>${panelButtons(C.violentActions, 'violent-action', a)}</section>
<section class="assassin-panel"><div class="section-heading compact"><div><small>ATORMENTAR</small><strong>QUEBRAR A MENTE</strong></div></div>${panelButtons(C.tormentActions, 'torment-action', a)}</section>
<section class="assassin-panel show-panel"><div><p class="eyebrow">COMANDOS DE CENA</p><h3>DISPAROS AUDIOVISUAIS</h3></div><div class="show-buttons">${C.sceneEvents.map((e) => `<button class="show-${e.intensity}" data-action="trigger" data-id="${a.id}" data-event="${e.key}"><span>${icon(e.icon)}</span><strong>${e.label}</strong></button>`).join('')}</div><div class="damage-actions"><button data-action="damage" data-id="${a.id}" data-amount="1">APLICAR DANO LEVE AO ALVO</button><button data-action="damage" data-id="${a.id}" data-amount="2">APLICAR DANO PESADO AO ALVO</button><button class="danger" data-action="execute" data-id="${a.id}">EXECUTAR ALVO</button></div></section>
<footer class="assassin-card-footer"><a href="${overlay}" target="_blank">ABRIR OVERLAY</a><a href="${fx}" target="_blank">ABRIR FX</a><button class="danger" data-action="delete" data-id="${a.id}">EXCLUIR</button></footer></article>`;
  }).join('');
  bind();
}
function bind() {
  document.querySelectorAll('[data-action]').forEach((b) => b.onclick = () => act(b));
  document.querySelectorAll('[data-copy]').forEach((b) => b.onclick = () => navigator.clipboard?.writeText(b.dataset.copy));
  document.querySelectorAll('[data-edit-name]').forEach((i) => i.onchange = () => socket.emit('assassin:updateText', { id: i.dataset.editName, field: 'nome', value: i.value }));
  document.querySelectorAll('[data-chase]').forEach((i) => i.onchange = () => socket.emit('assassin:setChase', { id: i.dataset.id, field: i.dataset.chase, value: i.type === 'checkbox' ? i.checked : i.value }));
  document.querySelectorAll('[data-upload]').forEach((i) => i.onchange = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => socket.emit('assassin:updatePortrait', { id: i.dataset.id, dataUrl: r.result }); r.readAsDataURL(f); });
}
function getTargetId(a) { return a?.chase?.targetId || ''; }
function needTarget(a) { if (!getTargetId(a)) { alert('Escolha um alvo primeiro.'); return false; } return true; }
function act(b) {
  const id = b.dataset.id, a = state.assassins[id];
  switch (b.dataset.action) {
    case 'stat': socket.emit('assassin:setResource', { id, resource: b.dataset.key, value: Number(b.dataset.value) }); break;
    case 'choose-style': openModal('style', id); break;
    case 'choose-special': openModal('special', id); break;
    case 'choose-advantage': openModal('advantage', id, Number(b.dataset.slot)); break;
    case 'special-used': socket.emit('assassin:setSpecialUsed', { id, used: b.dataset.used !== 'true' }); break;
    case 'visible': socket.emit('assassin:setVisible', { id, visible: b.dataset.visible !== 'true' }); break;
    case 'trigger': socket.emit('assassin:triggerScene', { id, eventKey: b.dataset.event, targetCharacterId: getTargetId(a) }); break;
    case 'damage': if (!needTarget(a)) return; socket.emit('assassin:damageTarget', { id, targetCharacterId: a.chase.targetId, amount: Number(b.dataset.amount) }); break;
    case 'execute': if (!needTarget(a)) return; if (confirm('Executar o alvo selecionado?')) socket.emit('assassin:executeTarget', { id, targetCharacterId: a.chase.targetId }); break;
    case 'apply-effect': if (!needTarget(a)) return; { const effect = C.effects.find((x) => x.key === b.dataset.key); socket.emit('assassin:applyEffectToTarget', { id, targetCharacterId: a.chase.targetId, effect: { key: effect.key, nome: effect.nome, descricao: effect.description, icon: effect.icon, intensity: effect.intensity, audio: effect.audio, negative: effect.key !== 'sorte' } }); } break;
    case 'violent-action': if (!needTarget(a) && C.violentActions.find((x) => x.key === b.dataset.key)?.damage) return; { const action = C.violentActions.find((x) => x.key === b.dataset.key); socket.emit('assassin:violentAction', { id, targetCharacterId: a.chase.targetId, action }); } break;
    case 'torment-action': if (!needTarget(a)) return; { const action = C.tormentActions.find((x) => x.key === b.dataset.key); socket.emit('assassin:tormentAction', { id, targetCharacterId: a.chase.targetId, action }); } break;
    case 'delete': if (confirm('Excluir este assassino?')) socket.emit('assassin:delete', { id }); break;
  }
}

const modal = document.getElementById('assassin-modal'), listEl = document.getElementById('assassin-modal-list'), search = document.getElementById('assassin-modal-search');
document.getElementById('assassin-modal-close').onclick = () => modal.classList.add('hidden');
search.oninput = () => drawModal();
function openModal(mode, id, slot = 0) {
  modalMode = mode; modalAssassin = id; modalSlot = slot; search.value = '';
  document.getElementById('assassin-modal-title').textContent = mode === 'style' ? 'ESCOLHA O ESTILO' : mode === 'special' ? 'ESCOLHA A HABILIDADE' : 'ESCOLHA A VANTAGEM';
  modal.classList.remove('hidden'); drawModal();
}
function drawModal() {
  const term = search.value.toLowerCase();
  let items = modalMode === 'style' ? C.styles : modalMode === 'special' ? C.abilities : C.advantages;
  items = items.filter((x) => `${x.nome} ${x.descricao || x.description || ''}`.toLowerCase().includes(term));
  listEl.innerHTML = items.map((x) => `<button class="assassin-picker-item" data-key="${x.key}"><span>${icon(x.icon || 'skull')}</span><div><h3>${esc(x.nome)}</h3>${modalMode === 'style' ? `<small>VIOLÊNCIA ${x.violencia} · TORMENTO ${x.tormento}</small>` : ''}<p>${esc(x.descricao || x.description || '')}</p></div></button>`).join('');
  listEl.querySelectorAll('button').forEach((b, i) => b.onclick = () => {
    const x = items[i];
    if (modalMode === 'style') socket.emit('assassin:setStyle', { id: modalAssassin, styleKey: x.key });
    if (modalMode === 'special') socket.emit('assassin:setSpecial', { id: modalAssassin, ability: x });
    if (modalMode === 'advantage') socket.emit('assassin:setAdvantage', { id: modalAssassin, slotIndex: modalSlot, advantage: x });
    modal.classList.add('hidden');
  });
}
