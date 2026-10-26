/* UNI v73: PNGs substituíveis, com fallback SVG original enquanto imagem = placeholder 1x1. */
(function() {
  'use strict';
  const kinds = new Set(['vantagens', 'efeitos', 'itens', 'atributos', 'estilos', 'vantagens-assassino', 'habilidades-assassino']);
  function safePart(text) { return String(text || '').toLowerCase().replace(/[^a-z0-9_-]/g, ''); }
  function render(kind, key, fallback) {
    const category = safePart(kind), name = safePart(key);
    if (!kinds.has(category) || !name) return fallback || '';
    return `<span class="uni-asset-icon" data-asset-kind="${category}" data-asset-key="${name}"><span class="uni-asset-fallback">${fallback || ''}</span><img class="uni-asset-image" src="/assets/icons/${category}/${name}.png" loading="eager" decoding="async" alt="" onload="if(this.naturalWidth > 1 || this.naturalHeight > 1) this.parentNode.classList.add('uni-asset-loaded')" onerror="this.remove()"></span>`;
  }
  window.UNIAssetIcons = Object.freeze({render});
})();
