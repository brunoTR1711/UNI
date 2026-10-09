(function () {
  const sounds = {
    gained: "/assets/stack-add.wav",
    lost: "/assets/stack-remove.wav",
    stateFerido: "/assets/state-ferido.wav",
    stateMachucado: "/assets/state-machucado.wav",
    stateMorrendo: "/assets/state-morrendo.wav",
    stateMorto: "/assets/state-morto-flatline.wav",
    rollDice: "/assets/dice-roll.wav",
    rollReveal: "/assets/dice-reveal.wav",
    killerHitLight: "/assets/killer-hit-light.wav",
    killerHitHeavy: "/assets/killer-hit-heavy.wav",
    killerCritical: "/assets/killer-critical.wav",
    killerChase: "/assets/killer-chase.wav",
    killerChaseEnd: "/assets/killer-chase-end.wav",
    killerApparition: "/assets/killer-apparition.wav",
    killerBreak: "/assets/killer-break.wav",
    killerDrag: "/assets/killer-drag.wav",
    killerSpecial: "/assets/killer-special.wav",
    killerTorment: "/assets/killer-torment.wav",
    killerExecution: "/assets/killer-execution.wav",
    killerPhase: "/assets/killer-phase.wav",
    killerExposed: "/assets/killer-exposed.wav",
    killerMark: "/assets/killer-mark.wav",
    killerMiss: "/assets/killer-miss.wav"
  };

  const buffers = new Map();
  const loading = new Map();
  let audioContext = null;
  let unlocked = false;
  let keepAliveOscillator = null;

  function getAudioContext() {
    if (!audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioContext = new AudioContextClass();
    }
    return audioContext;
  }

  async function loadBuffer(type) {
    if (buffers.has(type)) return buffers.get(type);
    if (loading.has(type)) return loading.get(type);

    const url = sounds[type];
    if (!url) return null;

    const promise = (async () => {
      const context = getAudioContext();
      if (!context) return null;
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) throw new Error(`Falha ao carregar ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await context.decodeAudioData(arrayBuffer.slice(0));
      buffers.set(type, decoded);
      return decoded;
    })().catch((error) => {
      console.warn("Falha ao preparar áudio:", type, error);
      return null;
    }).finally(() => loading.delete(type));

    loading.set(type, promise);
    return promise;
  }

  async function preloadAll() {
    await Promise.all(Object.keys(sounds).map(loadBuffer));
    return buffers.size;
  }

  function startKeepAlive() {
    const context = getAudioContext();
    if (!context || keepAliveOscillator) return;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    gain.gain.value = 0.00001;
    oscillator.frequency.value = 18;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    keepAliveOscillator = oscillator;
  }

  async function unlock() {
    const context = getAudioContext();
    if (!context) return false;

    try {
      if (context.state === "suspended") await context.resume();
      startKeepAlive();
      await preloadAll();
      unlocked = context.state === "running";
      document.dispatchEvent(new CustomEvent(unlocked ? "nevoa:audio-unlocked" : "nevoa:audio-blocked"));
      return unlocked;
    } catch (error) {
      console.warn("Não foi possível desbloquear o áudio:", error);
      document.dispatchEvent(new CustomEvent("nevoa:audio-blocked"));
      return false;
    }
  }

  async function playWithWebAudio(type, volume) {
    const context = getAudioContext();
    if (!context) return false;
    if (context.state === "suspended") {
      try { await context.resume(); } catch (_) {}
    }
    if (context.state !== "running") return false;

    const buffer = await loadBuffer(type);
    if (!buffer) return false;

    const source = context.createBufferSource();
    const gain = context.createGain();
    gain.gain.value = Math.max(0, Math.min(1, volume));
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(context.destination);
    source.start(0);
    unlocked = true;
    return true;
  }

  function playWithHtmlAudio(type, volume) {
    const src = sounds[type];
    if (!src) return false;
    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = Math.max(0, Math.min(1, volume));
    audio.play().catch(() => {
      document.dispatchEvent(new CustomEvent("nevoa:audio-blocked"));
    });
    return true;
  }

  async function play(type, volume = 0.65) {
    const src = sounds[type];
    if (!src) return false;

    try {
      const ok = await playWithWebAudio(type, volume);
      if (ok) return true;
    } catch (error) {
      console.warn("WebAudio falhou, usando fallback:", error);
    }

    return playWithHtmlAudio(type, volume);
  }

  function playState(condition, volume = 0.72) {
    const soundByCondition = {
      ferido: "stateFerido",
      machucado: "stateMachucado",
      morrendo: "stateMorrendo",
      morto: "stateMorto"
    };
    const type = soundByCondition[condition];
    return type ? play(type, volume) : false;
  }

  function isUnlocked() {
    return unlocked && getAudioContext()?.state === "running";
  }

  function getStatus() {
    const context = getAudioContext();
    return {
      unlocked: isUnlocked(),
      contextState: context?.state || "indisponível",
      loaded: buffers.size,
      total: Object.keys(sounds).length
    };
  }

  window.NevoaAudio = {
    sounds,
    unlock,
    preloadAll,
    play,
    playState,
    isUnlocked,
    getStatus
  };
})();
