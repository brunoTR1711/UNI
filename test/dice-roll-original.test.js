const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('som de rolagem D20 usa o WAV original audível, não o OGG silencioso', () => {
  const ctx = vm.createContext({window:{}});
  vm.runInContext(read('public/audio.js'), ctx);
  const mapped = ctx.window.NevoaAudio.sounds.rollDice;
  assert.equal(mapped, '/assets/audio/dados/dice-roll.wav');
  const asset = fs.readFileSync(path.join(root, 'public', mapped));
  assert.ok(asset.length > 160000);
  assert.equal(asset.toString('ascii', 0, 4), 'RIFF');
  assert.equal(asset.toString('ascii', 8, 12), 'WAVE');
  const pcm = asset.subarray(44);
  assert.ok(pcm.some((byte) => byte !== 0), 'arquivo WAV não pode estar vazio');
});

test('início da rolagem atende apenas ao FX e à ficha aberta, via servidor', () => {
  assert.match(read('server.js'), /emitAudio\("roll-dice",\s*\{/);
  assert.match(read('public/audio.js'), /"roll-dice": \["rollDice"/);
  assert.match(read('public/jogador.js'), /audio:subscribe.*channel: 'player'/);
  assert.match(read('public/scene-fx.js'), /audio:subscribe.*channel: 'fx'/);
  for (const file of ['public/mestre.js','public/overlay.js']) {
    assert.doesNotMatch(read(file), /NevoaAudio(?:\?\.)?\.play(?:\?\.)?\(/);
  }
});

test('apenas os canais autorizados carregam o módulo de áudio atualizado', () => {
  for (const page of ['jogador.html', 'effects.html']) {
    assert.match(read(`public/${page}`), /\/audio\.js\?v=(?:76|79)/);
  }
  assert.doesNotMatch(read('public/audio.html'), /\/audio\.js/);
  for (const page of ['mestre.html', 'overlay.html', 'assassino-overlay.html']) {
    assert.match(read(`public/${page}`), /\/audio\.js\?v=(?:76|79)/); // carregado, mas não acionado
  }
});
