const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cards = require('../public/event-card.js');
const ROOT = path.resolve(__dirname, '..');
for(const [key,filename] of Object.entries(cards.ICONS)) {
  test(`Ícone transparente encontrado: ${key}`, () => {
    const p = path.join(ROOT, 'public/assets/fx/event-cards', filename);
    const data = fs.readFileSync(p);
    assert.equal(data.subarray(1,4).toString(), 'PNG');
    // PNG color type 6 == true-color with alpha
    assert.equal(data[25],6);
    assert.equal(cards.present({eventKey:'effect-'+key}).icon, cards.BASE+filename);
  });
}
test('Condição negativa usa nome/efeito em linhas sem HTML', () => {
  const e = cards.present({eventKey:'effect-quebrado',targetName:'Leandro',label:'Quebrado',description:'Não recupera Estados de Saúde.'});
  assert.equal(e.character,'Leandro');
  assert.equal(e.title,'Quebrado');
  assert.equal(e.verb,'ESTÁ COM');
  assert.ok(e.description.includes('Saúde'));
  assert.ok(e.icon.endsWith('icon-card-quebrado.png'));
});
test('Sorte tem frase específica e ícone positivo', () => {
  const e = cards.present({eventKey:'effect-sorte',targetName:'Ana',label:'Sorte'});
  assert.equal(e.verb,'RECEBEU');
  assert.equal(e.isPositive,true);
});
test('Eventos anteriores continuam com card genérico', () => {
  const hit = cards.present({eventKey:'criticalHit',targetName:'L',label:'GOLPE CRÍTICO'});
  assert.equal(hit.icon,'');
  assert.equal(hit.verb,'SOFREU');
  const chase = cards.present({eventKey:'chaseStart',label:'PERSEGUIÇÃO'});
  assert.equal(chase.character,'CENA');
  assert.equal(chase.icon,'');
});
test('Nenhum valor do socket vira URL de imagem arbitrária', () => {
  assert.equal(cards.present({eventKey:'effect-../../uploads/surpresa'}).icon,'');
});
