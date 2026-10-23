"use strict";
// A escolha acontece no servidor para todos os dispositivos ouvirem o mesmo som.
function deathAudioType(random = Math.random) {
  return random() < 0.5 ? "state-morto1" : "state-morto2";
}
function diceRevealAudioType(value) {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 1 || result > 20) return null;
  if (result === 1) return "roll-reveal-1";
  if (result === 20) return "roll-reveal-20";
  return "roll-reveal-2-19";
}
module.exports = { deathAudioType, diceRevealAudioType };
