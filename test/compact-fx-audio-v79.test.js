const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

test('v79 Event-Card fica menor, centralizado e no alto da fonte FX', () => {
  const css = read('public/event-card.css');
  assert.match(css, /\.fx-event-card\s*\{[^}]*left:\s*50%;[^}]*top:\s*1\.5vh;[^}]*width:\s*min\(790px,\s*42vw\)/s);
  assert.match(css, /aspect-ratio:\s*1280\s*\/\s*375/);
  assert.match(css, /transform:\s*translate3d\(-50%,\s*0,\s*0\)/);
  assert.match(css, /@media \(max-width:\s*700px\)/);
  assert.match(read('public/effects.html'), /\/event-card\.css\?v=79/);
});

test('v79 mantém os Event-Cards apenas na página FX', () => {
  const fx = read('public/scene-fx.js');
  assert.match(fx, /if \(!isFxPage\)\s*\{/);
  assert.match(fx, /if \(isFxPage\)\s*\{/);
  const effects = read('public/effects.html');
  assert.match(effects, /\/scene-fx\.js/);
  const player = read('public/jogador.js');
  assert.match(player, /resolveEventSound/);
  assert.doesNotMatch(player, /fx-event-card__base/);
});

test('v79 aplica compressor compartilhado e volume mestre reduzido no WebAudio', async () => {
  let context, sources = [], gains = [], compressors = [];
  class AudioContext {
    constructor() { this.state = 'running'; this.destination = {label:'destination'}; context = this; }
    createBufferSource() {
      const source = {buffer:null, connect(target){this.target = target}, disconnect(){}, start(){this.started = true}};
      sources.push(source); return source;
    }
    createGain() {
      const gain = {gain:{value:1}, connect(target){this.target = target}, disconnect(){}};
      gains.push(gain); return gain;
    }
    createDynamicsCompressor() {
      const c = {threshold:{},knee:{},ratio:{},attack:{},release:{},connect(target){this.target = target}};
      compressors.push(c); return c;
    }
    async decodeAudioData(_buffer) { return {ok:true}; }
  }
  const contextVM = vm.createContext({
    window: { AudioContext },
    fetch: async () => ({ok:true,arrayBuffer: async () => new ArrayBuffer(64)}),
    console
  });
  vm.runInContext(read('public/audio.js'), contextVM);
  const audio = contextVM.window.NevoaAudio;
  assert.equal(await audio.play('effectFeridaProfunda', .78), true);
  assert.equal(await audio.play('effectSorte', .78), true);
  assert.equal(gains.length, 3, '1 master + 2 ganhos de evento');
  assert.equal(compressors.length, 1, 'limitador compartilhado por todo o áudio da página');
  assert.equal(gains[1].gain.value, .42);
  assert.equal(gains[1].target, context.destination);
  assert.equal(compressors[0].target, gains[1]);
  assert.equal(compressors[0].threshold.value, -20);
  assert.equal(compressors[0].ratio.value, 8);
  assert.equal(gains[0].gain.value, .78);
  assert.equal(gains[2].gain.value, .78);
  assert.equal(gains[0].target, compressors[0]);
  assert.equal(gains[2].target, compressors[0]);
  assert.ok(sources.every(s => s.started));
});

test('v79 fallback HTMLAudio recebe teto de volume mesmo sem WebAudio', async () => {
  const created = [];
  class Audio {
    constructor(src) { this.src = src; created.push(this); }
    play() { return Promise.resolve(); }
  }
  const contextVM = vm.createContext({window:{}, Audio, console, document:{ dispatchEvent() {} }});
  vm.runInContext(read('public/audio.js'), contextVM);
  const api = contextVM.window.NevoaAudio;
  assert.equal(await api.play('killerJumpscare1', 1), true);
  assert.equal(await api.play('effectAlheio', .78), true);
  assert.equal(created[0].volume, .42);
  assert.ok(created[1].volume < .33 && created[1].volume > .32);
});
