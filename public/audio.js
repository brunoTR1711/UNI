(function () {
  const sounds = {
    // Sons personalizados pelo usuário. Os arquivos OGG deste pacote são modelos silenciosos.
    gained: "/assets/audio/recursos/stack-add.ogg",
    lost: "/assets/audio/recursos/stack-remove.ogg",
    stateFerido: "/assets/audio/estados/state-ferido.ogg",
    stateMachucado: "/assets/audio/estados/state-machucado.ogg",
    stateMorrendo: "/assets/audio/estados/state-morrendo.ogg",
    stateMorto1: "/assets/audio/estados/state-morto1.ogg",
    stateMorto2: "/assets/audio/estados/state-morto2.ogg",
    rollDice: "/assets/audio/dados/dice-roll.wav", // Som original das rolagens (v67 e anteriores).
    rollReveal1: "/assets/audio/dados/dice-reveal-1.ogg",
    rollReveal2to19: "/assets/audio/dados/dice-reveal-2-19.ogg",
    rollReveal20: "/assets/audio/dados/dice-reveal-20.ogg",
    // Compatibilidade com chamadas antigas de áudio que não identificam o resultado.
    stateMorto: "/assets/audio/estados/state-morto1.ogg",
    rollReveal: "/assets/audio/dados/dice-reveal-2-19.ogg",
    killerJumpscare1: "/assets/audio/jumpscare/killer-JUMPSCARE1.ogg",
    killerJumpscare2: "/assets/audio/jumpscare/killer-JUMPSCARE2.ogg",
    // Outros sons cênicos existentes continuam intactos.
    killerHitLight: "/assets/audio/estados/state-ferido.ogg",
    killerHitHeavy: "/assets/audio/estados/state-machucado.ogg",
    killerCritical: "/assets/audio/estados/state-morrendo.ogg",
    killerChase: "/assets/audio/cena/killer-chase.wav",
    killerChaseEnd: "/assets/audio/cena/killer-chase-end.wav",
    killerApparition: "/assets/audio/cena/killer-apparition.wav",
    killerBreak: "/assets/audio/cena/killer-break.wav",
    killerDrag: "/assets/audio/cena/killer-drag.wav",
    killerSpecial: "/assets/audio/cena/killer-special.wav",
    killerTorment: "/assets/audio/cena/killer-torment.ogg",
    killerExecution: "/assets/audio/cena/killer-execution.wav",
    killerPhase: "/assets/audio/cena/killer-phase.wav",
    killerExposed: "/assets/audio/cena/killer-exposed.wav",
    killerMark: "/assets/audio/cena/killer-mark.wav",
    killerMiss: "/assets/audio/cena/killer-miss.wav",
    effectFeridaProfunda: "/assets/audio/efeitos/killer-ferida-profunda.ogg",
    effectQuebrado: "/assets/audio/efeitos/killer-quebrado.ogg",
    effectIncapacitado: "/assets/audio/efeitos/killer-incapacitado.ogg",
    effectExposto: "/assets/audio/efeitos/killer-exposto.ogg",
    effectAlheio: "/assets/audio/efeitos/killer-alheio.ogg",
    effectExaustao: "/assets/audio/efeitos/killer-exausto.ogg",
    effectSorte: "/assets/audio/efeitos/killer-sorte.ogg"
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
      // Carregamento sob demanda: não decodificar dezenas de OGGs no gesto do usuário.
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
