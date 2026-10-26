const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { deathAudioType, diceRevealAudioType } = require('../lib/sound-rules');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const context = vm.createContext({ window: {} });
vm.runInContext(read('public/audio.js'), context);
const sounds = context.window.NevoaAudio.sounds;

test('morte alterna entre dois sons definidos uma vez no servidor', () => {
  assert.equal(deathAudioType(() => 0), 'state-morto1');
  assert.equal(deathAudioType(() => 0.49), 'state-morto1');
  assert.equal(deathAudioType(() => 0.5), 'state-morto2');
  assert.equal(deathAudioType(() => 0.99), 'state-morto2');
  assert.equal((read('server.js').match(/emitAudio\(deathAudioType\(\),/g) || []).length, 2);
});

test('a faixa de dado depende do resultado real de 1 a 20', () => {
  for (let result = 1; result <= 20; result++) {
    const expected = result === 1 ? 'roll-reveal-1' : result === 20 ? 'roll-reveal-20' : 'roll-reveal-2-19';
    assert.equal(diceRevealAudioType(result), expected);
  }
  assert.equal(diceRevealAudioType(0), null);
  assert.equal(diceRevealAudioType(21), null);
  assert.match(read('server.js'), /emitAudio\(diceRevealAudioType\(value\)/);
});

test('todas as variantes chegam a ficha, mestre, overlay e áudio do OBS', () => {
  const players = read('public/jogador.js');
  const master = read('public/mestre.js');
  const overlay = read('public/overlay.js');
  const stream = read('public/stream-audio.js');
  const events = {
    'state-morto1': 'stateMorto1',
    'state-morto2': 'stateMorto2',
    'roll-reveal-1': 'rollReveal1',
    'roll-reveal-2-19': 'rollReveal2to19',
    'roll-reveal-20': 'rollReveal20'
  };
  for (const [type, key] of Object.entries(events)) {
    for (const script of [players,master,overlay,stream]) {
      assert.ok(script.includes(`"${type}": ["${key}"`), `${type} não reconhecido em uma tela`);
    }
    assert.ok(sounds[key]?.endsWith('.ogg'), `Som inexistente: ${key}`);
  }
});

test('todos os arquivos de substituição têm OGG real válido', () => {
  const names = [
    'killer-alheio','killer-exausto','killer-exposto','killer-incapacitado','killer-quebrado','killer-sorte','killer-ferida-profunda',
    'stack-add','stack-remove','killer-JUMPSCARE1','killer-JUMPSCARE2','state-ferido','state-machucado','state-morrendo','state-morto1','state-morto2',
    'dice-reveal-1','dice-reveal-2-19','dice-reveal-20'
  ];
  for (const name of names) {
    const bytes = fs.readFileSync(path.join(root, 'public', sounds[Object.keys(sounds).find(key => sounds[key]?.endsWith('/' + name + '.ogg'))] || `/assets/audio/efeitos/${name}.ogg`));
    assert.ok(bytes.length > 100, name);
    assert.equal(bytes.toString('ascii', 0, 4), 'OggS', name);
  }
});

test('a revelação não é mais disparada por temporizador genérico', () => {
  for (const script of ['public/jogador.js','public/mestre.js','public/overlay.js','public/stream-audio.js']) {
    assert.doesNotMatch(read(script), /setTimeout\(\(\) => window\.NevoaAudio\??\.play\("rollReveal"/);
  }
});

// A rolagem utiliza o WAV original; o OGG antigo não é mais necessário.
test('o som inicial da rolagem utiliza o WAV original', () => {
  const source = read('public/audio.js');
  assert.match(source, /rollDice: \"\/assets\/audio\/dados\/dice-roll\.wav\"/);
  const wav = fs.readFileSync(path.join(root, 'public/assets/audio/dados/dice-roll.wav'));
  assert.ok(wav.length > 100);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
});
