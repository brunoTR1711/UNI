/* UNI v71: catálogo visual dos cards de FX. Somente apresentação; não altera regras/sincronização. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.NevoaEventCards = api;
})(typeof window !== 'undefined' ? window : null, function() {
  'use strict';
  const BASE = '/assets/event-cards/';
  const ICONS = Object.freeze({
    'ferida-profunda': 'icon-card-ferida-profunda.png',
    'quebrado': 'icon-card-quebrado.png',
    'incapacitado': 'icon-card-incapacitado.png',
    'exposto': 'icon-card-exposto.png',
    'alheio': 'icon-card-alheio.png',
    'exaustao': 'icon-card-exausto.png',
    'sorte': 'icon-card-sorte.png'
  });
  const HIT_KEYS = new Set(['attackHit', 'criticalHit', 'attackMiss', 'execution', 'dragged']);
  const name = (text, fallback) => String(text ?? '').trim().slice(0, 100) || fallback;
  function present(event) {
    const e = event || {};
    const key = String(e.eventKey || '');
    const effectKey = key.startsWith('effect-') ? key.slice(7) : '';
    const icon = Object.prototype.hasOwnProperty.call(ICONS, effectKey) ? BASE + ICONS[effectKey] : '';
    const effect = Boolean(icon);
    const title = name(e.label || e.eventKey, 'EVENTO');
    const hasTarget = Boolean(String(e.targetName || '').trim());
    return {
      background: BASE + 'event-card-basee.png',
      icon,
      fallback: HIT_KEYS.has(key) ? '!' : (key === 'chaseStart' || key === 'chaseEnd') ? '»' : '✦',
      character: name(e.targetName || e.assassinName, 'CENA'),
      verb: hasTarget ? (effect ? (effectKey === 'sorte' ? 'RECEBEU' : 'ESTÁ COM') : HIT_KEYS.has(key) ? 'SOFREU' : '—') : '—',
      title,
      description: name(e.description, ''),
      isEffect: effect,
      isLong: String(e.description || '').length > 110,
      isVeryLong: String(e.description || '').length > 185,
      isPositive: effectKey === 'sorte'
    };
  }
  return Object.freeze({ present, ICONS, BASE });
});
