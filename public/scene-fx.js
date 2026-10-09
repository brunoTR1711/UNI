(function(){
  const socket = io();
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
    killerExposed:'killerExposed', killerMark:'killerMark', killerMiss:'killerMiss'
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
        '<div class="fx-banner">',
          '<small>EVENTO DO ASSASSINO</small>',
          '<strong></strong>',
          '<p></p>',
          '<em></em>',
        '</div>'
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
    const b = l.querySelector('.fx-banner');

    clearTimeout(fadeTimer);
    clearTimeout(clearTimer);
    clearFxClasses();

    // Reinicia o ciclo sem depender do fim de animações internas.
    // O fade final é aplicado ao contêiner inteiro, evitando piscadas.
    l.className = `scene-fx-layer fx-reset ${fxClasses}`;
    l.style.transition = 'none';
    l.style.opacity = '0';

    b.querySelector('strong').textContent = e.label || e.eventKey || '';
    b.querySelector('p').textContent = e.description || '';
    b.querySelector('em').textContent = e.targetName ? `ALVO: ${e.targetName}` : '';
    b.classList.toggle('has-description', Boolean(e.description));

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
        b.querySelector('strong').textContent = '';
        b.querySelector('p').textContent = '';
        b.querySelector('em').textContent = '';
        b.classList.remove('has-description');
      }, 720);
    }, 4300);

    play(e);
    document.dispatchEvent(new CustomEvent('nevoa:scene-event', { detail:e }));
  }

  socket.on('scene:event', (e)=>{
    if(!e || !Number.isFinite(Number(e.id)) || Number(e.id) <= last) return;
    last = Number(e.id);
    show(e);
  });

  window.addEventListener('pointerdown', async()=>{
    if(!window.NevoaAudio?.isUnlocked?.()) await window.NevoaAudio?.unlock?.();
    panel();
  }, { once:true });

  window.NevoaAudio?.preloadAll?.();
  setTimeout(panel, 500);
  layer();
})();
