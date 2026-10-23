(function () {
  const sounds = {
    // Sons personalizados pelo usuário. Os arquivos OGG deste pacote são modelos silenciosos.
    gained: "/assets/stack-add.ogg",
    lost: "/assets/stack-remove.ogg",
    stateFerido: "/assets/state-ferido.ogg",
    stateMachucado: "/assets/state-machucado.ogg",
    stateMorrendo: "/assets/state-morrendo.ogg",
    stateMorto1: "/assets/state-morto1.ogg",
    stateMorto2: "/assets/state-morto2.ogg",
    rollDice: "/assets/dice-roll.wav", // Som original das rolagens (v67 e anteriores).
    rollReveal1: "/assets/dice-reveal-1.ogg",
    rollReveal2to19: "/assets/dice-reveal-2-19.ogg",
    rollReveal20: "/assets/dice-reveal-20.ogg",
    // Compatibilidade com chamadas antigas de áudio que não identificam o resultado.
    stateMorto: "/assets/state-morto1.ogg",
    rollReveal: "/assets/dice-reveal-2-19.ogg",
    killerJumpscare1: "/assets/killer-JUMPSCARE1.ogg",
    killerJumpscare2: "/assets/killer-JUMPSCARE2.ogg",
    // Outros sons cênicos existentes continuam intactos.
    killerHitLight: "/assets/state-ferido.ogg",
    killerHitHeavy: "/assets/state-machucado.ogg",
    killerCritical: "/assets/state-morrendo.ogg",
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
    killerMiss: "/assets/killer-miss.wav",
    effectFeridaProfunda: "/assets/killer-ferida-profunda.ogg",
    effectQuebrado: "/assets/killer-quebrado.ogg",
    effectIncapacitado: "/assets/killer-incapacitado.ogg",
    effectExposto: "/assets/killer-exposto.ogg",
    effectAlheio: "/assets/killer-alheio.ogg",
    effectExaustao: "/assets/killer-exausto.ogg",
    effectSorte: "/assets/killer-sorte.ogg"
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
      const response = await fetch(url, { cache: url.endsWith(".ogg") ? "no-cache" : "force-cache" });
      if (!response.ok) throw new Error(`Falha ao carregar ${url}`);
      const arrayBuffer = await response.arrayBuffer();
      const decoded = await context.decodeAudioData(arrayBuffer);
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
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
    };
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
