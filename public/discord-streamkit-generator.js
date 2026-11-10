/* UNI v78 - OBS StreamKit: CSS de máscara visual, sem bots, tokens ou ponte. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.UNIStreamKitCSS = api;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';

  const DEFAULTS = Object.freeze({ x: 20, y: 20, width: 900, height: 560, shade: 0.58 });
  const VOICE_CLASSES_NOTE = 'OBS 30+ / Discord StreamKit voice (CSS :has)';

  function validateDiscordId(id) {
    const value = String(id == null ? '' : id).trim();
    return /^[0-9]{15,22}$/.test(value) ? value : '';
  }

  function validateStreamKitUrl(raw) {
    try {
      const url = new URL(String(raw || '').trim());
      const host = url.hostname.toLowerCase();
      const validHosts = new Set(['streamkit.discord.com', 'streamkit.discordapp.com']);
      if (url.protocol !== 'https:' || !validHosts.has(host) || !url.pathname.startsWith('/overlay/voice/')) return '';
      return url.href;
    } catch (_error) {
      return '';
    }
  }

  function safeInt(raw, fallback, min, max) {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min || n > max) return fallback;
    return n;
  }

  function safeShade(raw) {
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0.15 && n <= 0.9 ? Math.round(n * 100) / 100 : DEFAULTS.shade;
  }

  function generateCSS(params) {
    const discordId = validateDiscordId(params && params.discordId);
    if (!discordId) throw new Error('Informe um ID numérico válido de usuário do Discord (15 a 22 dígitos).');
    const x = safeInt(params.x, DEFAULTS.x, 0, 9000);
    const y = safeInt(params.y, DEFAULTS.y, 0, 9000);
    const width = safeInt(params.width, DEFAULTS.width, 1, 9000);
    const height = safeInt(params.height, DEFAULTS.height, 1, 9000);
    const shade = safeShade(params.shade);

    return `/* UNI v78 — Discord StreamKit / OBS\n` +
      `   Discord: ${discordId} | retrato: x=${x}, y=${y}, ${width}x${height}\n` +
      `   FONTE: widget VOICE do StreamKit, sobre /overlay/ID do personagem.\n` +
      `   OBS: AMBAS as fontes em 960x720, mesma posição e escala.\n` +
      `   Camada de escurecimento; NÃO controla o DOM da UNI. */\n` +
      `html, body {\n` +
      `  background: transparent !important;\n` +
      `  margin: 0 !important;\n` +
      `  padding: 0 !important;\n` +
      `  overflow: hidden !important;\n` +
      `}\n` +
      `/* Oculta avatares/textos do Discord, mantendo a detecção de voz ativa. */\n` +
      `#app-mount { opacity: 0 !important; pointer-events: none !important; }\n` +
      `/* Filtro de silêncio; no OBS, posicione a fonte StreamKit SOBRE a UNI. */\n` +
      `body::before {\n` +
      `  content: "";\n` +
      `  position: fixed;\n` +
      `  z-index: 2147483647;\n` +
      `  left: ${x}px;\n` +
      `  top: ${y}px;\n` +
      `  width: ${width}px;\n` +
      `  height: ${height}px;\n` +
      `  background: rgba(0, 0, 0, ${shade.toFixed(2)});\n` +
      `  opacity: 1;\n` +
      `  transition: opacity 160ms ease-out;\n` +
      `  pointer-events: none;\n` +
      `}\n` +
      `/* StreamKit recente: o item do usuário ganha wrapper_speaking. */\n` +
      `body:has(li.voice_state[data-userid="${discordId}"].wrapper_speaking)::before,\n` +
      `body:has(li.voice_state[data-userid="${discordId}"] img.voice_avatar.speaking)::before,\n` +
      `/* StreamKit antigo: o avatar tem a classe speaking e o ID na URL. */\n` +
      `body:has(li.voice-state img.avatar.speaking[src*="/avatars/${discordId}/"])::before,\n` +
      `body:has(img[class*="Voice_avatar"][class*="Speaking"][src*="/avatars/${discordId}/"])::before {\n` +
      `  opacity: 0 !important;\n` +
      `}\n`;
  }

  return Object.freeze({ DEFAULTS, VOICE_CLASSES_NOTE, validateDiscordId, validateStreamKitUrl, generateCSS });
});
