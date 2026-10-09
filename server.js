const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const os = require("os");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 16 * 1024 * 1024 });
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.join(__dirname, "data");
const DATA_PATH = path.join(DATA_DIR, "state.json");
const APP_VERSION = "v62-estilos";
const DICE_ANIMATION_MS = 3000;
app.disable("etag");
app.use(express.json({ limit: "16mb" }));
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("X-Uma-Noite-Version", APP_VERSION);
  next();
});
app.use(express.static(path.join(__dirname, "public"), { etag: false, maxAge: 0, lastModified: false }));

const ALLOWED_THEME_PRESETS = new Set(["ciano", "magenta", "ambar", "verde", "violeta", "laranja", "azul"]);

const SURVIVOR_STYLES = {
  escapista: { key: "escapista", nome: "ESCAPISTA", stats: { cooperacao: 1, folego: 6, foco: 1 } },
  protetor: { key: "protetor", nome: "PROTETOR", stats: { cooperacao: 6, folego: 1, foco: 1 } },
  rebelde: { key: "rebelde", nome: "REBELDE", stats: { cooperacao: 1, folego: 3, foco: 4 } },
  reservado: { key: "reservado", nome: "RESERVADO", stats: { cooperacao: 1, folego: 4, foco: 3 } },
  curioso: { key: "curioso", nome: "CURIOSO", stats: { cooperacao: 3, folego: 1, foco: 4 } },
  guia: { key: "guia", nome: "GUIA", stats: { cooperacao: 4, folego: 1, foco: 3 } },
  mistico: { key: "mistico", nome: "MÍSTICO", stats: { cooperacao: 1, folego: 1, foco: 6 } },
  resiliente: { key: "resiliente", nome: "RESILIENTE", stats: { cooperacao: 2, folego: 3, foco: 3 } },
  genio: { key: "genio", nome: "GÊNIO", stats: { cooperacao: 2, folego: 1, foco: 5 } },
  artista: { key: "artista", nome: "ARTISTA", stats: { cooperacao: 2, folego: 2, foco: 4 } },
  amigavel: { key: "amigavel", nome: "AMIGÁVEL", stats: { cooperacao: 4, folego: 2, foco: 2 } }
};
const LEGACY_SURVIVOR_STYLE_MAP = {
  robusto: "resiliente",
  investigativo: "curioso",
  altruista: "amigavel",
  adepto: "guia",
  sensitivo: "mistico",
  intelectual: "genio",
  artistico: "artista",
  diplomatico: "amigavel"
};
function isStyleTakenByOther(styleKey, characterId) {
  return Object.values(state.characters || {}).some((entry) => entry?.id !== characterId && entry?.styleKey === styleKey);
}
const ASSASSIN_STYLES = {
  bestial: { nome: "BESTIAL", violencia: 4, tormento: 1, package: "bestial" },
  espiritual: { nome: "ESPIRITUAL", violencia: 0, tormento: 5, package: "espiritual" },
  maligno: { nome: "MALIGNO", violencia: 1, tormento: 4, package: "maligno" },
  furtivo: { nome: "FURTIVO", violencia: 2, tormento: 3, package: "furtivo" },
  louco: { nome: "LOUCO", violencia: 3, tormento: 2, package: "louco" },
  acougueiro: { nome: "AÇOUGUEIRO", violencia: 5, tormento: 0, package: "acougueiro" }
};
const SCENE_EVENTS = {
  apparition: { label: "APARIÇÃO", intensity: "light", audio: "killerApparition", bloodlust: 0 },
  chaseStart: { label: "PERSEGUIÇÃO INICIADA", intensity: "medium", audio: "killerChase", bloodlust: 0 },
  chaseEnd: { label: "PERSEGUIÇÃO ENCERRADA", intensity: "light", audio: "killerChaseEnd", bloodlust: 0 },
  attackHit: { label: "GOLPE ACERTADO", intensity: "heavy", audio: "killerHitHeavy", bloodlust: 1 },
  criticalHit: { label: "GOLPE CRÍTICO", intensity: "extreme", audio: "killerCritical", bloodlust: 2 },
  attackMiss: { label: "GOLPE ERRADO", intensity: "light", audio: "killerMiss", bloodlust: 0 },
  exposed: { label: "ALVO EXPOSTO", intensity: "medium", audio: "killerExposed", bloodlust: 0 },
  dragged: { label: "SOBREVIVENTE ARRASTADO", intensity: "heavy", audio: "killerDrag", bloodlust: 0 },
  obstacleBreak: { label: "OBSTÁCULO DESTRUÍDO", intensity: "heavy", audio: "killerBreak", bloodlust: 0 },
  special: { label: "HABILIDADE ESPECIAL", intensity: "heavy", audio: "killerSpecial", bloodlust: 0 },
  torment: { label: "TORMENTO", intensity: "medium", audio: "killerTorment", bloodlust: 0 },
  obsession: { label: "OBSESSÃO MARCADA", intensity: "medium", audio: "killerMark", bloodlust: 0 },
  phaseChange: { label: "NOVA FASE", intensity: "extreme", audio: "killerPhase", bloodlust: 0 },
  execution: { label: "EXECUÇÃO", intensity: "extreme", audio: "killerExecution", bloodlust: 2 }
};
const TARGETED_SCENE_EVENTS = new Set([
  "attackHit",
  "criticalHit",
  "attackMiss",
  "exposed",
  "dragged",
  "torment",
  "obsession",
  "execution"
]);

function defaultState() {
  return { characters: {}, assassins: {}, sceneHistory: [], updatedAt: Date.now() };
}
function loadState() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    const s = defaultState();
    fs.writeFileSync(DATA_PATH, JSON.stringify(s, null, 2));
    return s;
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch (error) {
    console.error(error);
    return defaultState();
  }
}

let state = loadState();
let audioSequence = 0;
let sceneSequence = 0;

function saveState() {
  state.updatedAt = Date.now();
  fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2), "utf8");
}
function getLocalIps() {
  return Object.values(os.networkInterfaces())
    .flat()
    .filter((entry) => entry && entry.family === "IPv4" && !entry.internal)
    .map((entry) => entry.address);
}
function sanitizeId(v) {
  return String(v || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}
function calculateCondition(marked, dead = false) {
  if (dead) return "morto";
  if (marked <= 0) return "saudavel";
  if (marked === 1) return "ferido";
  if (marked === 2) return "machucado";
  return "morrendo";
}
function baseResource() {
  return { stacks: 0, max: 6, lastRoll: null };
}
function defaultCharacter(id) {
  return {
    id,
    nome: "NOME DO PERSONAGEM",
    estilo: "ESTILO",
    styleKey: "",
    styleStats: { cooperacao: 0, folego: 0, foco: 0 },
    estado: "saudavel",
    marcasEstado: 0,
    morto: false,
    themePreset: "ciano",
    overlayVisible: true,
    locked: false,
    darkAdvantagesUnlocked: false,
    portraits: { saudavel: "", ferido: "", machucado: "", morrendo: "", morto: "" },
    resources: { cooperacao: baseResource(), folego: baseResource(), foco: baseResource() },
    vantagens: [null, null, null, null],
    items: [null, null, null, null, null],
    effects: []
  };
}

const ITEM_PRESETS = {
  'cura-1': { key:'cura-1', nome:'Cura — 1 carga', descricao:'Itens curativos. Gaste 1 carga e 1 ação para recuperar 1 Estado de Saúde de você ou de outro jogador.', icon:'medicine', max:1, categoria:'cura' },
  'cura-2': { key:'cura-2', nome:'Cura — 2 cargas', descricao:'Itens curativos. Gaste 1 carga e 1 ação para recuperar 1 Estado de Saúde de você ou de outro jogador.', icon:'medicine', max:2, categoria:'cura' },
  'ferramenta-1': { key:'ferramenta-1', nome:'Ferramenta — 1 carga', descricao:'Itens para facilitar um objetivo. Gaste 1 carga para garantir 1 sucesso em um objetivo.', icon:'toolbox', max:1, categoria:'ferramenta' },
  'ferramenta-2': { key:'ferramenta-2', nome:'Ferramenta — 2 cargas', descricao:'Itens para facilitar um objetivo. Gaste 1 carga para garantir 1 sucesso em um objetivo.', icon:'toolbox', max:2, categoria:'ferramenta' },
  'defesa-1': { key:'defesa-1', nome:'Defesa — 1 carga', descricao:'Itens para atordoar, cegar ou afastar o assassino. Gaste 1 carga para criar uma defesa na cena.', icon:'hammer', max:1, categoria:'defesa' },
  'defesa-2': { key:'defesa-2', nome:'Defesa — 2 cargas', descricao:'Itens para atordoar, cegar ou afastar o assassino. Gaste 1 carga para criar uma defesa na cena.', icon:'hammer', max:2, categoria:'defesa' },
  'defesa-3': { key:'defesa-3', nome:'Defesa — 3 cargas', descricao:'Itens para atordoar, cegar ou afastar o assassino. Gaste 1 carga para criar uma defesa na cena.', icon:'hammer', max:3, categoria:'defesa' },
  'distracao-1': { key:'distracao-1', nome:'Distração — 1 carga', descricao:'Itens para distrair o assassino. Gaste 1 carga para criar ruído, chamar atenção ou ganhar tempo.', icon:'target', max:1, categoria:'distracao' }
};
const LEGACY_ITEM_MAP = {
  'item-medico': 'cura-2',
  'lanterna': 'defesa-1',
  'baterias': 'defesa-1',
  'ferramentas': 'ferramenta-2',
  'utensilios': 'defesa-1',
  'equipamentos': 'defesa-2',
  'dispositivos': 'defesa-2',
  'armamentos-tradicionais': 'defesa-3',
  'chaves': null
};
function normalizeItemEntry(entry) {
  if (!entry) return null;
  const rawKey = String(entry.key || '');
  const mappedKey = Object.prototype.hasOwnProperty.call(LEGACY_ITEM_MAP, rawKey) ? LEGACY_ITEM_MAP[rawKey] : rawKey;
  if (!mappedKey) return null;
  const preset = ITEM_PRESETS[mappedKey];
  if (preset) {
    const max = preset.max;
    return {
      ...preset,
      charges: Math.max(0, Math.min(max, Number(entry.charges ?? max)))
    };
  }
  const max = Math.max(0, Math.min(3, Number(entry.max ?? 1)));
  return {
    key: String(entry.key || '').slice(0, 60),
    nome: String(entry.nome || 'ITEM').slice(0, 80),
    descricao: String(entry.descricao || '').slice(0, 300),
    icon: String(entry.icon || 'toolbox').slice(0, 40),
    categoria: String(entry.categoria || 'item').slice(0, 40),
    max,
    charges: Math.max(0, Math.min(max, Number(entry.charges ?? max)))
  };
}

function defaultAssassin(id) {
  const style = ASSASSIN_STYLES.acougueiro;
  return {
    id,
    nome: "NOME DO ASSASSINO",
    styleKey: "acougueiro",
    styleName: style.nome,
    visualPackage: style.package,
    portrait: "",
    violencia: style.violencia,
    tormento: style.tormento,
    bloodlust: { current: 0, max: 8 },
    specialAbility: null,
    specialUsed: false,
    abilities: [null, null, null],
    advantages: [null, null, null],
    chase: { active: false, targetId: "", obsessionId: "", revealTarget: false, phase: 1 },
    publicVisible: true,
    history: []
  };
}
function normalizeCharacter(character, id) {
  const base = defaultCharacter(id);
  const result = { ...base, ...(character || {}) };
  result.id = id;
  result.portraits = { ...base.portraits, ...(character?.portraits || {}) };
  result.styleStats = { ...base.styleStats, ...(character?.styleStats || {}) };
  const resolvedStyleKey = LEGACY_SURVIVOR_STYLE_MAP[result.styleKey] || result.styleKey;
  const resolvedStyle = SURVIVOR_STYLES[resolvedStyleKey];
  if (resolvedStyle) {
    result.styleKey = resolvedStyle.key;
    result.estilo = resolvedStyle.nome;
    result.styleStats = { ...resolvedStyle.stats };
  }
  result.resources = {
    cooperacao: { ...baseResource(), ...(character?.resources?.cooperacao || {}) },
    folego: { ...baseResource(), ...(character?.resources?.folego || {}) },
    foco: { ...baseResource(), ...(character?.resources?.foco || {}) }
  };
  result.vantagens = Array.isArray(character?.vantagens) ? character.vantagens.slice(0, 4) : [null, null, null, null];
  while (result.vantagens.length < 4) result.vantagens.push(null);
  result.effects = Array.isArray(character?.effects) ? character.effects.filter(Boolean) : [];
  const legacyItems = Array.isArray(character?.items)
    ? character.items.slice(0, 5)
    : (character?.item ? [character.item] : []);
  while (legacyItems.length < 5) legacyItems.push(null);
  result.items = legacyItems.map(normalizeItemEntry);
  delete result.item;
  result.estado = calculateCondition(Number(result.marcasEstado) || 0, !!result.morto);
  result.themePreset = ALLOWED_THEME_PRESETS.has(result.themePreset) ? result.themePreset : "ciano";
  result.darkAdvantagesUnlocked = !!result.darkAdvantagesUnlocked;
  return result;
}
function normalizeAssassin(assassin, id) {
  const base = defaultAssassin(id);
  const result = { ...base, ...(assassin || {}) };
  result.id = id;
  result.bloodlust = { ...base.bloodlust, ...(assassin?.bloodlust || {}) };
  result.chase = { ...base.chase, ...(assassin?.chase || {}) };
  result.advantages = Array.isArray(assassin?.advantages) ? assassin.advantages.slice(0, 3) : [null, null, null];
  while (result.advantages.length < 3) result.advantages.push(null);
  result.abilities = Array.isArray(assassin?.abilities) ? assassin.abilities.slice(0, 3) : [null, null, null];
  while (result.abilities.length < 3) result.abilities.push(null);
  result.history = Array.isArray(assassin?.history) ? assassin.history.slice(0, 20) : [];
  return result;
}
function normalizeState() {
  state.characters ||= {};
  state.assassins ||= {};
  state.sceneHistory ||= [];
  for (const id of Object.keys(state.characters)) state.characters[id] = normalizeCharacter(state.characters[id], id);
  for (const id of Object.keys(state.assassins)) state.assassins[id] = normalizeAssassin(state.assassins[id], id);
}
normalizeState();

function ensureCharacter(id) {
  id = sanitizeId(id);
  if (!id) return null;
  if (!state.characters[id]) state.characters[id] = defaultCharacter(id);
  state.characters[id] = normalizeCharacter(state.characters[id], id);
  return state.characters[id];
}
function ensureAssassin(id) {
  id = sanitizeId(id);
  if (!id) return null;
  if (!state.assassins[id]) state.assassins[id] = defaultAssassin(id);
  state.assassins[id] = normalizeAssassin(state.assassins[id], id);
  return state.assassins[id];
}
function emitState() {
  saveState();
  io.emit("state:update", state);
}
function emitAudio(type, payload = {}) {
  audioSequence += 1;
  io.emit("audio:event", { id: audioSequence, type, ...payload, at: Date.now() });
}
function broadcastScene(event) {
  sceneSequence += 1;
  const targetScoped = event.targetScoped === true;
  const complete = {
    id: sceneSequence,
    at: Date.now(),
    scope: targetScoped ? "target" : "global",
    ...event,
    targetScoped
  };
  state.sceneHistory.unshift(complete);
  state.sceneHistory = state.sceneHistory.slice(0, 60);
  if (complete.assassinId && state.assassins[complete.assassinId]) {
    const assassin = state.assassins[complete.assassinId];
    assassin.history.unshift(complete);
    assassin.history = assassin.history.slice(0, 24);
  }
  saveState();
  io.emit("scene:event", complete);
  if (complete.audio) {
    emitAudio(complete.audio, {
      assassinId: complete.assassinId,
      characterId: complete.targetCharacterId,
      sceneEventId: complete.id
    });
  }
  io.emit("state:update", state);
}
function emitScene(eventKey, payload = {}) {
  const def = SCENE_EVENTS[eventKey];
  if (!def) return;
  const assassin = payload.assassinId ? state.assassins[payload.assassinId] : null;
  if (assassin && def.bloodlust) {
    assassin.bloodlust.current = Math.min(assassin.bloodlust.max, assassin.bloodlust.current + def.bloodlust);
  }
  broadcastScene({
    eventKey,
    label: def.label,
    intensity: def.intensity,
    audio: def.audio,
    targetScoped: payload.targetScoped ?? TARGETED_SCENE_EVENTS.has(eventKey),
    ...payload
  });
}
function emitCustomScene({ label, intensity = "medium", audio = "killerSpecial", eventKey = "custom", targetScoped, ...payload }) {
  broadcastScene({
    label,
    intensity,
    audio,
    eventKey,
    targetScoped: targetScoped ?? Boolean(payload.targetCharacterId),
    ...payload
  });
}
function canPlayerEdit(character, role) {
  return role === "master" || !character.locked;
}
function upsertEffect(character, effect) {
  if (!effect?.key) return;
  const key = String(effect.key);
  const existing = character.effects.findIndex((entry) => entry.key === key);
  const sanitized = {
    key,
    nome: String(effect.nome || effect.name || key).slice(0, 80),
    descricao: String(effect.descricao || effect.description || "").slice(0, 300),
    icon: String(effect.icon || "star").slice(0, 40),
    negative: effect.negative !== false
  };
  if (existing >= 0) character.effects[existing] = sanitized;
  else character.effects.push(sanitized);
}
function removeEffect(character, key) {
  character.effects = character.effects.filter((entry) => entry?.key !== key);
}
function damageCharacter(character, delta) {
  const previous = character.marcasEstado;
  character.marcasEstado = Math.max(0, Math.min(3, character.marcasEstado + delta));
  character.morto = false;
  character.estado = calculateCondition(character.marcasEstado, false);
  if (character.marcasEstado > previous) emitAudio(`state-${character.estado}`, { characterId: character.id });
}
function itemChangeAudio(characterId, previous, next) {
  if (previous === next) return;
  emitAudio(next > previous ? "gained" : "lost", { characterId, resource: "item" });
}

app.get("/", (_, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.get("/mestre", (_, res) => res.sendFile(path.join(__dirname, "public", "mestre.html")));
app.get("/jogadores", (_, res) => res.sendFile(path.join(__dirname, "public", "jogadores.html")));
app.get("/jogador/:id", (_, res) => res.sendFile(path.join(__dirname, "public", "jogador.html")));
app.get("/overlay", (_, res) => res.sendFile(path.join(__dirname, "public", "overlay.html")));
app.get("/overlay/:id", (_, res) => res.sendFile(path.join(__dirname, "public", "overlay.html")));
app.get("/audio", (_, res) => res.sendFile(path.join(__dirname, "public", "audio.html")));
app.get("/assassinos", (_, res) => res.sendFile(path.join(__dirname, "public", "assassinos.html")));
app.get("/assassino/overlay", (_, res) => res.sendFile(path.join(__dirname, "public", "assassino-overlay.html")));
app.get("/assassino/overlay/:id", (_, res) => res.sendFile(path.join(__dirname, "public", "assassino-overlay.html")));
app.get("/efeitos", (_, res) => res.sendFile(path.join(__dirname, "public", "effects.html")));
app.get("/efeitos/:id", (_, res) => res.sendFile(path.join(__dirname, "public", "effects.html")));
app.get("/api/state", (_, res) => res.json(state));
app.get("/api/network", (_, res) => res.json({ port: PORT, ips: getLocalIps() }));

io.on("connection", (socket) => {
  socket.emit("state:update", state);

  socket.on("character:create", ({ id, nome }, ack) => {
    const character = ensureCharacter(id);
    if (!character) return ack?.({ ok: false, error: "ID inválido" });
    if (nome && character.nome === "NOME DO PERSONAGEM") character.nome = String(nome).slice(0, 60);
    emitState();
    ack?.({ ok: true, character });
  });
  socket.on("character:delete", ({ id }) => {
    delete state.characters[sanitizeId(id)];
    emitState();
  });
  socket.on("character:updateText", ({ id, field, value, role = "player" }) => {
    const character = ensureCharacter(id);
    if (!character || !canPlayerEdit(character, role) || !["nome", "estilo"].includes(field)) return;
    character[field] = String(value || "").slice(0, 90);
    emitState();
  });
  socket.on("character:setThemePreset", ({ id, preset, role = "player" }) => {
    const character = ensureCharacter(id);
    if (!character || !canPlayerEdit(character, role) || !ALLOWED_THEME_PRESETS.has(preset)) return;
    character.themePreset = preset;
    emitState();
  });
  socket.on("character:updatePortrait", ({ id, key, dataUrl, role = "player" }) => {
    const character = ensureCharacter(id);
    if (!character || !canPlayerEdit(character, role) || !(key in character.portraits) || typeof dataUrl !== "string" || dataUrl.length > 10000000) return;
    character.portraits[key] = dataUrl;
    emitState();
  });
  socket.on("character:setMarks", ({ id, marcasEstado, role = "player" }) => {
    const character = ensureCharacter(id);
    if (!character || !canPlayerEdit(character, role)) return;
    const previous = character.marcasEstado;
    character.marcasEstado = Math.max(0, Math.min(3, Number(marcasEstado) || 0));
    character.morto = false;
    character.estado = calculateCondition(character.marcasEstado);
    if (character.marcasEstado > previous) emitAudio(`state-${character.estado}`, { characterId: character.id });
    emitState();
  });
  socket.on("character:setDead", ({ id, dead = true, role = "player" }) => {
    const character = ensureCharacter(id);
    if (!character || !canPlayerEdit(character, role) || (role !== "master" && character.estado !== "morrendo")) return;
    const was = character.morto;
    character.morto = !!dead;
    character.estado = calculateCondition(character.marcasEstado, character.morto);
    if (!was && character.morto) emitAudio("state-morto", { characterId: character.id });
    emitState();
  });
  socket.on("character:setLocked", ({ id, locked }) => {
    const character = ensureCharacter(id);
    if (!character) return;
    character.locked = !!locked;
    emitState();
  });
  socket.on("character:setOverlayVisible", ({ id, visible }) => {
    const character = ensureCharacter(id);
    if (!character) return;
    character.overlayVisible = !!visible;
    emitState();
  });
  socket.on("character:setStyleProfile", ({ id, style, role = "player" }, ack) => {
    const character = ensureCharacter(id);
    const styleKey = sanitizeId(style?.key);
    const profile = SURVIVOR_STYLES[styleKey];
    if (!character || !canPlayerEdit(character, role) || !profile) return ack?.({ ok: false, error: "Estilo inválido para esta one-shot." });
    if (isStyleTakenByOther(styleKey, character.id)) return ack?.({ ok: false, error: "Este estilo já foi escolhido por outro sobrevivente." });

    character.styleKey = profile.key;
    character.estilo = profile.nome;
    character.styleStats = { ...profile.stats };
    ["cooperacao", "folego", "foco"].forEach((resource) => {
      const value = Math.max(0, Math.min(6, Number(profile.stats[resource]) || 0));
      character.resources[resource].max = 6;
      character.resources[resource].stacks = value;
    });
    emitState();
    ack?.({ ok: true, style: profile });
  });
  socket.on("character:setDarkUnlocked", ({ id, allowed }) => {
    const character = ensureCharacter(id);
    if (!character) return;
    character.darkAdvantagesUnlocked = !!allowed;
    emitState();
  });
  socket.on("resource:setStacks", ({ id, resource, stacks, role = "player" }) => {
    const character = ensureCharacter(id);
    if (!character || !canPlayerEdit(character, role) || !character.resources[resource]) return;
    const target = character.resources[resource];
    const previous = target.stacks;
    const next = Math.max(0, Math.min(target.max, Number(stacks) || 0));
    target.stacks = next;
    if (previous !== next) emitAudio(next > previous ? "gained" : "lost", { characterId: character.id, resource });
    emitState();
  });
  socket.on("resource:rollD20", ({ id, resource, role = "player" }) => {
    const character = ensureCharacter(id);
    if (!character || !canPlayerEdit(character, role) || !character.resources[resource]) return;
    const at = Date.now();
    const value = Math.floor(Math.random() * 20) + 1;
    const rollId = `${character.id}-${resource}-${at}-${Math.random().toString(36).slice(2, 8)}`;
    const roll = { id: rollId, key: rollId, value, at, revealAt: at + DICE_ANIMATION_MS, durationMs: DICE_ANIMATION_MS };
    character.resources[resource].lastRoll = roll;

    io.emit("dice:roll", { characterId: character.id, resource, roll, key: rollId, durationMs: DICE_ANIMATION_MS });
    io.emit("dice:frame", { characterId: character.id, resource, rollId, key: rollId, value: Math.floor(Math.random() * 20) + 1, final: false });
    emitAudio("roll-dice", { characterId: character.id, resource });
    emitState();

    const frameStartedAt = Date.now();
    const frameTimer = setInterval(() => {
      const elapsed = Date.now() - frameStartedAt;
      if (elapsed >= DICE_ANIMATION_MS) {
        clearInterval(frameTimer);
        io.emit("dice:frame", { characterId: character.id, resource, rollId, key: rollId, value, final: true });
        io.emit("dice:reveal", { characterId: character.id, resource, rollId, key: rollId, value, final: true });
        return;
      }
      io.emit("dice:frame", { characterId: character.id, resource, rollId, key: rollId, value: Math.floor(Math.random() * 20) + 1, final: false });
    }, 90);

    setTimeout(() => {
      const currentCharacter = state.characters?.[id];
      const currentRoll = currentCharacter?.resources?.[resource]?.lastRoll;
      if ((currentRoll?.id || currentRoll?.key || `${currentRoll?.at}:${currentRoll?.value}`) === rollId) {
        currentCharacter.resources[resource].lastRoll = null;
        emitState();
      }
    }, 11800);
  });
  socket.on("resource:clearRoll", ({ id, resource }) => {
    const character = ensureCharacter(id);
    if (!character || !character.resources[resource]) return;
    character.resources[resource].lastRoll = null;
    emitState();
  });
  socket.on("advantage:set", ({ id, slotIndex, advantage, role = "player" }) => {
    const character = ensureCharacter(id);
    if (!character || !canPlayerEdit(character, role)) return;
    const index = Number(slotIndex);
    if (index < 0 || index > 3) return;
    if (!advantage) {
      character.vantagens[index] = null;
      emitState();
      return;
    }
    if (advantage.tipo === "obscura" && role !== "master" && !character.darkAdvantagesUnlocked) return;
    const advantageKey = String(advantage.key || `adv-${index}`).slice(0, 60);
    const alreadyUsed = Object.values(state.characters).some((entry) => {
      if (!entry || entry.id === character.id) return false;
      return (entry.vantagens || []).some((selected) => selected?.key === advantageKey);
    });
    const alreadyInAnotherSlot = (character.vantagens || []).some((selected, selectedIndex) => selectedIndex !== index && selected?.key === advantageKey);
    if (alreadyUsed || alreadyInAnotherSlot) return;
    character.vantagens[index] = {
      key: advantageKey,
      nome: String(advantage.nome || "").slice(0, 80),
      descricao: String(advantage.descricao || "").slice(0, 500),
      icon: String(advantage.icon || "star").slice(0, 40),
      tipo: advantage.tipo === "obscura" ? "obscura" : "normal"
    };
    emitState();
  });
  socket.on("character:setItem", ({ id, slotIndex = 0, item, role = "player" }) => {
    const character = ensureCharacter(id);
    const index = Math.max(0, Math.min(4, Number(slotIndex) || 0));
    if (!character || !canPlayerEdit(character, role)) return;
    const previous = character.items[index]?.charges || 0;
    if (!item) {
      character.items[index] = null;
      itemChangeAudio(character.id, previous, 0);
      emitState();
      return;
    }
    character.items[index] = normalizeItemEntry(item);
    if (!character.items[index]) return;
    itemChangeAudio(character.id, previous, character.items[index].charges);
    emitState();
  });
  socket.on("item:setCharges", ({ id, slotIndex = 0, charges, role = "player" }) => {
    const character = ensureCharacter(id);
    const index = Math.max(0, Math.min(4, Number(slotIndex) || 0));
    if (!character || !canPlayerEdit(character, role) || !character.items[index]) return;
    const previous = character.items[index].charges;
    character.items[index].charges = Math.max(0, Math.min(character.items[index].max, Number(charges) || 0));
    itemChangeAudio(character.id, previous, character.items[index].charges);
    emitState();
  });
  socket.on("character:setEffect", ({ id, effect, enabled = true }) => {
    const character = ensureCharacter(id);
    if (!character || !effect?.key) return;
    if (enabled) upsertEffect(character, effect);
    else removeEffect(character, String(effect.key));
    emitState();
  });
  socket.on("character:clearEffects", ({ id }) => {
    const character = ensureCharacter(id);
    if (!character) return;
    character.effects = [];
    emitState();
  });

  socket.on("assassin:create", ({ id, nome }, ack) => {
    const assassin = ensureAssassin(id);
    if (!assassin) return ack?.({ ok: false, error: "ID inválido" });
    if (nome && assassin.nome === "NOME DO ASSASSINO") assassin.nome = String(nome).slice(0, 70);
    emitState();
    ack?.({ ok: true, assassin });
  });
  socket.on("assassin:delete", ({ id }) => {
    delete state.assassins[sanitizeId(id)];
    emitState();
  });
  socket.on("assassin:updateText", ({ id, field, value }) => {
    const assassin = ensureAssassin(id);
    if (!assassin || !["nome"].includes(field)) return;
    assassin[field] = String(value || "").slice(0, 90);
    emitState();
  });
  socket.on("assassin:setStyle", ({ id, styleKey }) => {
    const assassin = ensureAssassin(id);
    const style = ASSASSIN_STYLES[styleKey];
    if (!assassin || !style) return;
    assassin.styleKey = styleKey;
    assassin.styleName = style.nome;
    assassin.visualPackage = style.package;
    assassin.violencia = style.violencia;
    assassin.tormento = style.tormento;
    emitState();
  });
  socket.on("assassin:updatePortrait", ({ id, dataUrl }) => {
    const assassin = ensureAssassin(id);
    if (!assassin || typeof dataUrl !== "string" || dataUrl.length > 10000000) return;
    assassin.portrait = dataUrl;
    emitState();
  });
  socket.on("assassin:setResource", ({ id, resource, value }) => {
    const assassin = ensureAssassin(id);
    if (!assassin) return;
    if (resource === "bloodlust") assassin.bloodlust.current = Math.max(0, Math.min(assassin.bloodlust.max, Number(value) || 0));
    if (resource === "violencia") assassin.violencia = Math.max(0, Math.min(9, Number(value) || 0));
    if (resource === "tormento") assassin.tormento = Math.max(0, Math.min(9, Number(value) || 0));
    emitState();
  });
  socket.on("assassin:setSpecial", ({ id, ability }) => {
    const assassin = ensureAssassin(id);
    if (!assassin) return;
    assassin.specialAbility = ability || null;
    assassin.specialUsed = false;
    emitState();
  });
  socket.on("assassin:setSpecialUsed", ({ id, used }) => {
    const assassin = ensureAssassin(id);
    if (!assassin) return;
    assassin.specialUsed = !!used;
    emitState();
  });
  socket.on("assassin:setAdvantage", ({ id, slotIndex, advantage }) => {
    const assassin = ensureAssassin(id);
    const index = Number(slotIndex);
    if (!assassin || index < 0 || index > 2) return;
    assassin.advantages[index] = advantage || null;
    emitState();
  });
  socket.on("assassin:setAbility", ({ id, slotIndex, ability }) => {
    const assassin = ensureAssassin(id);
    const index = Number(slotIndex);
    if (!assassin || index < 0 || index > 2) return;
    assassin.abilities[index] = ability || null;
    emitState();
  });
  socket.on("assassin:setChase", ({ id, field, value }) => {
    const assassin = ensureAssassin(id);
    if (!assassin || !Object.prototype.hasOwnProperty.call(assassin.chase, field)) return;
    assassin.chase[field] = field === "phase"
      ? Math.max(1, Math.min(4, Number(value) || 1))
      : (field === "active" || field === "revealTarget")
        ? !!value
        : String(value || "");
    emitState();
  });
  socket.on("assassin:setVisible", ({ id, visible }) => {
    const assassin = ensureAssassin(id);
    if (!assassin) return;
    assassin.publicVisible = !!visible;
    emitState();
  });
  socket.on("assassin:triggerScene", ({ id, eventKey, targetCharacterId = "" }) => {
    const assassin = ensureAssassin(id);
    if (!assassin || !SCENE_EVENTS[eventKey]) return;
    if (eventKey === "chaseStart") assassin.chase.active = true;
    if (eventKey === "chaseEnd") assassin.chase.active = false;
    if (eventKey === "special") assassin.specialUsed = true;
    if (eventKey === "phaseChange") assassin.chase.phase = Math.min(4, assassin.chase.phase + 1);
    emitScene(eventKey, {
      assassinId: assassin.id,
      targetCharacterId: String(targetCharacterId || assassin.chase.targetId || ""),
      assassinName: assassin.nome,
      styleKey: assassin.styleKey,
      targetName: state.characters[targetCharacterId || assassin.chase.targetId]?.nome || ""
    });
  });
  socket.on("assassin:damageTarget", ({ id, targetCharacterId, amount = 1 }) => {
    const assassin = ensureAssassin(id);
    const character = ensureCharacter(targetCharacterId);
    if (!assassin || !character) return;
    const delta = Math.max(1, Math.min(3, Number(amount) || 1));
    damageCharacter(character, delta);
    emitScene(delta >= 2 ? "criticalHit" : "attackHit", {
      assassinId: assassin.id,
      targetCharacterId: character.id,
      assassinName: assassin.nome,
      styleKey: assassin.styleKey,
      targetName: character.nome,
      targetScoped: true,
      description: delta >= 2
        ? "O alvo perde 2 Estados de Saúde."
        : "O alvo perde 1 Estado de Saúde."
    });
  });
  socket.on("assassin:executeTarget", ({ id, targetCharacterId }) => {
    const assassin = ensureAssassin(id);
    const character = ensureCharacter(targetCharacterId);
    if (!assassin || !character) return;
    character.marcasEstado = 3;
    character.morto = true;
    character.estado = "morto";
    emitAudio("state-morto", { characterId: character.id });
    emitScene("execution", {
      assassinId: assassin.id,
      targetCharacterId: character.id,
      assassinName: assassin.nome,
      styleKey: assassin.styleKey,
      targetName: character.nome,
      targetScoped: true,
      description: "O sobrevivente foi executado."
    });
  });
  socket.on("assassin:applyEffectToTarget", ({ id, targetCharacterId, effect }) => {
    const assassin = ensureAssassin(id);
    const character = ensureCharacter(targetCharacterId);
    if (!assassin || !character || !effect?.key) return;
    upsertEffect(character, effect);
    emitCustomScene({
      assassinId: assassin.id,
      targetCharacterId: character.id,
      assassinName: assassin.nome,
      styleKey: assassin.styleKey,
      targetName: character.nome,
      targetScoped: true,
      label: effect.nome || effect.name || "EFEITO APLICADO",
      description: effect.descricao || effect.description || "",
      intensity: effect.intensity || "medium",
      audio: effect.audio || "killerSpecial",
      eventKey: `effect-${sanitizeId(effect.key)}`
    });
  });
  socket.on("assassin:violentAction", ({ id, targetCharacterId, action }) => {
    const assassin = ensureAssassin(id);
    const character = ensureCharacter(targetCharacterId);
    if (!assassin || !action?.key) return;
    if (action.damage && character) damageCharacter(character, Math.max(1, Math.min(3, Number(action.damage) || 1)));
    if (action.effectKey && character) {
      upsertEffect(character, { key: action.effectKey, nome: action.effectName || action.effectLabel || action.effectKey, icon: action.effectIcon || "drop", descricao: action.effectDescription || "", negative: true });
    }
    emitCustomScene({
      assassinId: assassin.id,
      targetCharacterId: character?.id || "",
      assassinName: assassin.nome,
      styleKey: assassin.styleKey,
      targetName: character?.nome || "",
      label: action.label || action.nome || "AÇÃO VIOLENTA",
      description: action.description || action.descricao || "",
      targetScoped: Boolean(character?.id),
      intensity: action.intensity || "medium",
      audio: action.audio || "killerSpecial",
      eventKey: `violent-${sanitizeId(action.key)}`
    });
  });
  socket.on("assassin:tormentAction", ({ id, targetCharacterId, action }) => {
    const assassin = ensureAssassin(id);
    const character = ensureCharacter(targetCharacterId);
    if (!assassin || !action?.key) return;
    if (action.effectKey && character) {
      upsertEffect(character, { key: action.effectKey, nome: action.effectName || action.effectLabel || action.effectKey, icon: action.effectIcon || "face", descricao: action.effectDescription || "", negative: true });
    }
    if (action.setObsession && character) assassin.chase.obsessionId = character.id;
    emitCustomScene({
      assassinId: assassin.id,
      targetCharacterId: character?.id || "",
      assassinName: assassin.nome,
      styleKey: assassin.styleKey,
      targetName: character?.nome || "",
      label: action.label || action.nome || "ATORMENTAR",
      description: action.description || action.descricao || "",
      targetScoped: Boolean(character?.id),
      intensity: action.intensity || "medium",
      audio: action.audio || "killerTorment",
      eventKey: `torment-${sanitizeId(action.key)}`
    });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`\nUma Noite no Inferno — servidor iniciado\nLocal: http://localhost:${PORT}`);
  getLocalIps().forEach((ip) => console.log(`Rede:  http://${ip}:${PORT}`));
  console.log("\nPainel sobreviventes: /mestre\nPainel assassinos:     /assassinos\nFX da stream:          /efeitos\n");
});
