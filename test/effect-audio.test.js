const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const audioScript = fs.readFileSync(path.join(root, "public", "audio.js"), "utf8");
const effectsScript = fs.readFileSync(path.join(root, "public", "player-catalog.js"), "utf8");
const context = vm.createContext({ window: {} });
vm.runInContext(audioScript, context);
vm.runInContext(effectsScript, context);
const types = context.window.NevoaAudio.sounds;
const effects = context.window.NEVOA_PLAYER_CATALOG.effects;
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const master = fs.readFileSync(path.join(root, "public", "mestre.js"), "utf8");
const overlay = fs.readFileSync(path.join(root, "public", "overlay.js"), "utf8");
const stream = fs.readFileSync(path.join(root, "public", "stream-audio.js"), "utf8");

for (const effect of effects) {
  test(`áudio individual de ${effect.nome} está configurado e é OGG real`, () => {
    assert.ok(effect.audio, "Condição sem tipo de áudio");
    const url = types[effect.audio];
    assert.match(url, /^\/assets\/killer-[a-z-]+\.ogg$/);
    const file = path.join(root, "public", url);
    assert.ok(fs.existsSync(file), `${url} não existe`);
    const bytes = fs.readFileSync(file);
    assert.ok(bytes.length > 100);
    assert.equal(bytes.toString("utf8", 0, 4), "OggS");
    assert.ok(server.includes(`"${effect.key}": "${effect.audio}"`), "Servidor não usa o tipo correspondente");
    assert.ok(overlay.includes(`${effect.audio}: ["${effect.audio}"`), "Overlay não reconhece o evento");
    assert.ok(stream.includes(`${effect.audio}: ["${effect.audio}"`), "Áudio do OBS não reconhece o evento");
  });
}

test("painel do mestre utiliza som próprio do catálogo", () => {
  assert.match(master, /audio: effect\.audio/);
  assert.match(server, /PLAYER_EFFECT_AUDIO\[String\(effect\.key\)\]/);
});
