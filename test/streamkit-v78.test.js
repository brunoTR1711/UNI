const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const CSS = require('../public/discord-streamkit-generator.js');
const projectRoot = path.join(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(projectRoot, file), 'utf8');

test('v78 valida IDs e não aceita CSS injetado por texto do usuário', () => {
  assert.equal(CSS.validateDiscordId(' 123456789012345678 '), '123456789012345678');
  assert.equal(CSS.validateDiscordId('a123456789012345678'), '');
  assert.equal(CSS.validateDiscordId('1"; } body { display:none'), '');
  assert.throws(() => CSS.generateCSS({ discordId: 'body {color:red}' }), /ID numérico válido/);
  const result = CSS.generateCSS({ discordId: '123456789012345678' });
  assert.ok(!result.includes('undefined'));
});

test('v78 gera uma máscara de silêncio e a remove ao falar no StreamKit atual e legado', () => {
  const id = '987654321098765432';
  const result = CSS.generateCSS({ discordId:id });
  assert.match(result, /position: fixed;/);
  assert.match(result, /width: 900px;/);
  assert.match(result, /height: 560px;/);
  assert.match(result, /background: rgba\(0, 0, 0, 0\.58\)/);
  assert.match(result, /#app-mount \{ opacity: 0/);
  assert.ok(result.includes(`li.voice_state[data-userid="${id}"].wrapper_speaking`));
  assert.ok(result.includes(`img.avatar.speaking[src*="/avatars/${id}/"]`));
  assert.match(result, /body:has\(.*\)::before \{[\s\S]*opacity: 0 !important;/);
});

test('v78 posições são válidas e não perdem a geometria padrão em entradas inválidas', () => {
  const id = '987654321098765432';
  const result = CSS.generateCSS({discordId:id,x:-10,y:'abc',width:0,height:1000,shade:1.5});
  assert.match(result,/left: 20px;/);
  assert.match(result,/top: 20px;/);
  assert.match(result,/width: 900px;/);
  assert.match(result,/height: 1000px;/);
  assert.match(result,/background: rgba\(0, 0, 0, 0\.58\)/);
});

test('v78 aceita apenas URL oficial do widget voice do Discord', () => {
  assert.ok(CSS.validateStreamKitUrl('https://streamkit.discord.com/overlay/voice/123/456?hide_names=true'));
  assert.equal(CSS.validateStreamKitUrl('https://evil.example/overlay/voice/123/456'), '');
  assert.equal(CSS.validateStreamKitUrl('http://streamkit.discord.com/overlay/voice/123/456'), '');
  assert.equal(CSS.validateStreamKitUrl('https://streamkit.discord.com/overlay/chat/123/456'), '');
});

test('v78/v79 preservam a base v76, sem bot ou ponte de áudio', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.version, /^0\.(?:78\.(?:0|1)|79\.0)$/);
  assert.deepEqual(Object.keys(pkg.dependencies).sort(), ['express','socket.io']);
  assert.ok(read('server.js').includes('app.get("/discord-obs"'));
  assert.match(read('public/index.html'), /href="\/discord-obs"/);
  assert.match(read('public/mestre.html'), /href="\/discord-obs"/);
  assert.match(read('public/discord-obs.html'), /OBS/);
  assert.ok(!fs.existsSync(path.join(projectRoot,'tools/discord-voice')));
  const overlay = read('public/overlay.js');
  assert.match(overlay, /getConditionPortrait\(character\)/);
  assert.doesNotMatch(overlay, /audio:subscribe/);
  const players = read('public/jogador.js');
  assert.match(players, /audio:subscribe/);
  const fx = read('public/inspection-fx.js');
  assert.ok(fx.length > 0);
});
