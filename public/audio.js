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

  // Mapeamento único: todos os sons saem apenas em /efeitos e /jogador/:id.
  // O servidor escolhe resultado, morte e condição antes de emitir o evento.
  const eventSoundMap = Object.freeze({
    gained: ["gained", 0.74], lost: ["lost", 0.80],
    "state-ferido": ["stateFerido", 0.80],
    "state-machucado": ["stateMachucado", 0.86],
    "state-morrendo": ["stateMorrendo", 0.90],
    "state-morto": ["stateMorto", 0.96],
    "state-morto1": ["stateMorto1", 0.96],
    "state-morto2": ["stateMorto2", 0.96],
    "roll-dice": ["rollDice", 0.80],
    "roll-reveal-1": ["rollReveal1", 0.70],
    "roll-reveal-2-19": ["rollReveal2to19", 0.64],
    "roll-reveal-20": ["rollReveal20", 0.76],
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
    killerMiss: ["killerMiss", 0.68],
    effectFeridaProfunda: ["effectFeridaProfunda", 0.78],
    effectQuebrado: ["effectQuebrado", 0.78],
    effectIncapacitado: ["effectIncapacitado", 0.78],
    effectExposto: ["effectExposto", 0.78],
    effectAlheio: ["effectAlheio", 0.78],
    effectExaustao: ["effectExaustao", 0.78],
    effectSorte: ["effectSorte", 0.78],
    killerJumpscare1: ["killerJumpscare1", 1],
    killerJumpscare2: ["killerJumpscare2", 1]
  });
  const resolveEventSound = type => eventSoundMap[type] || null;

  const buffers = new Map();
  const loading = new Map();
  let audioContext = null;
  let unlocked = false;
  let keepAliveOscillator = null;
  // Mix geral para FX e fichas: ~-7,5 dB antes da compressão de picos.
  // Mantém os OGG originais e o volume relativo entre eventos, sem alterar a distribuição.
  const MASTER_VOLUME = 0.42;
  let outputBus = null;

  function clampVolume(value) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
  }

  function getOutputBus(context) {
    if (outputBus) return outputBus;
    // O compressor é compartilhado: atua também quando dois efeitos se sobrepõem.
    // Na ausência desse recurso, o ganho mestre ainda reduz o volume do áudio.
    const master = context.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(context.destination);
    if (typeof context.createDynamicsCompressor === 'function') {
      const limiter = context.createDynamicsCompressor();
      limiter.threshold.value = -20;
      limiter.knee.value = 10;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.005;
      limiter.release.value = 0.28;
      limiter.connect(master);
      outputBus = limiter;
    } else {
      outputBus = master;
    }
    return outputBus;
  }
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
    gain.gain.value = clampVolume(volume);
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(getOutputBus(context));
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
    // Mesmo teto no fallback de browsers sem WebAudio.
    audio.volume = clampVolume(volume) * MASTER_VOLUME;
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
    resolveEventSound,
    unlock,
    preloadAll,
    play,
    playState,
    isUnlocked,
    getStatus
  };
})();
