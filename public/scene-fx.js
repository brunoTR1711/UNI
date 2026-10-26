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

  const audioMap = {
    killerHitLight:'killerHitLight', killerHitHeavy:'killerHitHeavy', killerCritical:'killerCritical',
    killerChase:'killerChase', killerChaseEnd:'killerChaseEnd', killerApparition:'killerApparition',
    killerBreak:'killerBreak', killerDrag:'killerDrag', killerSpecial:'killerSpecial',
    killerTorment:'killerTorment', killerExecution:'killerExecution', killerPhase:'killerPhase',
    killerExposed:'killerExposed', killerMark:'killerMark', killerMiss:'killerMiss',
    effectFeridaProfunda:'effectFeridaProfunda', effectQuebrado:'effectQuebrado', effectIncapacitado:'effectIncapacitado', effectExposto:'effectExposto', effectAlheio:'effectAlheio', effectExaustao:'effectExaustao', effectSorte:'effectSorte'
  };

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

  async function play(e){
    // Em overlays de jogador, overlay.js já reproduz o audio:event filtrado pelo alvo.
    if(viewMode === 'player-overlay' || viewMode === 'player-overlay-general') return;
    if(!e.audio) return;
    if(!window.NevoaAudio?.isUnlocked?.()){ panel(); return; }
    await window.NevoaAudio.play(audioMap[e.audio] || e.audio, e.intensity === 'extreme' ? .94 : e.intensity === 'heavy' ? .82 : .68);
  }

  function clearFxClasses(){
    document.body.classList.remove('screen-shake-light','screen-shake-heavy','screen-shake-extreme');
  }

  function show(e){
    if(!shouldShow(e)) return;

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

    play(e);
    document.dispatchEvent(new CustomEvent('nevoa:scene-event', { detail:e }));
  }

  // Efeitos globais exclusivamente sonoros. A camada /efeitos os reproduz,
  // mas overlays individuais são atendidos por overlay.js (sem duplicação).
  let lastJumpscareAudioId = 0;
  socket.on('audio:event', (event) => {
    if (viewMode !== 'effects-global' && viewMode !== 'effects-target' && viewMode !== 'assassin-overlay') return;
    if (event?.type !== 'killerJumpscare1' && event?.type !== 'killerJumpscare2') return;
    if (event.id && event.id <= lastJumpscareAudioId) return;
    lastJumpscareAudioId = event.id || lastJumpscareAudioId + 1;
    if (!window.NevoaAudio?.isUnlocked?.()) { panel(); return; }
    window.NevoaAudio?.play?.(event.type, 1);
  });

  socket.on('scene:event', (e)=>{
    if(!e || !Number.isFinite(Number(e.id)) || Number(e.id) <= last) return;
    last = Number(e.id);
    show(e);
  });

  window.addEventListener('pointerdown', async()=>{
    if(!window.NevoaAudio?.isUnlocked?.()) await window.NevoaAudio?.unlock?.();
    panel();
  }, { once:true });

  // Áudios são decodificados sob demanda; evita travar Android na abertura. 
  setTimeout(panel, 500);
  layer();
})();
