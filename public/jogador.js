const socket = io();
const Common = window.NevoaCommon;
const CAT = window.NEVOA_PLAYER_CATALOG;
const {
  escapeHtml,
  getCharacterIdFromPath,
  getConditionPortrait,
  makeStateMarks,
  makeEditableText,
  makeResource,
  formatCondition,
  themeStyle,
  makeThemePicker,
  makeStatusBadge,
  RESOURCE_ICON,
  RESOURCE_LABELS
} = Common;

const id = getCharacterIdFromPath();
const root = document.getElementById("sheet-root");
const portraitModal = document.getElementById("portrait-modal");
const portraitGrid = document.getElementById("portrait-upload-grid");
const itemModal = document.getElementById("item-modal");
const itemList = document.getElementById("item-list");
const itemSearch = document.getElementById("item-search");
const advantageModal = document.getElementById("advantage-modal");
const advantageList = document.getElementById("advantage-list");
const advantageSearch = document.getElementById("advantage-search");
const styleModal = document.getElementById("style-modal");
const styleList = document.getElementById("style-list");

let state = null;
let character = null;
let previousCondition = null;
let previousStacks = {};
let previousItemCharges = new Map();
let currentItemSlot = 0;
let currentAdvantageSlot = 0;
const diceTimers = new Map();
const diceLocalTimings = new Map();
const diceServerFrames = new Map();
const CLIENT_DICE_ANIMATION_MS = 3000;
const CLIENT_DICE_VISIBLE_MS = 11000;
function makeClientRollKey(characterId, resource, roll) {
  return roll?.id || roll?.key || `${characterId || "local"}:${resource || "roll"}:${roll?.at || 0}:${roll?.value || 0}`;
}
function getClientRollTiming(key) {
  let timing = diceLocalTimings.get(key);
  if (!timing) {
    const now = performance.now();
    timing = { startedAt: now, revealAt: now + CLIENT_DICE_ANIMATION_MS, hideAt: now + CLIENT_DICE_VISIBLE_MS };
    diceLocalTimings.set(key, timing);
  }
  return timing;
}
function primeClientRollTiming(key) {
  const now = performance.now();
  diceLocalTimings.set(key, { startedAt: now, revealAt: now + CLIENT_DICE_ANIMATION_MS, hideAt: now + CLIENT_DICE_VISIBLE_MS });
}
function isClientRollRolling(key) {
  return performance.now() < getClientRollTiming(key).revealAt;
}
function isClientRollVisible(key) {
  return performance.now() < getClientRollTiming(key).hideAt;
}
function getDiceDisplayValue(key, finalValue) {
  const frame = diceServerFrames.get(key);
  if (frame && !frame.final) return String(frame.value);
  if (frame && frame.final) return String(finalValue);
  return isClientRollRolling(key) ? String(Math.floor(Math.random() * 20) + 1) : String(finalValue);
}
function setDiceTargetState(target, value, final = false) {
  target.textContent = String(value);
  const d20Display = target.closest('.sheet-d20-display');
  const popup = target.closest('.vhs-roll-popup-d20');
  const container = popup || d20Display;
  const label = container?.querySelector('em');
  if (final) {
    target.classList.remove('dice-rolling');
    target.classList.add('dice-revealed');
    container?.classList.remove('rolling');
    if (label) label.textContent = 'RESULTADO';
    setTimeout(() => target.classList.remove('dice-revealed'), 620);
  } else {
    target.classList.add('dice-rolling');
    target.classList.remove('dice-revealed');
    container?.classList.add('rolling');
    if (label) label.textContent = 'ROLANDO';
  }
}
function applyDiceServerFrame(key, value, final = false) {
  if (!key || !Number.isFinite(Number(value))) return;
  diceServerFrames.set(key, { value: Number(value), final: !!final });
  document.querySelectorAll(`.dice-result[data-client-roll-key="${key}"]`).forEach((target) => {
    setDiceTargetState(target, Number(value), !!final);
  });
}
const isTouchDevice = window.matchMedia?.("(pointer: coarse)")?.matches || false;

socket.emit("character:create", { id });
socket.on("state:update", (incoming) => {
  primeRollsFromState(incoming);
  state = incoming;
  character = state.characters[id];
  render();
});

function activateIncomingRoll(characterId, resource, roll, key) {
  if (characterId !== id) return;
  if (state?.characters?.[id]?.resources?.[resource]) {
    state.characters[id].resources[resource].lastRoll = roll;
    character = state.characters[id];
    render();
    requestAnimationFrame(() => applyDiceServerFrame(key, Math.floor(Math.random() * 20) + 1, false));
  }
}

socket.on("dice:roll", ({ characterId, resource, roll, key: eventKey }) => {
  if (!roll) return;
  const key = eventKey || makeClientRollKey(characterId, resource, roll);
  primeClientRollTiming(key);
  diceServerFrames.set(key, { value: Math.floor(Math.random() * 20) + 1, final: false });
  activateIncomingRoll(characterId, resource, roll, key);
  setTimeout(() => applyDiceServerFrame(key, roll.value, true), CLIENT_DICE_ANIMATION_MS + 120);
});
socket.on("dice:frame", ({ key, rollId, value, final }) => {
  applyDiceServerFrame(key || rollId, Number(value), !!final);
});
socket.on("dice:reveal", ({ key, rollId, value }) => {
  applyDiceServerFrame(key || rollId, Number(value), true);
});

function primeRollsFromState(incomingState) {
  Object.values(incomingState?.characters || {}).forEach((entry) => {
    ["cooperacao", "folego", "foco"].forEach((resource) => {
      const roll = entry?.resources?.[resource]?.lastRoll;
      if (!roll?.at || !roll?.value) return;
      const key = makeClientRollKey(entry.id, resource, roll);
      if (!diceLocalTimings.has(key)) primeClientRollTiming(key);
    });
  });
}

function svg(key) {
  return CAT.svg[key] || CAT.svg.star || "";
}
function conditionForMarks(marks) {
  if (marks <= 0) return "saudavel";
  if (marks === 1) return "ferido";
  if (marks === 2) return "machucado";
  return "morrendo";
}
function playConditionSound(condition) {
  window.NevoaAudio?.unlock();
  window.NevoaAudio?.playState(condition, condition === "morto" ? 0.8 : 0.7);
}
function stackChange(resource, currentStacks) {
  if (!Object.prototype.hasOwnProperty.call(previousStacks, resource)) return { changedIndex: null, changeType: "" };
  const previous = previousStacks[resource];
  if (currentStacks > previous) return { changedIndex: currentStacks - 1, changeType: "gained" };
  if (currentStacks < previous) return { changedIndex: previous - 1, changeType: "lost" };
  return { changedIndex: null, changeType: "" };
}
function playStackSound(type) {
  if (!type) return;
  window.NevoaAudio?.unlock();
  window.NevoaAudio?.play(type, 0.64);
}

function renderStyleStats(style) {
  const stats = style?.stats || { cooperacao: 0, folego: 0, foco: 0 };
  return `<div class="style-stat-row">
    <span>${RESOURCE_ICON.cooperacao} ${Number(stats.cooperacao || 0)}</span>
    <span>${RESOURCE_ICON.folego} ${Number(stats.folego || 0)}</span>
    <span>${RESOURCE_ICON.foco} ${Number(stats.foco || 0)}</span>
  </div>`;
}
function getCurrentStyleProfile() {
  return CAT.styles.find((entry) => entry.key === character?.styleKey) || null;
}

function conditionSummary(condition) {
  const summaries = {
    saudavel: 'Sem penalidades imediatas.',
    ferido: 'Você sofreu dano, mas ainda consegue reagir.',
    machucado: 'Você está em risco e precisa agir com cuidado.',
    morrendo: 'À beira da morte. Se não escapar, declare morto.',
    morto: 'O personagem morreu.'
  };
  return summaries[condition] || '';
}
function getLatestRollData() {
  const rolls = ['cooperacao', 'folego', 'foco']
    .map((resource) => ({ resource, roll: character?.resources?.[resource]?.lastRoll }))
    .filter((entry) => entry.roll && entry.roll.at)
    .sort((a, b) => (b.roll.at || 0) - (a.roll.at || 0));
  return rolls[0] || null;
}
function renderStyleInline() {
  const style = getCurrentStyleProfile();
  return `
    <button type="button" class="vhs-style-inline ${style ? 'selected' : 'empty'}" data-action="open-style">
      <small>ESTILO</small>
      <strong>${escapeHtml(style?.nome || 'ESCOLHER ESTILO')}</strong>
      <span>${escapeHtml(style?.descricao || 'Abra a lista de estilos disponíveis para escolher o papel deste personagem.')}</span>
      ${style ? `<div class="vhs-style-inline-stats">${renderStyleStats(style)}</div>` : ''}
    </button>
  `;
}
function renderAdvantagesSummary() {
  const advantages = Array.isArray(character.vantagens) ? character.vantagens : [null, null, null, null];
  return `
    <section class="vhs-card vhs-advantages-panel">
      <header class="vhs-panel-head"><h3>Lista de Vantagens</h3><small>Até 4 vantagens</small></header>
      <div class="vhs-adv-list">
        ${Array.from({ length: 4 }, (_, slot) => {
          const advantage = advantages[slot];
          if (!advantage) {
            return `<button type="button" class="vhs-adv-row empty" data-action="select-advantage" data-slot="${slot}">
              <span class="vhs-cell-icon">${svg('star')}</span>
              <div><strong>Escolher vantagem</strong><p>Abra a lista e selecione um diferencial para este personagem.</p></div>
            </button>`;
          }
          return `<button type="button" class="vhs-adv-row" data-action="select-advantage" data-slot="${slot}">
            <span class="vhs-cell-icon">${svg(advantage.icon)}</span>
            <div>
              <strong>${escapeHtml(advantage.nome)}</strong>
              <p>${escapeHtml(advantage.descricao || '')}</p>
            </div>
          </button>`;
        }).join('')}
      </div>
    </section>
  `;
}
function renderEffectsBoard() {
  const effects = Array.isArray(character.effects) ? character.effects : [];
  return `
    <section class="vhs-card vhs-effects-panel">
      <header class="vhs-panel-head"><h3>Efeitos</h3><small>${effects.length ? `${effects.length} ativo(s)` : 'Nenhum efeito'}</small></header>
      <div class="vhs-effect-list ${effects.length ? '' : 'empty'}">
        ${effects.length ? effects.map((effect) => `
          <article class="vhs-effect-row ${effect.negative === false ? 'positive' : 'negative'}">
            <span class="vhs-cell-icon">${svg(effect.icon)}</span>
            <div>
              <strong>${escapeHtml(effect.nome)}</strong>
              <p>${escapeHtml(effect.descricao || '')}</p>
            </div>
            <button type="button" class="vhs-remove-mini" data-action="remove-effect" data-effect="${escapeHtml(effect.key)}">×</button>
          </article>
        `).join('') : `<p class="vhs-empty-copy">Sem efeitos ativos no momento.</p>`}
      </div>
    </section>
  `;
}
function getPlayerNotes() {
  try {
    return localStorage.getItem(`nevoa:notes:${id}`) || '';
  } catch (error) {
    return '';
  }
}
function renderNotesBoard() {
  return `
    <section class="vhs-card vhs-notes-panel">
      <header class="vhs-panel-head"><h3>Anotações</h3><small>Salvamento automático</small></header>
      <textarea id="player-notes" class="vhs-notes-area" placeholder="Anote pistas, suspeitas, códigos, objetos, ordem dos acontecimentos...">${escapeHtml(getPlayerNotes())}</textarea>
    </section>
  `;
}
function renderItemsCompact() {
  const items = Array.isArray(character.items) ? character.items : [];
  return `
    <section class="vhs-card vhs-items-panel">
      <header class="vhs-panel-head"><h3>Itens</h3><small>Até 5 itens</small></header>
      <div class="vhs-items-grid">
        ${Array.from({ length: 5 }, (_, slot) => {
          const item = items[slot];
          if (!item) {
            return `<article class="vhs-item-card empty"><button type="button" data-action="open-item" data-slot="${slot}"><span>+</span><small>ITEM ${slot + 1}</small><strong>Vazio</strong></button></article>`;
          }
          const previous = previousItemCharges.get(slot);
          let changedIndex = null;
          let changeType = '';
          if (Number.isInteger(previous)) {
            if (item.charges > previous) { changedIndex = item.charges - 1; changeType = 'gained'; }
            if (item.charges < previous) { changedIndex = previous - 1; changeType = 'lost'; }
          }
          return `<article class="vhs-item-card">
            <button type="button" class="vhs-item-head" data-action="open-item" data-slot="${slot}">
              <span class="vhs-cell-icon">${svg(item.icon)}</span>
              <div><small>${escapeHtml(item.categoria ? item.categoria.toUpperCase() : `ITEM ${slot + 1}`)}</small><strong>${escapeHtml(item.nome)}</strong></div>
            </button>
            <p>${escapeHtml(item.descricao || '')}</p>
            ${item.max > 0 ? `<div class="vhs-item-charges">${Array.from({ length: item.max }, (_, index) => `<button class="item-drop item-drop--small ${index < item.charges ? 'filled' : ''} ${index === changedIndex && changeType ? `stack-${changeType}` : ''}" type="button" data-action="set-item-charges" data-slot="${slot}" data-charges="${index + 1 === item.charges ? index : index + 1}"></button>`).join('')}</div>` : '<small class="item-no-charges">Sem cargas</small>'}
            <div class="vhs-item-actions"><button type="button" data-action="open-item" data-slot="${slot}">Trocar</button><button type="button" data-action="remove-item" data-slot="${slot}">Remover</button></div>
          </article>`;
        }).join('')}
      </div>
    </section>
  `;
}
function renderLatestRollPanel() {
  const latest = getLatestRollData();
  if (!latest) {
    return `<section class="vhs-card vhs-roll-panel empty"><header class="vhs-panel-head"><h3>Rolagem</h3><small>1d20</small></header><div class="sheet-d20-display idle"><img src="/context_assets/result-display-d20.png" alt=""><div class="sheet-d20-content"><span class="sheet-d20-icon">${RESOURCE_ICON.foco}</span><strong>—</strong><em>SEM ROLAGEM</em></div></div></section>`;
  }
  const roll = latest.roll;
  const rollKey = makeClientRollKey(id, latest.resource, roll);
  const isRolling = isClientRollRolling(rollKey);
  const visibleValue = getDiceDisplayValue(rollKey, roll.value);
  return `<section class="vhs-card vhs-roll-panel"><header class="vhs-panel-head"><h3>Rolagem</h3><small>1d20</small></header><div class="sheet-d20-display ${isRolling ? 'rolling' : ''}"><img src="/context_assets/result-display-d20.png" alt=""><div class="sheet-d20-content"><span class="sheet-d20-icon">${RESOURCE_ICON[latest.resource]}</span><strong class="dice-result" data-client-roll-key="${escapeHtml(rollKey)}" data-roll-at="${roll.at}" data-reveal-at="${roll.revealAt || roll.at}" data-final-value="${roll.value}">${visibleValue}</strong><em>${isRolling ? 'ROLANDO' : 'RESULTADO'}</em></div></div></section>`;
}
function renderAttributeStatePanel() {
  return `
    <section class="vhs-card vhs-bottom-left">
      <div class="vhs-bottom-columns">
        <div class="vhs-attributes-area">
          <header class="vhs-panel-head compact"><h3>Atributos</h3></header>
          <div class="vhs-attribute-list">
            ${(() => { const change = stackChange('foco', character.resources.foco.stacks); return makeResource(character, 'foco', { editable: !character.locked, id, compact: true, ...change }); })()}
            ${(() => { const change = stackChange('folego', character.resources.folego.stacks); return makeResource(character, 'folego', { editable: !character.locked, id, compact: true, ...change }); })()}
            ${(() => { const change = stackChange('cooperacao', character.resources.cooperacao.stacks); return makeResource(character, 'cooperacao', { editable: !character.locked, id, compact: true, ...change }); })()}
          </div>
        </div>
        <div class="vhs-state-area">
          <header class="vhs-panel-head compact"><h3>Estado</h3><small>${formatCondition(character.estado)}</small></header>
          <div class="health-marks vhs-state-marks">${makeStateMarks(character, { editable: !character.locked, id })}</div>
          <div class="vhs-state-copy">
            <strong>${formatCondition(character.estado)}</strong>
            <p>${escapeHtml(conditionSummary(character.estado))}</p>
            ${character.estado === 'morrendo' ? `<button class="dead-button" type="button" data-action="set-dead">DECLARAR MORTO</button>` : ''}
          </div>
        </div>
      </div>
    </section>
  `;
}
function render() {
  if (!character) {
    root.innerHTML = `<section class="missing-card">Criando ficha...</section>`;
    return;
  }
  const image = getConditionPortrait(character);
  root.innerHTML = `
    <section class="survivor-sheet lite-sheet cabana-sheet condition-${escapeHtml(character.estado)} ${previousCondition && previousCondition !== character.estado ? 'state-fade' : ''}" style="${themeStyle(character)}">
      <header class="cabana-header">
        <div>
          <h1>UMA NOITE NO INFERNO</h1>
          <p>Jogador</p>
        </div>
        <div class="cabana-header-tools">${makeThemePicker(character, { id, compact: true })}</div>
      </header>
      <section class="cabana-main-grid">
        <div class="cabana-portrait-wrap">
          <button class="cabana-portrait" type="button" data-action="open-portraits">
            ${image ? `<img src="${image}" alt="Retrato de ${escapeHtml(character.nome)}" />` : `<span>Sem retrato</span>`}
          </button>
        </div>
        <div class="cabana-info-wrap">
          <div class="cabana-top-editors">
            ${makeEditableText('nome', character.nome, 'Nome do Personagem')}
            ${renderStyleInline()}
          </div>
          <div class="cabana-side-grid">
            ${renderAdvantagesSummary()}
            ${renderEffectsBoard()}
            ${renderNotesBoard()}
          </div>
        </div>
      </section>
      <section class="cabana-bottom-grid">
        ${renderAttributeStatePanel()}
        ${renderItemsCompact()}
        ${renderLatestRollPanel()}
      </section>
    </section>
  `;
  bindActions();
  animateDiceResults(root);
  bindPlayerNotes();
  previousCondition = character.estado;
  previousStacks = Object.fromEntries(Object.entries(character.resources).map(([resource, data]) => [resource, data.stacks]));
  previousItemCharges = new Map((character.items || []).map((item, index) => [index, item?.charges ?? null]));
}
function bindPlayerNotes() {
  const area = document.getElementById('player-notes');
  if (!area) return;
  area.addEventListener('input', () => {
    try { localStorage.setItem(`nevoa:notes:${id}`, area.value); } catch (error) {}
  });
}
function bindActions() {
  root.querySelectorAll("[data-action]").forEach((element) => element.addEventListener("click", handleAction));
}
function handleAction(event) {
  const button = event.currentTarget;
  const action = button.dataset.action;
  if (action === "start-edit") {
    const section = button.closest(".editable-text");
    section.querySelector(".editable-display").classList.add("hidden");
    section.querySelector(".editable-form").classList.remove("hidden");
    section.querySelector("input").focus();
  }
  if (action === "cancel-edit") {
    const section = button.closest(".editable-text");
    section.querySelector(".editable-display").classList.remove("hidden");
    section.querySelector(".editable-form").classList.add("hidden");
  }
  if (action === "confirm-edit") {
    const section = button.closest(".editable-text");
    socket.emit("character:updateText", { id, field: button.dataset.field, value: section.querySelector("input").value });
  }
  if (action === "set-theme-preset") socket.emit("character:setThemePreset", { id, preset: button.dataset.preset });
  if (action === "open-portraits") openPortraitModal();
  if (action === "open-style") openStyleModal();
  if (action === "open-item") { currentItemSlot = Number(button.dataset.slot || 0); openItemModal(); }
  if (action === "select-advantage") { currentAdvantageSlot = Number(button.dataset.slot || 0); openAdvantageModal(); }
  if (action === "remove-item") socket.emit("character:setItem", { id, slotIndex: Number(button.dataset.slot || 0), item: null });
  if (action === "set-item-charges") {
    const slotIndex = Number(button.dataset.slot || 0);
    const next = Number(button.dataset.charges);
    const current = character?.items?.[slotIndex]?.charges ?? 0;
    playStackSound(next > current ? "gained" : "lost");
    socket.emit("item:setCharges", { id, slotIndex, charges: next });
  }
  if (action === "remove-effect") {
    const effect = character?.effects?.find((entry) => entry.key === button.dataset.effect);
    if (effect) socket.emit("character:setEffect", { id, effect, enabled: false });
  }
  if (action === "set-marks") {
    const nextMarks = Number(button.dataset.marks);
    const currentMarks = character?.marcasEstado ?? 0;
    if (nextMarks > currentMarks) playConditionSound(conditionForMarks(nextMarks));
    socket.emit("character:setMarks", { id, marcasEstado: nextMarks });
  }
  if (action === "set-dead") {
    playConditionSound("morto");
    socket.emit("character:setDead", { id, dead: true });
  }
  if (action === "set-stacks") {
    const resource = button.dataset.resource;
    const nextStacks = Number(button.dataset.stacks);
    const currentStacks = character?.resources?.[resource]?.stacks ?? 0;
    playStackSound(nextStacks > currentStacks ? "gained" : "lost");
    socket.emit("resource:setStacks", { id, resource, stacks: nextStacks });
  }
  if (action === "roll-d20") {
    window.NevoaAudio?.unlock();
    window.NevoaAudio?.play("rollDice", 0.62);
    setTimeout(() => window.NevoaAudio?.play("rollReveal", 0.48), 3000);
    socket.emit("resource:rollD20", { id, resource: button.dataset.resource });
  }
}
function animateDiceResults(container) {
  container.querySelectorAll(".dice-result[data-final-value]").forEach((element) => {
    const finalValue = Number(element.dataset.finalValue);
    const startedAt = Number(element.dataset.rollAt || 0);
    if (!finalValue || !startedAt) return;
    const key = element.dataset.clientRollKey || `${startedAt}:${finalValue}`;
    const timing = getClientRollTiming(key);
    const targetsSelector = `.dice-result[data-client-roll-key="${key}"]`;
    let timer = null;
    const showFinal = () => {
      if (timer) clearInterval(timer);
      diceTimers.delete(key);
      const targets = document.querySelectorAll(targetsSelector);
      targets.forEach((target) => {
        target.textContent = String(finalValue);
        target.classList.remove("dice-rolling");
        target.classList.add("dice-revealed");
        const display = target.closest('.sheet-d20-display');
        display?.classList.remove('rolling');
        const label = display?.querySelector('em');
        if (label) label.textContent = 'RESULTADO';
        setTimeout(() => target.classList.remove("dice-revealed"), 620);
      });
    };
    if (performance.now() >= timing.revealAt) { showFinal(); return; }
    element.classList.add("dice-rolling");
    const display = element.closest('.sheet-d20-display');
    display?.classList.add('rolling');
    const label = display?.querySelector('em');
    if (label) label.textContent = 'ROLANDO';
    element.textContent = String(Math.floor(Math.random() * 20) + 1);
    if (diceTimers.has(key)) return;
    timer = setInterval(() => {
      const targets = document.querySelectorAll(targetsSelector);
      targets.forEach((target) => {
        target.textContent = String(Math.floor(Math.random() * 20) + 1);
        target.classList.add("dice-rolling");
        const display = target.closest('.sheet-d20-display');
        display?.classList.add('rolling');
        const label = display?.querySelector('em');
        if (label) label.textContent = 'ROLANDO';
      });
      if (performance.now() >= timing.revealAt) {
        clearInterval(timer);
        diceTimers.delete(key);
        showFinal();
      }
    }, 82);
    diceTimers.set(key, timer);
  });
}
function openPortraitModal() {
  const conditions = [["saudavel", "SAUDÁVEL"], ["ferido", "FERIDO"], ["machucado", "MACHUCADO"], ["morrendo", "MORRENDO"], ["morto", "MORTO"]];
  portraitGrid.innerHTML = conditions.map(([key, label]) => {
    const image = character.portraits[key];
    return `<label class="portrait-upload-card"><div class="portrait-preview">${image ? `<img src="${image}" alt="${label}" />` : `<span>SEM IMAGEM</span>`}</div><strong>${label}</strong><input type="file" accept="image/*" data-portrait-key="${key}" /></label>`;
  }).join("");
  portraitGrid.querySelectorAll("input[type=file]").forEach((input) => input.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => socket.emit("character:updatePortrait", { id, key: input.dataset.portraitKey, dataUrl: reader.result });
    reader.readAsDataURL(file);
  }));
  portraitModal.classList.remove("hidden");
  portraitModal.setAttribute("aria-hidden", "false");
}
function getUsedStyleOwners() {
  const owners = new Map();
  Object.values(state?.characters || {}).forEach((entry) => {
    if (!entry || entry.id === id) return;
    if (entry.styleKey && !owners.has(entry.styleKey)) owners.set(entry.styleKey, entry.nome || entry.id);
  });
  return owners;
}
function openStyleModal() {
  renderStyleModal();
  styleModal.classList.remove("hidden");
  styleModal.setAttribute("aria-hidden", "false");
}
function renderStyleModal() {
  const usedOwners = getUsedStyleOwners();
  styleList.innerHTML = CAT.styles.map((style) => {
    const owner = usedOwners.get(style.key);
    const isCurrent = character?.styleKey === style.key;
    const unavailable = Boolean(owner && !isCurrent);
    return `<button class="picker-item style-picker-item ${unavailable ? "unavailable" : ""} ${isCurrent ? "selected" : ""}" data-style-key="${escapeHtml(style.key)}" type="button" ${unavailable ? "disabled" : ""}>
      <span class="catalog-icon">${svg(style.icon)}</span>
      <div>
        <strong>${escapeHtml(style.nome)}</strong>
        <span>${escapeHtml(style.descricao)}</span>
        ${renderStyleStats(style)}
        <small>${unavailable ? `Já escolhido por ${escapeHtml(owner)}.` : isCurrent ? "Estilo atual deste personagem." : escapeHtml(style.grupo || "Disponível")}</small>
      </div>
    </button>`;
  }).join("");
  styleList.querySelectorAll(".picker-item").forEach((button) => button.addEventListener("click", () => {
    if (button.disabled) return;
    const style = CAT.styles.find((entry) => entry.key === button.dataset.styleKey);
    if (style) socket.emit("character:setStyleProfile", { id, style });
    closeStyleModal();
  }));
}
function closeStyleModal() { styleModal.classList.add("hidden"); styleModal.setAttribute("aria-hidden", "true"); }
function openItemModal() {
  renderItemModal("");
  itemModal.classList.remove("hidden");
  itemModal.setAttribute("aria-hidden", "false");
  itemSearch.value = "";
  if (!isTouchDevice) itemSearch.focus();
}
function renderItemModal(term) {
  const normalized = String(term || "").toLowerCase();
  const items = CAT.items.filter((item) => `${item.nome} ${item.categoria || ''} ${item.descricao}`.toLowerCase().includes(normalized));
  itemList.innerHTML = `
    <button class="picker-item remove-advantage" data-remove="true" type="button"><strong>REMOVER ITEM</strong><span>Deixa este slot vazio.</span></button>
    ${items.map((item, index) => `<button class="picker-item style-picker-item" data-index="${index}" type="button"><span class="catalog-icon">${svg(item.icon)}</span><div><strong>${escapeHtml(item.nome)}</strong><span>${escapeHtml(item.descricao)}</span><small>${item.max > 0 ? `${item.max} carga${item.max === 1 ? "" : "s"}` : "Sem cargas"}</small></div></button>`).join("")}
  `;
  itemList.querySelectorAll(".picker-item").forEach((button) => button.addEventListener("click", () => {
    socket.emit("character:setItem", { id, slotIndex: currentItemSlot, item: button.dataset.remove === "true" ? null : items[Number(button.dataset.index)] });
    closeItemModal();
  }));
}
function openAdvantageModal() {
  renderAdvantageModal("");
  advantageModal.classList.remove("hidden");
  advantageModal.setAttribute("aria-hidden", "false");
  advantageSearch.value = "";
  if (!isTouchDevice) advantageSearch.focus();
}
function getUsedAdvantageOwners() {
  const owners = new Map();
  Object.values(state?.characters || {}).forEach((entry) => {
    if (!entry || entry.id === id) return;
    (entry.vantagens || []).filter(Boolean).forEach((advantage) => {
      if (advantage?.key && !owners.has(advantage.key)) owners.set(advantage.key, entry.nome || entry.id);
    });
  });
  return owners;
}
function isCurrentSlotAdvantage(advantage) {
  return Boolean(advantage?.key && character?.vantagens?.[currentAdvantageSlot]?.key === advantage.key);
}
function renderAdvantageModal(term) {
  const normalized = String(term || "").toLowerCase();
  const usedOwners = getUsedAdvantageOwners();
  const advantages = (window.NEVOA_ADVANTAGES || []).filter((item) => `${item.nome} ${item.descricao}`.toLowerCase().includes(normalized));
  advantageList.innerHTML = `
    <button class="picker-item remove-advantage" data-remove="true" type="button"><strong>REMOVER VANTAGEM</strong><span>Deixa este espaço vazio.</span></button>
    ${advantages.map((advantage, index) => {
      const owner = usedOwners.get(advantage.key);
      const unavailable = Boolean(owner && !isCurrentSlotAdvantage(advantage));
      return `<button class="picker-item style-picker-item ${unavailable ? "unavailable" : ""}" data-index="${index}" type="button" ${unavailable ? "disabled" : ""}><span class="catalog-icon">${svg(advantage.icon)}</span><div><strong>${escapeHtml(advantage.nome)}</strong><span>${escapeHtml(advantage.descricao)}</span>${unavailable ? `<small>Já escolhida por ${escapeHtml(owner)}.</small>` : `<small>Diferencial disponível.</small>`}</div></button>`;
    }).join("")}
  `;
  advantageList.querySelectorAll(".picker-item").forEach((button) => button.addEventListener("click", () => {
    if (button.disabled) return;
    socket.emit("advantage:set", { id, slotIndex: currentAdvantageSlot, advantage: button.dataset.remove === "true" ? null : advantages[Number(button.dataset.index)] });
    closeAdvantageModal();
  }));
}
function closeAdvantageModal() { advantageModal.classList.add("hidden"); advantageModal.setAttribute("aria-hidden", "true"); }
function closePortraitModal() { portraitModal.classList.add("hidden"); portraitModal.setAttribute("aria-hidden", "true"); }
function closeItemModal() { itemModal.classList.add("hidden"); itemModal.setAttribute("aria-hidden", "true"); }
document.getElementById("portrait-close").addEventListener("click", closePortraitModal);
document.getElementById("style-close").addEventListener("click", closeStyleModal);
document.getElementById("item-close").addEventListener("click", closeItemModal);
document.getElementById("advantage-close").addEventListener("click", closeAdvantageModal);
itemSearch.addEventListener("input", (event) => renderItemModal(event.target.value));
advantageSearch.addEventListener("input", (event) => renderAdvantageModal(event.target.value));
portraitModal.addEventListener("click", (event) => { if (event.target === portraitModal) closePortraitModal(); });
styleModal.addEventListener("click", (event) => { if (event.target === styleModal) closeStyleModal(); });
itemModal.addEventListener("click", (event) => { if (event.target === itemModal) closeItemModal(); });
advantageModal.addEventListener("click", (event) => { if (event.target === advantageModal) closeAdvantageModal(); });
