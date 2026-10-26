const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const server = read('server.js');
const master = read('public/mestre.js');
const player = read('public/jogador.js');
const overlay = read('public/overlay.js');
const stream = read('public/stream-audio.js');
const sounds = read('public/audio.js');

// Executa os métodos reais do servidor com dependências simuladas, sem
// alterar os dados da campanha nem exigir que o Express esteja instalado.
const audios = [];
const environment = vm.createContext({
  emitAudio: (type, payload) => audios.push({ type, ...payload }),
  calculateCondition: (marks, dead = false) => dead ? 'morto' :
    marks === 0 ? 'saudavel' : marks === 1 ? 'ferido' : marks === 2 ? 'machucado' : 'morrendo'
});
const fragment = server.match(/function emitHealthStateAudio\(character, previousMarks\) \{[\s\S]*?\n\}\nfunction damageCharacter\(character, delta\) \{[\s\S]*?\n\}/);
assert.ok(fragment, 'Funções de áudio e dano devem existir no servidor');
vm.runInContext(fragment[0], environment);

for (const [previous, damage, expectedMarks, expected] of [
  [0, 1, 1, 'state-ferido'],
  [0, 2, 2, 'state-machucado'],
  [0, 3, 3, 'state-morrendo'],
  [1, 1, 2, 'state-machucado'],
  [1, 2, 3, 'state-morrendo'],
  [2, 1, 3, 'state-morrendo'],
  [2, 3, 3, 'state-morrendo'],
  [3, 1, 3, null],
  [3, 2, 3, null],
]) {
  test(`dano: ${previous} + ${damage} -> ${expectedMarks}; áudio ${expected || 'nenhum'}`, () => {
    audios.length = 0;
    const c = { id: 'teste', marcasEstado: previous, morto: false, estado: '' };
    environment.damageCharacter(c, damage);
    assert.equal(c.marcasEstado, expectedMarks);
    assert.equal(c.estado, expectedMarks === 1 ? 'ferido' : expectedMarks === 2 ? 'machucado' : 'morrendo');
    assert.deepEqual(audios.map(e => e.type), expected ? [expected] : []);
    if (expected) assert.equal(audios[0].characterId, 'teste');
  });
}

test('ficha e painel do mestre utilizam o mesmo emissor do servidor', () => {
  assert.match(server, /function damageCharacter\([\s\S]*?emitHealthStateAudio\(character, previous\);/);
  assert.match(server, /socket\.on\("character:setMarks"[\s\S]*?emitHealthStateAudio\(character, previous\);/);
  assert.match(server, /socket\.on\("assassin:damageTarget"[\s\S]*?damageCharacter\(character, delta\);/);
});

test('todos os receptores reconhecem os 3 áudios OGG de estado', () => {
  for (const [event, sound] of Object.entries({
    'state-ferido': 'stateFerido',
    'state-machucado': 'stateMachucado',
    'state-morrendo': 'stateMorrendo'
  })) {
    for (const [name, source] of Object.entries({ master, player, overlay, stream })) {
      assert.ok(source.includes(`"${event}": ["${sound}"`), `${name}: ${event} não registrado`);
    }
    assert.ok(sounds.includes(`${sound}: "/assets/audio/estados/${event}.ogg"`), `${event}: arquivo de áudio`);
  }
});

test('clique local não reproduz som antes da confirmação do servidor', () => {
  assert.doesNotMatch(master, /playState\(conditionForMarks\(nextMarks\)\)/);
  assert.doesNotMatch(player, /playConditionSound\(conditionForMarks\(nextMarks\)\)/);
  assert.match(master, /if \(kind === "damage-light"\) socket\.emit\("assassin:damageTarget"/);
  assert.match(master, /if \(kind === "damage-heavy"\) socket\.emit\("assassin:damageTarget"/);
  assert.match(master, /if \(kind === "damage-mortal"\) socket\.emit\("assassin:damageTarget"/);
});
