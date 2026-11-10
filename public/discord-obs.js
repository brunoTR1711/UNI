/* UNI v78: assistente simples, sem integração com Discord no servidor. */
(() => {
  'use strict';
  const api = window.UNIStreamKitCSS;
  const $ = (id) => document.getElementById(id);
  const nodes = {
    character: $('character'), discordId: $('discord-id'), streamkit: $('streamkit-url'),
    x: $('mask-x'), y: $('mask-y'), width: $('mask-width'), height: $('mask-height'),
    shade: $('shade'), shadeValue: $('shade-value'),
    uniUrl: $('uni-url'), streamkitCopy: $('copy-streamkit-url'), css: $('generated-css'),
    message: $('message'), preview: $('preview-card'), previewName: $('preview-name'),
    previewStatus: $('preview-status'), previewToggle: $('preview-toggle')
  };
  let lastCharacterId = '';
  let speaking = false;
  const params = new URLSearchParams(window.location.search);
  if (params.get('discord') && api.validateDiscordId(params.get('discord'))) nodes.discordId.value = params.get('discord');
  if (params.get('character')) lastCharacterId = params.get('character');

  function update() {
    const characterId = nodes.character.value.trim();
    const hostname = window.location.origin;
    nodes.uniUrl.value = characterId ? `${hostname}/overlay/${encodeURIComponent(characterId)}` : '';
    nodes.streamkitCopy.value = api.validateStreamKitUrl(nodes.streamkit.value);
    nodes.shadeValue.textContent = `${nodes.shade.value}%`;
    nodes.previewName.textContent = nodes.character.selectedOptions[0]?.textContent || 'PERSONAGEM';
    nodes.preview.querySelector('.preview-portrait').style.filter = speaking ? 'brightness(1)' : `brightness(${(1 - Number(nodes.shade.value) / 100).toFixed(2)})`;
    try {
      nodes.css.value = api.generateCSS({
        discordId: nodes.discordId.value,
        x: Number(nodes.x.value), y: Number(nodes.y.value),
        width: Number(nodes.width.value), height: Number(nodes.height.value),
        shade: Number(nodes.shade.value) / 100
      });
      $('copy-css').disabled = false;
      nodes.message.textContent = '';
    } catch (error) {
      nodes.css.value = '';
      $('copy-css').disabled = true;
      nodes.message.textContent = error.message;
    }
    $('copy-uni').disabled = !nodes.uniUrl.value;
    $('copy-streamkit').disabled = !nodes.streamkitCopy.value;
  }

  async function copyValue(value, field) {
    if (!value) return false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        field.focus(); field.select();
        if (!document.execCommand('copy')) throw new Error('copy failed');
      }
      nodes.message.textContent = 'Copiado! Cole nas propriedades da Fonte de navegador no OBS.';
      return true;
    } catch (_error) {
      field.focus(); field.select();
      nodes.message.textContent = 'Selecione o texto e copie com Ctrl+C.';
      return false;
    }
  }

  function setPreview(speakingNow) {
    speaking = speakingNow;
    nodes.preview.classList.toggle('speaking', speaking);
    nodes.previewStatus.textContent = speaking ? 'FALANDO — BRILHO ORIGINAL' : 'SILÊNCIO — RETRATO ESCURECIDO';
    nodes.previewToggle.textContent = speaking ? 'SIMULAR SILÊNCIO' : 'SIMULAR FALA';
    update();
  }

  async function loadCharacters() {
    try {
      const response = await fetch('/api/state', { cache: 'no-store' });
      if (!response.ok) throw new Error('Estado indisponível');
      const state = await response.json();
      const characters = Object.values(state.characters || {}).filter((item) => item && item.id);
      nodes.character.replaceChildren();
      for (const character of characters) {
        const option = document.createElement('option');
        option.value = String(character.id);
        option.textContent = String(character.nome || character.id);
        nodes.character.append(option);
      }
      if (!characters.length) {
        nodes.character.innerHTML = '<option value="">Crie um personagem no painel do mestre</option>';
      } else {
        nodes.character.value = characters.some((c) => c.id === lastCharacterId) ? lastCharacterId : String(characters[0].id);
      }
    } catch (_error) {
      nodes.character.innerHTML = '<option value="">Abra esta página com o servidor UNI ativo</option>';
    }
    update();
  }

  for (const el of [nodes.character, nodes.discordId, nodes.streamkit,
    nodes.x, nodes.y, nodes.width, nodes.height, nodes.shade]) {
    el.addEventListener('input', update);
    el.addEventListener('change', update);
  }
  $('reset-settings').addEventListener('click', () => {
    const d = api.DEFAULTS;
    nodes.x.value = d.x; nodes.y.value = d.y;
    nodes.width.value = d.width; nodes.height.value = d.height;
    nodes.shade.value = Math.round(d.shade * 100);
    update();
  });
  nodes.previewToggle.addEventListener('click', () => setPreview(!speaking));
  $('copy-css').addEventListener('click', () => copyValue(nodes.css.value, nodes.css));
  $('copy-uni').addEventListener('click', () => copyValue(nodes.uniUrl.value, nodes.uniUrl));
  $('copy-streamkit').addEventListener('click', () => copyValue(nodes.streamkitCopy.value, nodes.streamkitCopy));
  loadCharacters();
})();
