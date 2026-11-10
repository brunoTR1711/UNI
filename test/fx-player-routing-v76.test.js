const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const server = read('server.js');
const player = read('public/jogador.js');
const overlay = read('public/overlay.js');
const master = read('public/mestre.js');
const fx = read('public/scene-fx.js');
const audio = read('public/audio.js');

// Executa a implementação real da distribuição em um IO simulado, sem
// dependências e sem iniciar o servidor ou alterar dados dos jogadores.
function makeAudioBus() {
  const sent = [];
  const io = {
    to(first) {
      const rooms = new Set([first]);
      const operator = {
        to(name) { rooms.add(name); return operator; },
        emit(type, event) { sent.push({ rooms: [...rooms], type, event }); }
      };
      return operator;
    }
  };
  const fragment = server.match(/const FX_AUDIO_ROOM = "audio:fx";[\s\S]*?\n}\nfunction broadcastScene/);
  assert.ok(fragment, 'Não foi possível localizar emitAudio no servidor');
  const ctx = vm.createContext({io, sanitizeId: id => typeof id === 'string' ? id.replace(/[^a-z0-9_-]/g,'') : '', Date, audioSequence: 0});
  vm.runInContext(fragment[0].replace(/\nfunction broadcastScene$/, ''),ctx);
  return {sent, emit(type, payload={}){ctx.__payload = payload; ctx.__type=type; vm.runInContext('emitAudio(__type,__payload)', ctx);}};
}

test('som de condição/dano chega somente ao FX e à ficha do personagem atingido',()=>{
  const bus=makeAudioBus();
  bus.emit('effectQuebrado',{characterId:'alice'});
  assert.equal(bus.sent.length,1);
  assert.deepEqual(new Set(bus.sent[0].rooms),new Set(['audio:fx','audio:player:alice']));
  assert.equal(bus.sent[0].type,'audio:event');
  assert.equal(bus.sent[0].event.characterId,'alice');
  bus.emit('state-machucado',{characterId:'bob'});
  assert.deepEqual(new Set(bus.sent[1].rooms),new Set(['audio:fx','audio:player:bob']));
});

test('jumpscare e cena global chegam ao FX e a todas as fichas abertas, nunca ao mestre/overlay',()=>{
  const bus=makeAudioBus();
  bus.emit('killerJumpscare2',{global:true});
  assert.deepEqual(new Set(bus.sent[0].rooms),new Set(['audio:fx','audio:players']));
  assert.equal(bus.sent[0].event.type,'killerJumpscare2');
  bus.emit('killerChase',{sceneEventId:15});
  assert.deepEqual(new Set(bus.sent[1].rooms),new Set(['audio:fx','audio:players']));
  assert.doesNotMatch(server,/io\.emit\("audio:event"/);
});

test('inscrição do servidor reconhece FX, ficha, não permite inscrição em outras salas por engano',()=>{
  const fragment = server.match(/socket\.on\("audio:subscribe", \(payload = \{\}\) => \{[\s\S]*?\n  \}\);/);
  assert.ok(fragment, 'Handler de inscrição não encontrado');
  const handlers={}; const joined=new Set();
  const socket={ data:{}, on(type,fn){handlers[type]=fn;},join(room){joined.add(room);},leave(room){joined.delete(room);} };
  vm.runInNewContext(fragment[0], {socket, FX_AUDIO_ROOM:'audio:fx', PLAYERS_AUDIO_ROOM:'audio:players', sanitizeId:id=>typeof id==='string'?id.replace(/[^a-z0-9_-]/g,''):'' });
  handlers['audio:subscribe']({channel:'overlay'});
  assert.equal(joined.size,0);
  handlers['audio:subscribe']({channel:'fx'});
  assert.deepEqual([...joined],['audio:fx']);
  handlers['audio:subscribe']({channel:'player',characterId:'alice'});
  assert.deepEqual(new Set(joined),new Set(['audio:player:alice','audio:players']));
  handlers['audio:subscribe']({channel:'player',characterId:'bob'});
  assert.deepEqual(new Set(joined),new Set(['audio:player:bob','audio:players']));
});

test('event-cards são renderizados apenas em /efeitos; overlay usa cena apenas para reação',()=>{
  assert.match(fx,/if \(!isFxPage\) \{[\s\S]*?document\.dispatchEvent\(new CustomEvent\('nevoa:scene-event'/);
  assert.match(fx,/if \(isFxPage\) \{\s*setTimeout\(panel, 500\);\s*layer\(\);/);
  assert.doesNotMatch(player,/fx-event-card/);
  // Ainda que o JS da cena permaneça carregado no overlay, a tela é silenciosa.
  const callbacks={}; let created=0, calledAudio=0, dispatched=0;
  const socket={on(type,cb){callbacks[type]=cb;},connect(){}};
  const fakeDocument={readyState:'complete', addEventListener(){}, createElement(){created++;return{};}, dispatchEvent(){dispatched++;}};
  const fakeWindow={nevoaSocket:socket, addEventListener(){},NevoaAudio:{unlock(){calledAudio++;},play(){calledAudio++;}}};
  vm.runInNewContext(fx,{window:fakeWindow,document:fakeDocument,location:{pathname:'/overlay/alice'},CustomEvent: class {constructor(type,options){this.type=type;this.detail=options.detail;}},setTimeout,clearTimeout,requestAnimationFrame(){} });
  callbacks['scene:event']({id:1,eventKey:'effect-quebrado',targetScoped:true,targetCharacterId:'alice',audio:'effectQuebrado'});
  assert.equal(created,0,'O overlay não pode criar event-card ou camada de FX');
  assert.equal(calledAudio,0,'O overlay nunca reproduz som');
  assert.equal(dispatched,1,'As reações visuais antigas continuam recebendo a cena');
});

test('FX não toca o mesmo som duas vezes a partir de scene:event + audio:event',()=>{
  const show=fx.slice(fx.indexOf('  function show(e){'),fx.indexOf('  // O servidor entrega áudio',fx.indexOf('  function show(e){')));
  assert.doesNotMatch(show,/NevoaAudio\.play/);
  assert.doesNotMatch(show,/\bplay\(e\)/);
  assert.match(fx,/socket\.on\('audio:event'/);
  assert.match(fx,/lastFxAudioId/);
});

test('ficha mostra flash leve apenas quando um efeito sonoro de condição é recebido',()=>{
  assert.match(player,/if \(CONDITION_SOUND_TYPES\.has\(event\.type\)\) flashAppliedEffect\(\);/);
  assert.match(read('public/style.css'),/uni-effect-applied-flash \.48s/);
  const callbacks={}; const root={getBoundingClientRect(){return {left:20,top:40,width:400,height:600};}};
  const flash={style:{},classList:{remove(){},add(name){if(name==='is-flashing')this.count=(this.count||0)+1;}},offsetWidth:400,setAttribute(){},className:''};
  let attached=false; let sounds=[];
  const document={getElementById(name){return name==='player-applied-effect-flash'&&attached?flash:null;},createElement(){return flash;},body:{appendChild(){attached=true;}}};
  const window={NevoaAudio:{resolveEventSound(type){return ['effectQuebrado','stateMachucado'].includes(type)?[type,0.8]:null;},play(...args){sounds.push(args);}}};
  const code=player.slice(player.indexOf('function flashAppliedEffect()'),player.indexOf('socket.emit("character:create"'));
  vm.runInNewContext(code,{socket:{on(type,fn){callbacks[type]=fn;}},document,window,id:'alice',root,lastPlayerAudioEventId:0,CONDITION_SOUND_TYPES:new Set(['effectQuebrado'])});
  callbacks['audio:event']({id:1,type:'effectQuebrado',characterId:'bob'});
  assert.equal(flash.classList.count || 0,0,'Outro personagem não causa flash');
  callbacks['audio:event']({id:2,type:'effectQuebrado',characterId:'alice'});
  assert.equal(flash.classList.count,1);
  assert.equal(sounds.length,1);
  assert.equal(flash.style.width,'400px');
  callbacks['audio:event']({id:3,type:'stateMachucado',characterId:'alice'});
  assert.equal(flash.classList.count,1,'Dano não usa o flash leve de efeito');
});

test('mestre, overlay e /audio nunca reproduzem sons; páginas FX e jogador se inscrevem',()=>{
  assert.doesNotMatch(master,/NevoaAudio(?:\?\.)?\.play(?:\?\.)?\(/);
  assert.doesNotMatch(overlay,/NevoaAudio(?:\?\.)?\.play(?:\?\.)?\(/);
  assert.doesNotMatch(read('public/audio.html'),/stream-audio\.js|\/audio\.js/);
  assert.match(player,/socket\.on\('connect', \(\) => socket\.emit\('audio:subscribe'/);
  assert.match(fx,/socket\.on\('connect', \(\) => socket\.emit\('audio:subscribe'/);
  assert.match(audio,/resolveEventSound/);
});
