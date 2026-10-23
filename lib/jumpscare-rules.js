"use strict";

// Variedade decidida uma unica vez no servidor. No futuro o evento pode
// carregar tambem visual: { type: "image", src: "/...", durationMs: ... }.
const VALID_VARIANTS = new Set(["1", "2"]);
function chooseJumpscare(variant = "random", random = Math.random) {
  const requested = String(variant ?? "random");
  if (requested !== "random" && !VALID_VARIANTS.has(requested)) return null;
  const selected = requested === "random" ? (random() < 0.5 ? "1" : "2") : requested;
  return Object.freeze({
    variant: Number(selected),
    audioType: `killerJumpscare${selected}`,
    visual: null, // Reservado para assets visuais posteriores.
    kind: "audio"
  });
}
module.exports = { chooseJumpscare };
