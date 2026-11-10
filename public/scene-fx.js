(function(){
  const socket = window.nevoaSocket || (window.nevoaSocket = io({ autoConnect: false }));
  // Attach the overlay's listeners before the server sends its initial snapshot.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => socket.connect(), { once: true });
  } else {
    socket.connect();
  }
  const path = location.pathname;
  const idFromPath = () => path.split('/').filter(Boolean).at(-1) || '';
  const filterId = idFromPath();

  const viewMode = path.startsWith('/overlay/')
    ? 'player-overlay'
    : path === '/overlay'
      ? 'player-overlay-general'
      : path.startsWith('/jogador/')
        ? 'player-sheet'
        : path.startsWith('/efeitos/')
          ? 'effects-target'
          : path === '/efeitos'
            ? 'effects-global'
            : path.startsWith('/assassino/overlay/')
              ? 'assassin-overlay'
              : 'generic';

  let last = 0;
  let fadeTimer = null;
  let clearTimer = null;
  let animationGeneration = 0;

  const isFxPage = viewMode === 'effects-global' || viewMode === 'effects-target';
  // /efeitos é a única página inscrita no canal de áudio da transmissão.
  if (isFxPage) socket.on('connect', () => socket.emit('audio:subscribe', { channel: 'fx' }));

  function layer(){
    let l = document.getElementById('scene-fx-layer');
    if(!l){
      l = document.createElement('div');
      l.id = 'scene-fx-layer';
      l.className = 'scene-fx-layer';
      l.innerHTML = [
        '<div class="fx-vignette"></div>',
        '<div class="fx-flash"></div>',
        '<div class="fx-blood"></div>',
        '<div class="fx-scratches"></div>',
        '<section class="fx-event-card" aria-live="polite">',
          '<img class="fx-event-card__base" src="/assets/fx/event-cards/event-card-basee.png" alt="">',
          '<img class="fx-event-card__icon" alt="" hidden>',
          '<div class="fx-event-card__fallback" hidden><span>✦</span></div>',
          '<div class="fx-event-card__heading">',
            '<span class="fx-event-card__name"></span>',
            '<span class="fx-event-card__verb"></span>',
            '<span class="fx-event-card__effect"></span>',
          '</div>',
          '<p class="fx-event-card__description"></p>',
          '<div class="fx-event-card__scanlines"></div>',
          '<div class="fx-event-card__tracking"></div>',
          '<div class="fx-event-card__glitch"></div>',
        '</section>'
      ].join('');
      document.body.appendChild(l);
    }
    return l;
  }

  function panel(){
    if(!isFxPage) return;
    if(window.NevoaAudio?.isUnlocked?.()) return document.getElementById('fx-audio-panel')?.remove();
    if(document.getElementById('fx-audio-panel')) return;
    const b = document.createElement('button');
    b.id = 'fx-audio-panel';
    b.className = 'fx-audio-panel';
    b.innerHTML = '<strong>ATIVAR SOM</strong><small>clique uma vez em Interagir</small>';
    b.onclick = async()=>{ await window.NevoaAudio?.unlock?.(); panel(); };
    document.body.appendChild(b);
  }

  function isTargeted(e){
    return e?.targetScoped === true || e?.scope === 'target';
  }

  function shouldShow(e){
    const targeted = isTargeted(e);

    if(viewMode === 'player-overlay' || viewMode === 'player-sheet'){
      if(!targeted) return true;
      return Boolean(e.targetCharacterId) && e.targetCharacterId === filterId;
    }

    if(viewMode === 'player-overlay-general'){
      return !targeted;
    }

    if(viewMode === 'effects-target'){
      if(!targeted) return true;
      return Boolean(e.targetCharacterId) && e.targetCharacterId === filterId;
    }

    if(viewMode === 'assassin-overlay'){
      return !e.assassinId || e.assassinId === filterId;
    }

    // /efeitos continua sendo a camada fullscreen completa da stream.
    return true;
  }

  // A apresentação cênica é exclusivamente visual. O som vem de audio:event
  // (uma única vez), nunca do próprio scene:event.
  function clearFxClasses(){
    document.body.classList.remove('screen-shake-light','screen-shake-heavy','screen-shake-extreme');
  }

  function show(e){
    if(!shouldShow(e)) return;
    // Mantém callbacks cênicos usados em algumas telas antigas, mas sem
    // criar event-card, overlay FX ou tocar som fora de /efeitos.
    if (!isFxPage) {
      document.dispatchEvent(new CustomEvent('nevoa:scene-event', { detail: e }));
      return;
    }

    animationGeneration += 1;
    const generation = animationGeneration;
    const l = layer();
    const fxClasses = `fx-${e.eventKey} fx-${e.intensity || 'medium'} style-${e.styleKey || 'acougueiro'}`;
    const b = l.querySelector('.fx-event-card');

    clearTimeout(fadeTimer);
    clearTimeout(clearTimer);
    clearFxClasses();

    // Reinicia o ciclo sem depender do fim de animações internas.
    // O fade final é aplicado ao contêiner inteiro, evitando piscadas.
    l.className = `scene-fx-layer fx-reset ${fxClasses}`;
    l.style.transition = 'none';
    l.style.opacity = '0';

    // Dados do evento chegam pelo mesmo Socket.IO já usado para os FX.
    // Somente a apresentação muda; nunca interpretar HTML vindo da rede.
    const card = window.NevoaEventCards?.present(e);
    if(card){
      b.querySelector('.fx-event-card__name').textContent = card.character;
      b.querySelector('.fx-event-card__verb').textContent = card.verb;
      b.querySelector('.fx-event-card__effect').textContent = card.title;
      b.querySelector('.fx-event-card__description').textContent = card.description;
      const icon = b.querySelector('.fx-event-card__icon');
      const fallback = b.querySelector('.fx-event-card__fallback');
      icon.hidden = !card.icon;
      if(card.icon) icon.src = card.icon;
      fallback.hidden = Boolean(card.icon);
      fallback.querySelector('span').textContent = card.fallback;
      b.classList.toggle('is-positive', card.isPositive);
      b.classList.toggle('is-long', card.isLong);
      b.classList.toggle('is-very-long', card.isVeryLong);
    }

    // Força uma leitura de layout antes da entrada para garantir reinício limpo.
    void l.offsetWidth;
    l.className = `scene-fx-layer is-active ${fxClasses}`;
    l.style.transition = 'opacity 260ms ease-out';
    requestAnimationFrame(()=>{
      if(generation !== animationGeneration) return;
      l.style.opacity = '1';
    });

    document.body.classList.add(`screen-shake-${e.intensity === 'extreme' ? 'extreme' : e.intensity === 'heavy' ? 'heavy' : 'light'}`);

    // 4.3s legíveis + 0.7s de fade contínuo = 5s totais.
    fadeTimer = setTimeout(()=>{
      if(generation !== animationGeneration) return;
      clearFxClasses();
      l.classList.add('is-fading');
      l.style.transition = 'opacity 700ms ease-in';
      l.style.opacity = '0';

      clearTimer = setTimeout(()=>{
        if(generation !== animationGeneration) return;
        l.className = 'scene-fx-layer';
        l.style.transition = 'none';
        l.style.opacity = '0';
        b.querySelector('.fx-event-card__name').textContent = '';
        b.querySelector('.fx-event-card__verb').textContent = '';
        b.querySelector('.fx-event-card__effect').textContent = '';
        b.querySelector('.fx-event-card__description').textContent = '';
        b.classList.remove('is-positive', 'is-long', 'is-very-long');
      }, 720);
    }, 4300);

    document.dispatchEvent(new CustomEvent('nevoa:scene-event', { detail:e }));
  }

  // O servidor entrega áudio somente a esta página e às fichas abertas.
  // O FX global reproduz tudo; /efeitos/:id filtra por personagem.
  let lastFxAudioId = 0;
  let queuedFxAudio = [];
  function playFxAudio(event) {
    const config = window.NevoaAudio?.resolveEventSound?.(event?.type);
    if (!config) return;
    if (!window.NevoaAudio?.isUnlocked?.()) {
      queuedFxAudio.push({ event, queuedAt: Date.now() });
      queuedFxAudio = queuedFxAudio.filter(item => Date.now() - item.queuedAt < 3500).slice(-10);
      panel();
      return;
    }
    window.NevoaAudio.play(config[0], config[1]);
  }
  function flushFxAudio() {
    const pending = queuedFxAudio.filter(item => Date.now() - item.queuedAt < 3500);
    queuedFxAudio = [];
    pending.forEach(({ event }) => playFxAudio(event));
  }
  if (isFxPage) {
    document.addEventListener('nevoa:audio-unlocked', flushFxAudio);
    socket.on('audio:event', (event) => {
      if (!event?.type || (event.id && event.id <= lastFxAudioId)) return;
      lastFxAudioId = event.id || lastFxAudioId + 1;
      if (viewMode === 'effects-target' && event.characterId && event.characterId !== filterId) return;
      playFxAudio(event);
    });
  }

  socket.on('scene:event', (e)=>{
    if(!e || !Number.isFinite(Number(e.id)) || Number(e.id) <= last) return;
    last = Number(e.id);
    show(e);
  });

  window.addEventListener('pointerdown', async()=>{
    if(isFxPage && !window.NevoaAudio?.isUnlocked?.()) await window.NevoaAudio?.unlock?.();
    panel();
  }, { once:true });

  // Áudios são decodificados sob demanda no FX. Overlays não criam camada.
  if (isFxPage) {
    setTimeout(panel, 500);
    layer();
  }
})();
