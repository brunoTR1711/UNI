const socket = window.nevoaSocket || (window.nevoaSocket = io());
const Common = window.NevoaCommon;
const CAT = window.NEVOA_PLAYER_CATALOG;
const ACAT = window.NEVOA_ASSASSIN_CATALOG || { svg: {}, abilities: [], advantages: [] };
const {
  escapeHtml,
  getConditionPortrait,
  makeStateMarks,
  makeStacks,
  formatCondition,
  copyText,
  themeStyle,
  RESOURCE_LABELS,
  RESOURCE_ICON
} = Common;

const THREAT_ID = "ameaca-cabana";
const grid = document.getElementById("master-grid");
const createForm = document.getElementById("create-form");
const damageTargetSelect = document.getElementById("damage-target-select");
const effectTargetSelect = document.getElementById("effect-target-select");
const obsessionTargetSelect = document.getElementById("obsession-target-select");
const effectButtonGrid = document.getElementById("effect-button-grid");
const targetPreview = document.getElementById("target-preview");
const rollHistoryList = document.getElementById("roll-history-list");
const killerAdvantagesSlot = document.getElementById("killer-advantages-slot");
const killerAbilitiesSlot = document.getElementById("killer-abilities-slot");
const killerPickerModal = document.getElementById("killer-picker-modal");
const killerPickerTitle = document.getElementById("killer-picker-title");
const killerPickerKicker = document.getElementById("killer-picker-kicker");
const killerPickerList = document.getElementById("killer-picker-list");
const killerPickerSearch = document.getElementById("killer-picker-search");
const killerPickerCancel = document.getElementById("killer-picker-cancel");
const killerPickerClear = document.getElementById("killer-picker-clear");

let state = { characters: {}, assassins: {} };
let threatEnsured = false;
const seenRolls = new Set();
const rollHistory = [];
const renderedCards = new Map();
const diceTimers = new Map();
const {
  diceLocalTimings,
  diceServerFrames,
  CLIENT_DICE_ANIMATION_MS,
  makeClientRollKey,
  getClientRollTiming,
  primeClientRollTiming,
  isClientRollRolling,
  isClientRollVisible,
  getDiceDisplayValue,
  applyDiceServerFrame
} = window.NevoaCommon.createDiceController({ showLabels: true });
let killerPickerMode = null;
let killerPickerSlot = 0;

const MASTER_EFFECT_KEYS = ["ferida-profunda", "quebrado", "incapacitado", "exposto", "alheio", "exaustao", "sorte"];

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
  return CAT.svg[key] || ACAT.svg?.[key] || CAT.svg.star || "";
}
function killerSvg(key) {
  return ACAT.svg?.[key] || CAT.svg[key] || CAT.svg.star || "";
}
function chars() {
  return Object.values(state.characters || {});
}
function currentAssassin() {
  return state.assassins?.[THREAT_ID] || null;
}
function slugify(value) {
  const base = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 28);
  return base || `sobrevivente-${Date.now().toString(36)}`;
}
function selectedDamageTargetId() {
  return damageTargetSelect.value || chars()[0]?.id || "";
}
function selectedEffectTargetId() {
  return effectTargetSelect.value || selectedDamageTargetId();
}
function selectedObsessionId() {
  return obsessionTargetSelect?.value || currentAssassin()?.chase?.obsessionId || "";
}
function selectedObsession() {
  const id = selectedObsessionId();
  return id ? (state.characters?.[id] || null) : null;
}
function ensureThreat() {
  if (threatEnsured || state.assassins?.[THREAT_ID]) return;
  threatEnsured = true;
  socket.emit("assassin:create", { id: THREAT_ID, nome: "Ameaça do Inferno" });
}
function trackRolls() {
  chars().forEach((character) => {
    ["cooperacao", "folego", "foco"].forEach((resource) => {
      const roll = character.resources?.[resource]?.lastRoll;
      if (!roll?.at || !roll?.value) return;
      const key = makeClientRollKey(character.id, resource, roll);
      if (seenRolls.has(key)) return;
      seenRolls.add(key);
      rollHistory.unshift({
        key,
        at: roll.at,
        value: roll.value,
        characterId: character.id,
        characterName: character.nome || character.id,
        resource,
        label: RESOURCE_LABELS[resource] || resource.toUpperCase(),
        revealAt: roll.revealAt || roll.at,
        finalValue: roll.value
      });
      while (rollHistory.length > 18) rollHistory.pop();
    });
  });
}

socket.on("state:update", (incoming) => {
  primeRollsFromState(incoming);
  state = incoming;
  ensureThreat();
  trackRolls();
  renderTargetOptions();
  render();
});

function activateIncomingRoll(characterId, resource, roll, key) {
  if (state?.characters?.[characterId]?.resources?.[resource]) {
    state.characters[characterId].resources[resource].lastRoll = roll;
    trackRolls();
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

createForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const idInput = document.getElementById("create-id");
  const nameInput = document.getElementById("create-name");
  const nome = nameInput.value.trim() || "Novo personagem";
  const id = slugify(idInput.value.trim() || nome);
  socket.emit("character:create", { id, nome }, (result) => {
    if (!result?.ok) return alert(result?.error || "Não foi possível criar.");
    createForm.reset();
  });
});

function renderTargetOptions() {
  const damageCurrent = damageTargetSelect.value;
  const effectCurrent = effectTargetSelect.value;
  const obsessionCurrent = obsessionTargetSelect?.value ?? (currentAssassin()?.chase?.obsessionId || "");
  const characters = chars();
  const targetOptions = characters.length
    ? characters.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nome)}</option>`).join("")
    : `<option value="">Nenhum alvo</option>`;
  const optionalOptions = `<option value="">Nenhum</option>${characters.map((c) => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nome)}</option>`).join("")}`;
  damageTargetSelect.innerHTML = targetOptions;
  effectTargetSelect.innerHTML = targetOptions;
  if (obsessionTargetSelect) obsessionTargetSelect.innerHTML = optionalOptions;
  if (characters.some((c) => c.id === damageCurrent)) damageTargetSelect.value = damageCurrent;
  if (characters.some((c) => c.id === effectCurrent)) effectTargetSelect.value = effectCurrent;
  if (obsessionTargetSelect) obsessionTargetSelect.value = characters.some((c) => c.id === obsessionCurrent) ? obsessionCurrent : "";
  renderEffectButtons();
}
function masterEffects() {
  const wanted = new Set(MASTER_EFFECT_KEYS);
  const picked = CAT.effects.filter((effect) => wanted.has(effect.key));
  return picked.length ? picked : CAT.effects.slice(0, 7);
}
function renderEffectButtons() {
  effectButtonGrid.innerHTML = masterEffects().map((effect) => `
    <button type="button" data-effect-key="${escapeHtml(effect.key)}" title="${escapeHtml(effect.descricao || effect.nome)}">
      ${escapeHtml(effect.nome)}
    </button>
  `).join("");
  effectButtonGrid.querySelectorAll("[data-effect-key]").forEach((button) => {
    button.addEventListener("click", () => applyEffect(button.dataset.effectKey));
  });
}
function renderTargetPreview() {
  const target = selectedObsession();
  if (!target) {
    targetPreview.innerHTML = `<header class="vhs-target-name"><small>OBSESSÃO ATUAL</small><strong>Nenhuma</strong></header><p class="vhs-empty-copy">Nenhum sobrevivente marcado como obsessão.</p>`;
    return;
  }
  const image = getConditionPortrait(target);
  targetPreview.innerHTML = `
    <header class="vhs-target-name"><small>OBSESSÃO ATUAL</small><strong>${escapeHtml(target.nome)}</strong></header>
    <div class="vhs-target-snapshot">
      ${image ? `<img src="${image}" alt="${escapeHtml(target.nome)}">` : `<span>sem foto</span>`}
      <strong>${formatCondition(target.estado)}</strong>
    </div>
  `;
}
function renderKillerPlaceholders() {
  const assassin = currentAssassin();
  const selectedAdvantages = Array.isArray(assassin?.advantages) ? assassin.advantages : [null, null, null];
  const selectedAbilities = Array.isArray(assassin?.abilities) ? assassin.abilities : [null, null, null];

  killerAdvantagesSlot.innerHTML = selectedAdvantages.map((advantage, index) => `
    <button type="button" class="vhs-killer-exclusive-row ${advantage ? "filled" : "empty"}" data-picker="advantage" data-slot="${index}">
      <span class="vhs-killer-exclusive-icon">${killerSvg(advantage?.icon || "skull")}</span>
      <div class="vhs-killer-exclusive-copy">
        <small>VANTAGEM ${index + 1}</small>
        <strong>${escapeHtml(advantage?.nome || "ADICIONAR VANTAGEM")}</strong>
        <p>${escapeHtml(advantage?.descricao || "Clique para escolher uma vantagem exclusiva do assassino.")}</p>
      </div>
    </button>
  `).join("");

  killerAbilitiesSlot.innerHTML = selectedAbilities.map((ability, index) => `
    <button type="button" class="vhs-killer-exclusive-row ${ability ? "filled" : "empty"}" data-picker="ability" data-slot="${index}">
      <span class="vhs-killer-exclusive-icon">${killerSvg(ability?.icon || "skull")}</span>
      <div class="vhs-killer-exclusive-copy">
        <small>HABILIDADE ${index + 1}</small>
        <strong>${escapeHtml(ability?.nome || "ADICIONAR HABILIDADE")}</strong>
        <p>${escapeHtml(ability?.descricao || "Clique para escolher uma habilidade exclusiva do assassino.")}</p>
      </div>
    </button>
  `).join("");

  document.querySelectorAll("[data-picker]").forEach((button) => {
    button.addEventListener("click", () => openKillerPicker(button.dataset.picker, Number(button.dataset.slot || 0)));
  });
}
function renderRollHistory() {
  if (!rollHistory.length) {
    rollHistoryList.innerHTML = `<p class="vhs-empty-copy">Nenhuma rolagem registrada ainda.</p>`;
    return;
  }
  rollHistoryList.innerHTML = rollHistory.map((entry) => `
    <article class="vhs-roll-history-row">
      <span class="vhs-roll-resource">${RESOURCE_ICON[entry.resource]}</span>
      <div>
        <strong>${escapeHtml(entry.characterName)}</strong>
        <small>${escapeHtml(entry.label)}</small>
      </div>
      <b class="dice-result" data-client-roll-key="${escapeHtml(entry.key)}" data-roll-at="${entry.at}" data-reveal-at="${entry.revealAt || entry.at}" data-final-value="${entry.finalValue || entry.value}">${getDiceDisplayValue(entry.key, entry.finalValue || entry.value)}</b>
    </article>
  `).join("");
}
function conditionStripClass(character) {
  const count = Array.isArray(character.effects) ? character.effects.length : 0;
  return `master-vhs-condition-strip ${count >= 4 ? "split" : "vertical"}`;
}
function renderConditionGlyphs(character) {
  const effects = Array.isArray(character.effects) ? character.effects.slice(0, 6) : [];
  if (!effects.length) return `<span class="lite-empty inline">—</span>`;
  return effects.map((effect) => `
    <button type="button" class="master-cond-icon ${effect.negative === false ? "positive" : ""}" title="${escapeHtml(effect.nome)}" data-action="remove-effect" data-id="${escapeHtml(character.id)}" data-effect="${escapeHtml(effect.key)}">${svg(effect.icon)}</button>
  `).join("");
}
function renderCharacterMini(character) {
  const image = getConditionPortrait(character);
  const playerUrl = `${location.origin}/jogador/${character.id}`;
  const overlayUrl = `${location.origin}/overlay/${character.id}`;
  return `
    <article class="master-vhs-character-card condition-${escapeHtml(character.estado)}" style="${themeStyle(character)}">
      <div class="master-vhs-card-portrait">${image ? `<img src="${image}" alt="${escapeHtml(character.nome)}" />` : `<span>sem foto</span>`}</div>
      <div class="master-vhs-card-info">
        <header>
          <h3>${escapeHtml(character.nome)}</h3>
          <small>${formatCondition(character.estado)}</small>
        </header>
        <div class="master-vhs-state-line">
          <div class="master-vhs-card-marks">${makeStateMarks(character, { editable: true, role: "master", id: character.id, compact: true })}</div>
          <div class="${conditionStripClass(character)}">${renderConditionGlyphs(character)}</div>
        </div>
        <div class="master-vhs-card-resources">
          ${["foco", "folego", "cooperacao"].map((resource) => `
            <div class="master-vhs-mini-resource">
              <button data-action="roll-d20" data-id="${escapeHtml(character.id)}" data-resource="${resource}" type="button" title="Rolar ${escapeHtml(RESOURCE_LABELS[resource])}">${RESOURCE_ICON[resource]}</button>
              <div class="stacks-row">${makeStacks(character, resource, { editable: true, role: "master", id: character.id, compact: true })}</div>
              ${(() => { const roll = character.resources[resource].lastRoll; if (!roll) return `<b>—</b>`; const rollKey = makeClientRollKey(character.id, resource, roll); return `<b class="dice-result" data-client-roll-key="${escapeHtml(rollKey)}" data-roll-at="${roll.at}" data-reveal-at="${roll.revealAt || roll.at}" data-final-value="${roll.value}">${getDiceDisplayValue(rollKey, roll.value)}</b>`; })()}
            </div>`).join("")}
        </div>
        <footer class="master-vhs-card-links">
          <a href="${escapeHtml(playerUrl)}" target="_blank" rel="noreferrer">▸ DETALHES</a>
          <a href="${escapeHtml(overlayUrl)}" target="_blank" rel="noreferrer">OBS</a>
          ${character.estado === "morrendo" ? `<button class="dead-button mini" data-action="set-dead" data-id="${escapeHtml(character.id)}" type="button">DECLARAR MORTO</button>` : ""}
          <button class="danger-link" data-action="delete" data-id="${escapeHtml(character.id)}" type="button">EXCLUIR</button>
        </footer>
      </div>
    </article>
  `;
}
function openKillerPicker(mode, slotIndex) {
  killerPickerMode = mode;
  killerPickerSlot = slotIndex;
  if (!killerPickerModal) return;
  killerPickerKicker.textContent = mode === "ability" ? "HABILIDADES DO ASSASSINO" : "VANTAGENS DO ASSASSINO";
  killerPickerTitle.textContent = mode === "ability" ? `Selecionar habilidade ${slotIndex + 1}` : `Selecionar vantagem ${slotIndex + 1}`;
  killerPickerSearch.value = "";
  killerPickerModal.hidden = false;
  renderKillerPickerList("");
  killerPickerSearch.focus();
}
function closeKillerPicker() {
  if (!killerPickerModal) return;
  killerPickerModal.hidden = true;
  killerPickerMode = null;
}
function renderKillerPickerList(filterText = "") {
  if (!killerPickerList || !killerPickerMode) return;
  const source = killerPickerMode === "ability" ? (ACAT.abilities || []) : (ACAT.advantages || []);
  const assassin = currentAssassin();
  const selected = killerPickerMode === "ability" ? (assassin?.abilities || []) : (assassin?.advantages || []);
  const currentKey = selected[killerPickerSlot]?.key || "";
  const query = String(filterText || "").toLowerCase().trim();
  const filtered = source.filter((entry) => !query || entry.nome.toLowerCase().includes(query) || (entry.descricao || "").toLowerCase().includes(query));
  killerPickerList.innerHTML = filtered.map((entry) => {
    const already = selected.some((picked, idx) => idx !== killerPickerSlot && picked?.key === entry.key);
    return `<button type="button" class="assassin-picker-item ${already ? "is-disabled" : ""}" data-pick-key="${escapeHtml(entry.key)}" ${already ? "disabled" : ""}><span>${killerSvg(entry.icon || "skull")}</span><div><h3>${escapeHtml(entry.nome)}</h3><small>${already ? "JÁ ESCOLHIDA EM OUTRO SLOT" : (entry.key === currentKey ? "SELECIONADA NESTE SLOT" : "DISPONÍVEL")}</small><p>${escapeHtml(entry.descricao || entry.description || "")}</p></div></button>`;
  }).join("") || `<p class="vhs-empty-copy">Nenhum resultado.</p>`;
  killerPickerList.querySelectorAll("[data-pick-key]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.pickKey;
      const choice = source.find((entry) => entry.key === key);
      if (!choice) return;
      if (killerPickerMode === "ability") socket.emit("assassin:setAbility", { id: THREAT_ID, slotIndex: killerPickerSlot, ability: choice });
      if (killerPickerMode === "advantage") socket.emit("assassin:setAdvantage", { id: THREAT_ID, slotIndex: killerPickerSlot, advantage: choice });
      closeKillerPicker();
    });
  });
}
function render() {
  const characters = chars();
  renderTargetPreview();
  renderRollHistory();
  renderKillerPlaceholders();
  if (!characters.length) {
    renderedCards.clear();
    grid.innerHTML = `<section class="empty-master-state"><h2>Nenhum sobrevivente criado</h2><p>Use o botão + para criar personagens.</p></section>`;
    return;
  }
  if (!renderedCards.size) grid.replaceChildren();
  const activeIds = new Set(characters.map((character) => character.id));
  for (const [id, entry] of renderedCards) {
    if (!activeIds.has(id)) {
      entry.element.remove();
      renderedCards.delete(id);
    }
  }
  characters.forEach((character, index) => {
    const snapshot = JSON.stringify(character);
    let entry = renderedCards.get(character.id);
    if (entry?.snapshot !== snapshot) {
      const template = document.createElement("template");
      template.innerHTML = renderCharacterMini(character).trim();
      const element = template.content.firstElementChild;
      entry?.element.replaceWith(element);
      entry = { snapshot, element };
      renderedCards.set(character.id, entry);
    }
    if (grid.children[index] !== entry.element) {
      grid.insertBefore(entry.element, grid.children[index] || null);
    }
  });
  animateDiceResults(document);
}
grid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (button && grid.contains(button) && !button.disabled) handleAction(button);
});
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
        setTimeout(() => target.classList.remove("dice-revealed"), 620);
      });
    };
    if (performance.now() >= timing.revealAt) { showFinal(); return; }
    element.classList.add("dice-rolling");
    element.textContent = String(Math.floor(Math.random() * 20) + 1);
    if (diceTimers.has(key)) return;
    timer = setInterval(() => {
      const targets = document.querySelectorAll(targetsSelector);
      targets.forEach((target) => {
        target.textContent = String(Math.floor(Math.random() * 20) + 1);
        target.classList.add("dice-rolling");
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
function conditionForMarks(marks) {
  if (marks <= 0) return "saudavel";
  if (marks === 1) return "ferido";
  if (marks === 2) return "machucado";
  return "morrendo";
}
function playState(condition) {
  window.NevoaAudio?.unlock();
  window.NevoaAudio?.playState(condition, condition === "morto" ? 0.78 : 0.66);
}
function handleAction(b) {
  const id = b.dataset.id;
  const action = b.dataset.action;
  if (action === "set-marks") {
    const nextMarks = Number(b.dataset.marks);
    const current = state.characters?.[id]?.marcasEstado ?? 0;
    if (nextMarks > current) playState(conditionForMarks(nextMarks));
    socket.emit("character:setMarks", { id, marcasEstado: nextMarks, role: "master" });
  }
  if (action === "set-dead") {
    playState("morto");
    socket.emit("character:setDead", { id, dead: true, role: "master" });
  }
  if (action === "set-stacks") {
    const resource = b.dataset.resource;
    const next = Number(b.dataset.stacks);
    const current = state.characters?.[id]?.resources?.[resource]?.stacks ?? 0;
    window.NevoaAudio?.unlock();
    window.NevoaAudio?.play(next > current ? "gained" : "lost", 0.6);
    socket.emit("resource:setStacks", { id, resource, stacks: next, role: "master" });
  }
  if (action === "roll-d20") {
    window.NevoaAudio?.unlock();
    window.NevoaAudio?.play("rollDice", 0.55);
    setTimeout(() => window.NevoaAudio?.play("rollReveal", 0.44), 3000);
    socket.emit("resource:rollD20", { id, resource: b.dataset.resource, role: "master" });
  }
  if (action === "remove-effect") {
    const effect = state.characters?.[id]?.effects?.find((entry) => entry.key === b.dataset.effect);
    if (effect) socket.emit("character:setEffect", { id, effect, enabled: false });
  }
  if (action === "copy") {
    copyText(b.dataset.value);
    const original = b.textContent;
    b.textContent = "COPIADO";
    setTimeout(() => b.textContent = original, 900);
  }
  if (action === "delete" && confirm("Excluir este sobrevivente?")) socket.emit("character:delete", { id });
}
function requireTarget(targetId) {
  if (!targetId) alert("Escolha um alvo primeiro.");
  return targetId;
}
function applyEffect(effectKey) {
  const targetId = requireTarget(selectedEffectTargetId());
  if (!targetId) return;
  const effect = CAT.effects.find((entry) => entry.key === effectKey);
  if (!effect) return;
  socket.emit("assassin:applyEffectToTarget", {
    id: THREAT_ID,
    targetCharacterId: targetId,
    effect: { ...effect, audio: effect.key === "sorte" ? "killerSpecial" : "killerTorment", intensity: effect.key === "sorte" ? "light" : "medium" }
  });
}

document.querySelectorAll("[data-threat]").forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = requireTarget(selectedDamageTargetId());
    if (!targetId) return;
    const kind = button.dataset.threat;
    if (kind === "damage-light") socket.emit("assassin:damageTarget", { id: THREAT_ID, targetCharacterId: targetId, amount: 1 });
    if (kind === "damage-heavy") socket.emit("assassin:damageTarget", { id: THREAT_ID, targetCharacterId: targetId, amount: 2 });
    if (kind === "damage-mortal") socket.emit("assassin:damageTarget", { id: THREAT_ID, targetCharacterId: targetId, amount: 3 });
  });
});
damageTargetSelect.addEventListener("change", renderTargetPreview);
effectTargetSelect.addEventListener("change", renderTargetPreview);
obsessionTargetSelect?.addEventListener("change", () => {
  socket.emit("assassin:setChase", { id: THREAT_ID, field: "obsessionId", value: obsessionTargetSelect.value || "" });
  renderTargetPreview();
});
killerPickerSearch?.addEventListener("input", () => renderKillerPickerList(killerPickerSearch.value));
killerPickerCancel?.addEventListener("click", closeKillerPicker);
killerPickerClear?.addEventListener("click", () => {
  if (!killerPickerMode) return;
  if (killerPickerMode === "ability") socket.emit("assassin:setAbility", { id: THREAT_ID, slotIndex: killerPickerSlot, ability: null });
  if (killerPickerMode === "advantage") socket.emit("assassin:setAdvantage", { id: THREAT_ID, slotIndex: killerPickerSlot, advantage: null });
  closeKillerPicker();
});
killerPickerModal?.addEventListener("click", (event) => {
  if (event.target?.dataset?.modalClose === "true") closeKillerPicker();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && killerPickerModal && !killerPickerModal.hidden) closeKillerPicker();
});
document.getElementById("clear-effects-button").addEventListener("click", () => {
  const targetId = requireTarget(selectedEffectTargetId());
  if (targetId) socket.emit("character:clearEffects", { id: targetId });
});
