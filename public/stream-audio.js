const socket = io();
const enableButton = document.getElementById("enable-stream-audio");
const status = document.getElementById("audio-status");
const connectionLabel = document.getElementById("audio-connection");
const engineLabel = document.getElementById("audio-engine");
const loadedLabel = document.getElementById("audio-loaded");
const lastEventLabel = document.getElementById("audio-last-event");

let enabled = localStorage.getItem("nevoa-stream-audio-enabled") === "1";
let lastEventId = 0;
let queue = [];

const map = {
  gained: ["gained", 0.76, "+ PONTO"],
  lost: ["lost", 0.82, "− PONTO"],
  "state-ferido": ["stateFerido", 0.80, "FERIDO"],
  "state-machucado": ["stateMachucado", 0.86, "MACHUCADO"],
  "state-morrendo": ["stateMorrendo", 0.90, "MORRENDO"],
  "state-morto": ["stateMorto", 0.96, "MORTO"],
  "roll-dice": ["rollDice", 0.82, "DADO"],
  killerHitLight: ["killerHitLight", 0.76, "IMPACTO LEVE"],
  killerHitHeavy: ["killerHitHeavy", 0.84, "IMPACTO PESADO"],
  killerCritical: ["killerCritical", 0.92, "GOLPE CRÍTICO"],
  killerChase: ["killerChase", 0.78, "PERSEGUIÇÃO"],
  killerChaseEnd: ["killerChaseEnd", 0.68, "FIM DA PERSEGUIÇÃO"],
  killerApparition: ["killerApparition", 0.78, "APARIÇÃO"],
  killerBreak: ["killerBreak", 0.84, "QUEBRA"],
  killerDrag: ["killerDrag", 0.82, "ARRASTAR"],
  killerSpecial: ["killerSpecial", 0.82, "EFEITO APLICADO"],
  killerTorment: ["killerTorment", 0.82, "TORMENTO"],
  killerExecution: ["killerExecution", 0.96, "EXECUÇÃO"],
  killerPhase: ["killerPhase", 0.90, "NOVA FASE"],
  killerExposed: ["killerExposed", 0.80, "EXPOSTO"],
  killerMark: ["killerMark", 0.78, "ALVO MARCADO"],
  killerMiss: ["killerMiss", 0.68, "GOLPE ERRADO"]
};

function updateDiagnostic() {
  const info = window.NevoaAudio?.getStatus?.() || {};
  engineLabel.textContent = info.unlocked ? "ATIVO" : String(info.contextState || "BLOQUEADO").toUpperCase();
  engineLabel.className = info.unlocked ? "ok" : "warning";
  loadedLabel.textContent = `${info.loaded || 0} / ${info.total || 0}`;

  if (enabled && info.unlocked) {
    status.innerHTML = "Canal ativo. Os efeitos estão prontos para sair no mixer do OBS.";
    document.body.classList.add("audio-ready");
  } else {
    status.innerHTML = 'Use <strong>Interagir</strong> no OBS e clique em <strong>ATIVAR ÁUDIO DO OBS</strong>.';
    document.body.classList.remove("audio-ready");
  }
}

async function enableAudio() {
  enabled = true;
  localStorage.setItem("nevoa-stream-audio-enabled", "1");
  await window.NevoaAudio?.unlock?.();
  await window.NevoaAudio?.play?.("gained", 0.46);
  updateDiagnostic();
  flushQueue();
}

async function playEvent(type) {
  if (!enabled || !window.NevoaAudio?.isUnlocked?.()) {
    queue.push({ type, queuedAt: Date.now() });
    queue = queue.filter((event) => Date.now() - event.queuedAt <= 3500).slice(-8);
    updateDiagnostic();
    return;
  }

  const config = map[type];
  if (!config) return;

  lastEventLabel.textContent = config[2];
  await window.NevoaAudio.play(config[0], config[1]);

  if (type === "roll-dice") {
    setTimeout(() => {
      if (enabled) window.NevoaAudio?.play?.("rollReveal", 0.62);
    }, 3000);
  }
}

function flushQueue() {
  const events = queue.filter((event) => Date.now() - event.queuedAt <= 3500);
  queue = [];
  events.forEach((event, index) => setTimeout(() => playEvent(event.type), index * 90));
}

enableButton.addEventListener("click", enableAudio);
document.getElementById("test-gain").addEventListener("click", async () => { await enableAudio(); playEvent("gained"); });
document.getElementById("test-loss").addEventListener("click", async () => { await enableAudio(); playEvent("lost"); });
document.getElementById("test-damage").addEventListener("click", async () => { await enableAudio(); playEvent("state-machucado"); });
document.getElementById("test-dice").addEventListener("click", async () => { await enableAudio(); playEvent("roll-dice"); });

socket.on("connect", () => {
  connectionLabel.textContent = "ONLINE";
  connectionLabel.className = "ok";
  updateDiagnostic();
});

socket.on("disconnect", () => {
  connectionLabel.textContent = "OFFLINE";
  connectionLabel.className = "warning";
});

socket.on("audio:event", (event) => {
  if (!event || !event.type) return;
  if (event.id && event.id <= lastEventId) return;
  lastEventId = event.id || (lastEventId + 1);
  playEvent(event.type);
});

window.NevoaAudio?.preloadAll?.().then(updateDiagnostic);
if (enabled) window.NevoaAudio?.unlock?.().then(updateDiagnostic);
setInterval(updateDiagnostic, 1500);
updateDiagnostic();
