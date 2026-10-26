const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const map=JSON.parse(read('lib/legacy-assets-map.json'));
const publicRoot=path.join(root,'public');
test('URLs antigas de assets têm destinos existentes',()=>{
  for(const [oldPath,newPath] of Object.entries(map)){
    assert.ok(fs.existsSync(path.join(publicRoot,newPath)),`${oldPath} => ${newPath}`);
  }
});
test('placeholder transparente preserva símbolo original até substituição',()=>{
  const source=read('public/asset-icons.js');
  assert.match(source,/naturalWidth > 1/);
  const icons=path.join(publicRoot,'assets/icons');
  for(const kind of fs.readdirSync(icons)){
    const folder=path.join(icons,kind);
    if(!fs.statSync(folder).isDirectory())continue;
    for(const file of fs.readdirSync(folder)){
      assert.ok(file.endsWith('.png'));
      const buf=fs.readFileSync(path.join(folder,file));
      assert.equal(buf.readUInt32BE(16),1);
      assert.equal(buf.readUInt32BE(20),1);
      assert.equal(buf[25],6);
    }
  }
});
test('cores do servidor e navegador concordam',()=>{
  const server=read('server.js'), common=read('public/common.js');
  for(const color of ['vermelho','amarelo','turquesa']){
    assert.ok(server.includes('"'+color+'"'));
    assert.ok(common.includes(color+': {'));
  }
});
test('entrada e nomes no overlay estão limpos',()=>{
  const overlay=read('public/overlay.js');
  assert.doesNotMatch(overlay, /<div class="vhs-character-name">\*/);
  assert.doesNotMatch(overlay,/<strong>ESTILO<\/strong>/);
  const home=read('public/index.html');
  assert.match(home,/Como entrar na sala\?/);
  assert.doesNotMatch(home,/network-list/);
});
test('audio não carrega todos os arquivos ao desbloquear em mobile',()=>{
  const audio=read('public/audio.js');
  assert.doesNotMatch(audio,/startKeepAlive\(\);\s*await preloadAll\(\)/);
});
