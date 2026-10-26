const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chooseJumpscare } = require("../lib/jumpscare-rules");
const root = path.join(__dirname, "..");

test("aleatório escolhe faixa 1 ou 2 no servidor", () => {
  assert.equal(chooseJumpscare("random", () => 0).audioType, "killerJumpscare1");
  assert.equal(chooseJumpscare("random", () => .999).audioType, "killerJumpscare2");
});
test("mestre pode escolher áudio fixo", () => {
  assert.equal(chooseJumpscare("1").audioType, "killerJumpscare1");
  assert.equal(chooseJumpscare("2").audioType, "killerJumpscare2");
  assert.equal(chooseJumpscare("10"), null);
});
test("evento preparado para visual futuro; audio global tem referências", () => {
  assert.equal(chooseJumpscare("1").visual, null);
  const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
  const player = fs.readFileSync(path.join(root, "public/jogador.js"), "utf8");
  const fx = fs.readFileSync(path.join(root, "public/scene-fx.js"), "utf8");
  const overlay = fs.readFileSync(path.join(root, "public/overlay.js"), "utf8");
  const obsAudio = fs.readFileSync(path.join(root, "public/stream-audio.js"), "utf8");
  assert.match(server, /socket.on\("jumpscare:trigger"/);
  assert.match(server, /io.emit\("jumpscare:event"/);
  for (const source of [player,fx,overlay,obsAudio]) assert.match(source,/killerJumpscare1/);
  for (const variant of [1,2]) {
    const file = path.join(root, `public/assets/audio/jumpscare/killer-JUMPSCARE${variant}.ogg`);
    assert.ok(fs.existsSync(file));
    assert.equal(fs.readFileSync(file).toString("ascii",0,4), "OggS");
  }
});
