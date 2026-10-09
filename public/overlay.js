const socket = io();
const {
  escapeHtml,
  getConditionPortrait,
  getCharacterIdFromPath,
  RESOURCE_ICON,
  formatCondition,
  themeStyle,
  makeStatusBadge,
  RESOURCE_LABELS,
  CONDITION_ORDER
} = window.NevoaCommon;
const CAT = window.NEVOA_PLAYER_CATALOG;

const root = document.getElementById("overlay-root");
const singleId = getCharacterIdFromPath();
document.body.classList.toggle("single-overlay-mode", Boolean(singleId));

let previousPortraits = new Map();
let previousStates = new Map();
let previousOverlayStacks = new Map();
let previousItemStacks = new Map();
let previousEffectSets = new Map();
let effectRemovalGhosts = new Map();
let effectRemovalTimers = new Map();
let clearTimers = new Map();
let diceTimers = new Map();
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
let renderedCharacters = [];
let overlayAudioEnabled = localStorage.getItem("nevoa-overlay-audio-enabled") !== "0";
let overlayAudioUnlocked = false;
let lastOverlayAudioEventId = 0;
let pendingOverlayAudioEvents = [];

const OVERLAY_AUDIO_MAP = {
  gained: ["gained", 0.74],
  lost: ["lost", 0.80],
  "state-ferido": ["stateFerido", 0.80],
  "state-machucado": ["stateMachucado", 0.86],
  "state-morrendo": ["stateMorrendo", 0.90],
  "state-morto": ["stateMorto", 0.96],
  "roll-dice": ["rollDice", 0.82],
  killerHitLight: ["killerHitLight", 0.76],
  killerHitHeavy: ["killerHitHeavy", 0.84],
  killerCritical: ["killerCritical", 0.92],
  killerChase: ["killerChase", 0.78],
  killerChaseEnd: ["killerChaseEnd", 0.68],
  killerApparition: ["killerApparition", 0.78],
  killerBreak: ["killerBreak", 0.84],
  killerDrag: ["killerDrag", 0.82],
  killerSpecial: ["killerSpecial", 0.82],
  killerTorment: ["killerTorment", 0.82],
  killerExecution: ["killerExecution", 0.96],
  killerPhase: ["killerPhase", 0.90],
  killerExposed: ["killerExposed", 0.80],
  killerMark: ["killerMark", 0.78],
  killerMiss: ["killerMiss", 0.68]
};
function svg(key) { return CAT.svg[key] || CAT.svg.star || ""; }
function eventMatchesThisOverlay(event) { if (!event) return false; if (!singleId) return true; return !event.characterId || event.characterId === singleId; }
function ensureOverlayAudioPanel() {
  let panel = document.getElementById("overlay-audio-panel");
  if (!overlayAudioEnabled) { panel?.remove(); return; }
  const ready = window.NevoaAudio?.isUnlocked?.();
  overlayAudioUnlocked = Boolean(ready);
  if (ready) { panel?.remove(); flushOverlayAudioQueue(); return; }
  if (!panel) {
    panel = document.createElement("button");
    panel.id = "overlay-audio-panel";
    panel.className = "overlay-audio-panel";
    panel.type = "button";
    panel.innerHTML = `<span class="overlay-audio-panel__pulse"></span><strong>ATIVAR SOM</strong><small>clique uma vez em Interagir</small>`;
    panel.addEventListener("click", async () => { await unlockOverlayAudio(true); });
    document.body.appendChild(panel);
  }
}
async function unlockOverlayAudio(playConfirmation = false) {
  overlayAudioEnabled = true;
  localStorage.setItem("nevoa-overlay-audio-enabled", "1");
  try {
    await window.NevoaAudio?.unlock?.();
    overlayAudioUnlocked = Boolean(window.NevoaAudio?.isUnlocked?.());
    if (overlayAudioUnlocked && playConfirmation) await window.NevoaAudio?.play?.("gained", 0.40);
  } catch (_) { overlayAudioUnlocked = false; }
  ensureOverlayAudioPanel();
  return overlayAudioUnlocked;
}
async function playOverlayAudioEvent(event) {
  if (!eventMatchesThisOverlay(event)) return;
  const config = OVERLAY_AUDIO_MAP[event.type];
  if (!config) return;
  if (!overlayAudioEnabled || !window.NevoaAudio?.isUnlocked?.()) {
    pendingOverlayAudioEvents.push({ ...event, queuedAt: Date.now() });
    pendingOverlayAudioEvents = pendingOverlayAudioEvents.filter((item) => Date.now() - item.queuedAt <= 3500).slice(-10);
    ensureOverlayAudioPanel();
    return;
  }
  await window.NevoaAudio.play(config[0], config[1]);
  if (event.type === "roll-dice") setTimeout(() => { if (overlayAudioEnabled && window.NevoaAudio?.isUnlocked?.()) window.NevoaAudio.play("rollReveal", 0.62); }, 3000);
}
function flushOverlayAudioQueue() {
  if (!overlayAudioEnabled || !window.NevoaAudio?.isUnlocked?.()) return;
  const events = pendingOverlayAudioEvents.filter((item) => Date.now() - item.queuedAt <= 3500).slice(-8);
  pendingOverlayAudioEvents = [];
  events.forEach((event, index) => setTimeout(() => playOverlayAudioEvent(event), index * 85));
}
socket.on("audio:event", (event) => {
  if (!event || !event.type) return;
  if (event.id && event.id <= lastOverlayAudioEventId) return;
  lastOverlayAudioEventId = event.id || (lastOverlayAudioEventId + 1);
  playOverlayAudioEvent(event);
});
window.addEventListener("pointerdown", () => { if (overlayAudioEnabled && !window.NevoaAudio?.isUnlocked?.()) unlockOverlayAudio(false); }, { once: true });
window.NevoaAudio?.preloadAll?.();
unlockOverlayAudio(false);
setInterval(ensureOverlayAudioPanel, 1400);

function activateIncomingRoll(characterId, resource, roll, key) {
  // Garante que telas remotas (PC/OBS/Tailscale) criem a UI da rolagem
  // imediatamente ao receber o evento, em vez de esperar um state:update.
  let changed = false;
  renderedCharacters.forEach((character) => {
    if (character?.id !== characterId || !character.resources?.[resource]) return;
    character.resources[resource].lastRoll = roll;
    changed = true;
  });
  if (changed) {
    render(renderedCharacters);
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

socket.on("state:update", (state) => {
  primeRollsFromState(state);
  let characters = Object.values(state.characters).filter((character) => character.overlayVisible);
  if (singleId) characters = characters.filter((character) => character.id === singleId);
  renderedCharacters = characters;
  render(renderedCharacters);
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

function overlayStackChange(id, key, currentStacks) {
  const previous = previousOverlayStacks.get(`${id}:${key}`);
  previousOverlayStacks.set(`${id}:${key}`, currentStacks);
  if (previous === undefined) return { changedIndex: null, changeType: "" };
  if (currentStacks > previous) return { changedIndex: currentStacks - 1, changeType: "gained" };
  if (currentStacks < previous) return { changedIndex: previous - 1, changeType: "lost" };
  return { changedIndex: null, changeType: "" };
}
function overlayItemChange(id, currentStacks) {
  const previous = previousItemStacks.get(id);
  previousItemStacks.set(id, currentStacks);
  if (previous === undefined) return { changedIndex: null, changeType: "" };
  if (currentStacks > previous) return { changedIndex: currentStacks - 1, changeType: "gained" };
  if (currentStacks < previous) return { changedIndex: previous - 1, changeType: "lost" };
  return { changedIndex: null, changeType: "" };
}

function render(characters) {
  root.innerHTML = characters.map((character) => {
    const portrait = getConditionPortrait(character);
    const previousPortrait = previousPortraits.get(character.id);
    const previousState = previousStates.get(character.id);
    const changed = (previousPortrait !== undefined && previousPortrait !== portrait) || (previousState !== undefined && previousState !== character.estado);
    previousPortraits.set(character.id, portrait);
    previousStates.set(character.id, character.estado);

    return `
      <div class="overlay-card-stage vhs-overlay-stage">
        <article class="overlay-card vhs-overlay-card condition-${escapeHtml(character.estado)} ${changed ? 'state-fade' : ''}" data-overlay-id="${escapeHtml(character.id)}" style="${themeStyle(character)}">
          <section class="vhs-screen">
            <div class="vhs-screen-noise"></div>
            <div class="vhs-screen-frame"></div>
            <div class="vhs-scanlines"></div>
            <div class="vhs-chroma vhs-chroma-red"></div>
            <div class="vhs-chroma vhs-chroma-blue"></div>
            <div class="vhs-osd vhs-osd-top"><span>REC</span><span>CAM ${escapeHtml(character.id).slice(0, 2).toUpperCase() || '01'}</span><span>SP</span></div>
            <div class="vhs-character-name">*${escapeHtml(character.nome || 'NOME PERSONAGEM')}*</div>
            <div class="vhs-portrait">${portrait ? `<img src="${portrait}" alt="${escapeHtml(character.nome)}" />` : `<span>NO IMAGE</span>`}</div>
            ${renderOverlayEffects(character)}
            ${renderOverlayItems(character)}
            <div class="overlay-roll-slot vhs-roll-slot">${makeLatestRoll(character)}</div>
            <div class="vhs-style-tag"><strong>ESTILO</strong><span>*${escapeHtml(character.estilo || 'NOME E.')}*</span></div>
            <div class="vhs-dead-screen"><strong>NO SIGNAL</strong><small>TAPE END / CHARACTER LOST</small></div>
          </section>

          <section class="vhs-control-bar">
            <div class="vhs-control-group vhs-control-skills">
              <h3>PERÍCIAS</h3>
              <div class="vhs-resources">
                ${['foco', 'folego', 'cooperacao'].map((resource) => renderVhsResource(character, resource)).join('')}
              </div>
            </div>
            <div class="vhs-control-group vhs-state-panel">
              <h3>ESTADO</h3>
              <div class="vhs-state-row">
                <div class="vhs-state-boxes">${renderVhsStateBoxes(character)}</div>
                <strong class="vhs-state-label">${formatCondition(character.estado)}</strong>
              </div>
            </div>
          </section>
        </article>
      </div>`;
  }).join("");
  animateDiceResults(root);
}

function renderVhsResource(character, resource) {
  const data = character.resources[resource];
  const change = overlayStackChange(character.id, resource, data.stacks);
  return `
    <section class="vhs-resource vhs-resource-${escapeHtml(resource)}">
      <div class="vhs-resource-icon">${RESOURCE_ICON[resource]}</div>
      <div class="vhs-resource-body">
        <small>${escapeHtml(RESOURCE_LABELS[resource] || resource.toUpperCase())}</small>
        <div class="overlay-stack-line vhs-stack-line">
          ${Array.from({ length: data.max }, (_, index) => `<span class="overlay-drop vhs-stack ${index < data.stacks ? 'filled' : ''} ${index === change.changedIndex && change.changeType ? `stack-${change.changeType}` : ''}"></span>`).join('')}
        </div>
      </div>
    </section>`;
}

function renderVhsStateBoxes(character) {
  const marks = Math.max(0, Math.min(3, Number(character.marcasEstado) || 0));
  return Array.from({ length: 3 }, (_, index) => `<span class="vhs-state-box ${index < marks ? 'marked' : ''}"></span>`).join('');
}

function scheduleEffectGhostCleanup(key, delay = 760) {
  if (effectRemovalTimers.has(key)) return;
  const timer = setTimeout(() => {
    effectRemovalTimers.delete(key);
    effectRemovalGhosts.delete(key);
    render(renderedCharacters);
  }, delay);
  effectRemovalTimers.set(key, timer);
}
function renderOverlayItems(character) {
  const items = Array.isArray(character.items) ? character.items.filter(Boolean) : [];
  if (!items.length) return "";
  return `<div class="overlay-extras"><section class="overlay-items-grid" aria-label="Itens carregados">${items.map((item, slotIndex) => {
    const key = `${character.id}:item:${slotIndex}:${item.key}`;
    const previous = previousItemStacks.get(key);
    previousItemStacks.set(key, item.charges);
    const animation = Number.isInteger(previous) && previous !== item.charges ? (item.charges > previous ? 'count-gained' : 'count-lost') : '';
    const count = item.max > 0 ? String(item.charges) : '—';
    return `<article class="overlay-item-icon-chip" title="${escapeHtml(item.nome)}${item.max > 0 ? `: ${item.charges} carga(s)` : ''}">
      <span class="catalog-icon small">${svg(item.icon)}</span>
      <strong class="overlay-item-count ${animation}">${count}</strong>
    </article>`;
  }).join('')}</section></div>`;
}
function renderOverlayEffects(character) {
  const effects = Array.isArray(character.effects) ? character.effects.slice(0, 8) : [];
  const oldEffectMap = previousEffectSets.get(character.id) || new Map();
  const currentEffectMap = new Map(effects.map((effect) => [effect.key, effect]));
  oldEffectMap.forEach((effect, key) => {
    if (currentEffectMap.has(key)) return;
    const ghostKey = `${character.id}:effect:${key}`;
    effectRemovalGhosts.set(ghostKey, { ...effect, characterId: character.id });
    scheduleEffectGhostCleanup(ghostKey);
  });
  const addedKeys = new Set();
  currentEffectMap.forEach((_effect, key) => { if (!oldEffectMap.has(key)) addedKeys.add(key); });
  previousEffectSets.set(character.id, currentEffectMap);
  const ghosts = [];
  effectRemovalGhosts.forEach((effect, key) => { if (effect.characterId === character.id) ghosts.push({ key, effect }); });
  if (!effects.length && !ghosts.length) return '';
  return `<section class="overlay-effects-vertical" aria-label="Efeitos ativos">
    ${effects.map((effect) => `<span class="overlay-effect-icon ${effect.negative === false ? 'positive' : 'negative'} ${addedKeys.has(effect.key) ? 'effect-enter' : ''}" title="${escapeHtml(effect.nome)}">
      <span class="catalog-icon tiny">${svg(effect.icon)}</span>
    </span>`).join('')}
    ${ghosts.slice(0, Math.max(0, 8 - effects.length)).map(({ effect }) => `<span class="overlay-effect-icon effect-leave" title="${escapeHtml(effect.nome)} removido">
      <span class="catalog-icon tiny">${svg(effect.icon)}</span>
    </span>`).join('')}
  </section>`;
}
function d20RollSvg() {
  return `<img class="vhs-d20-bg" src="/context_assets/result-display-d20.png" alt="" aria-hidden="true">`;
}
function makeLatestRoll(character) {
  const activeRolls = ["cooperacao", "folego", "foco"].map((resource) => {
    const roll = character.resources[resource].lastRoll;
    const key = roll ? makeClientRollKey(character.id, resource, roll) : "";
    return { resource, roll, key };
  }).filter(({ roll, key }) => roll && isClientRollVisible(key)).sort((a, b) => b.roll.at - a.roll.at);
  activeRolls.forEach(({ resource, roll, key }) => scheduleClear(character.id, resource, roll.at, key));
  const latest = activeRolls[0];
  if (!latest) return "";
  const isRolling = isClientRollRolling(latest.key);
  const visibleValue = getDiceDisplayValue(latest.key, latest.roll.value);
  return `<div class="roll-popup vhs-roll-popup vhs-roll-popup-d20 sheet-d20-display ${isRolling ? 'rolling' : ''}" data-roll-owner="${character.id}" data-roll-resource="${latest.resource}" data-roll-start="${latest.roll.at}">
    ${d20RollSvg()}
    <div class="sheet-d20-content overlay-sheet-d20-content">
      <span class="sheet-d20-icon">${RESOURCE_ICON[latest.resource]}</span>
      <strong class="dice-result dice-overlay-result" data-client-roll-key="${escapeHtml(latest.key)}" data-roll-at="${latest.roll.at}" data-reveal-at="${latest.roll.revealAt || latest.roll.at}" data-final-value="${latest.roll.value}">${visibleValue}</strong>
      <em>${isRolling ? 'ROLANDO' : 'RESULTADO'}</em>
    </div>
  </div>`;
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
        const popup = target.closest('.vhs-roll-popup-d20');
        popup?.classList.remove('rolling');
        const label = popup?.querySelector('em');
        if (label) label.textContent = 'RESULTADO';
        setTimeout(() => target.classList.remove("dice-revealed"), 620);
      });
    };
    if (performance.now() >= timing.revealAt) { showFinal(); return; }
    element.classList.add("dice-rolling");
    const initialPopup = element.closest('.vhs-roll-popup-d20');
    initialPopup?.classList.add('rolling');
    const initialLabel = initialPopup?.querySelector('em');
    if (initialLabel) initialLabel.textContent = 'ROLANDO';
    element.textContent = String(Math.floor(Math.random() * 20) + 1);
    if (diceTimers.has(key)) return;
    timer = setInterval(() => {
      const targets = document.querySelectorAll(targetsSelector);
      targets.forEach((target) => {
        target.textContent = String(Math.floor(Math.random() * 20) + 1);
        target.classList.add("dice-rolling");
        const popup = target.closest('.vhs-roll-popup-d20');
        popup?.classList.add('rolling');
        const label = popup?.querySelector('em');
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
function scheduleClear(id, resource, at, clientKey = "") {
  const key = clientKey || `${id}:${resource}:${at}`;
  if (clearTimers.has(key)) return;
  const timing = getClientRollTiming(key);
  const remaining = Math.max(0, timing.hideAt - performance.now());
  const timer = setTimeout(() => {
    document.querySelectorAll(`.dice-result[data-client-roll-key="${key}"]`).forEach((target) => target.closest('.vhs-roll-popup-d20')?.classList.add('fade-out'));
    setTimeout(() => { clearTimers.delete(key); render(renderedCharacters); }, 650);
  }, remaining + 30);
  clearTimers.set(key, timer);
}
