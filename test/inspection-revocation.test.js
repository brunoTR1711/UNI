const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const serverSource = fs.readFileSync(path.resolve(__dirname, '../server.js'), 'utf8');

// Executa os manipuladores reais do servidor, sem abrir portas ou depender
// de um npm install no ambiente de testes. Socket.IO e Express são simulados.
function boot(seed) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'uni66-inspection-'));
  const dataDir = path.join(temp, 'data');
  fs.mkdirSync(dataDir);
  fs.writeFileSync(path.join(dataDir, 'state.json'), JSON.stringify(seed));
  const routes = new Map();
  const handlers = new Map();
  const events = [];
  const app = { use() {}, get(route, handler) { routes.set(route, handler); }, post() {} };
  const express = Object.assign(() => app, { json: () => {}, static: () => {} });
  const server = { address: () => ({ port: 3000 }), listen(_port, _host, fn) { fn(); } };
  const io = {
    on(event, fn) { if (event === 'connection') this.connection = fn; },
    emit(name, data) { events.push({ name, data }); }
  };
  const context = vm.createContext({
    __dirname: temp, process: { env: { PORT: '3000' }, once() {}, exit() {} },
    console: { log() {}, error() {} }, Buffer, setTimeout: () => 1,
    clearTimeout() {},
    require(id) {
      if (id === 'express') return express;
      if (id === 'http') return { createServer: () => server };
      if (id === 'socket.io') return { Server: class { constructor() { return io; } } };
      if (id === 'os') return { networkInterfaces: () => ({}) };
      if (id === './lib/sound-rules') return require('../lib/sound-rules');
      if (id === './lib/jumpscare-rules') return require('../lib/jumpscare-rules');
      return { fs, path, crypto }[id];
    }
  });
  vm.runInContext(serverSource, context, { filename: 'server.js' });
  io.connection({ id: 'test-master', on(name, fn) { handlers.set(name, fn); }, emit() {} });
  const invoke = (name, payload) => {
    let response;
    const handler = handlers.get(name);
    assert.equal(typeof handler, 'function', name);
    handler(payload, result => { response = result; });
    return response;
  };
  return {
    temp, events, invoke,
    getState: () => vm.runInContext('state', context),
    cleanup() { fs.rmSync(temp, { recursive: true, force: true }); }
  };
}

test('remove históricos órfãos já existentes ao iniciar, inclusive apresentação FX', () => {
  const app = boot({
    characters: { ana: { id: 'ana', inspectionDeliveries: [
      { id: 'leitura-antiga', documentId: 'apagado', readAt: 1, closedAt: 2 },
      { id: 'leitura-valida', documentId: 'valido', readAt: 1, closedAt: 2 }
    ] } }, assassins: {}, sceneHistory: [],
    inspectionDocuments: [{ id: 'valido', title: 'Documento válido', body: 'Texto' }],
    inspectionPresentation: { id: 'p-antigo', documentId: 'apagado' },
    inspectionPresentationRevision: 1
  });
  try {
    const data = app.getState();
    assert.deepEqual(Array.from(data.characters.ana.inspectionDeliveries, e => e.id), ['leitura-valida']);
    assert.equal(data.inspectionPresentation, null);
    assert.equal(data.inspectionPresentationRevision, 2);
    const saved = JSON.parse(fs.readFileSync(path.join(app.temp, 'data/state.json')));
    assert.deepEqual(saved.characters.ana.inspectionDeliveries.map(e => e.id), ['leitura-valida']);
  } finally { app.cleanup(); }
});

test('excluir no mestre revoga lidos, pendentes e apresentação, sem afetar outro documento', () => {
  const app = boot({ characters: {}, assassins: {}, sceneHistory: [], inspectionDocuments: [] });
  try {
    app.invoke('character:create', { id: 'ana', nome: 'Ana' });
    app.invoke('character:create', { id: 'bia', nome: 'Bia' });
    const deleted = app.invoke('inspection:saveDocument', { title: 'Apagar', body: 'Pista secreta', style: 'handwritten' }).document;
    const kept = app.invoke('inspection:saveDocument', { title: 'Manter', body: 'Segunda pista', style: 'plain' }).document;
    app.invoke('inspection:send', { documentId: kept.id, characterIds: ['ana'] });
    const answer = app.invoke('inspection:send', { documentId: deleted.id, characterIds: ['ana', 'bia'] });
    assert.equal(answer.count, 2);
    const data = app.getState();
    const received = data.characters.ana.inspectionDeliveries.find(e => e.documentId === deleted.id);
    const pending = data.characters.bia.inspectionDeliveries.find(e => e.documentId === deleted.id);
    assert.ok(received && pending);
    app.invoke('inspection:markRead', { characterId: 'ana', deliveryId: received.id });
    app.invoke('inspection:finish', { characterId: 'ana', deliveryId: received.id });
    const presentationId = data.inspectionPresentation.id;
    assert.equal(app.invoke('inspection:deleteDocument', { id: deleted.id }).removedDeliveries, 2);
    assert.ok(!data.inspectionDocuments.some(doc => doc.id === deleted.id));
    assert.ok(!data.characters.ana.inspectionDeliveries.some(e => e.documentId === deleted.id));
    assert.ok(!data.characters.bia.inspectionDeliveries.some(e => e.documentId === deleted.id));
    assert.equal(data.characters.ana.inspectionDeliveries.length, 1);
    assert.equal(data.characters.ana.inspectionDeliveries[0].documentId, kept.id);
    assert.equal(data.inspectionPresentation, null);
    assert.ok(app.events.some(e => e.name === 'inspection:presentation' && e.data.action === 'close' && e.data.id === presentationId));
    assert.ok(app.events.some(e => e.name === 'state:update' && e.data.inspectionPresentation === null));
    assert.equal(app.invoke('inspection:markRead', { characterId: 'bia', deliveryId: pending.id }).ok, false);
  } finally { app.cleanup(); }
});

test('jumpscare global envia a mesma faixa para todos, sem modificar o estado', () => {
  const app = boot({ characters: { ana: { id: 'ana', nome: 'Ana' } }, assassins: {}, sceneHistory: [], inspectionDocuments: [] });
  try {
    const before = JSON.stringify(app.getState().characters);
    const response = app.invoke('jumpscare:trigger', { variant: '2' });
    assert.equal(response.ok, true);
    assert.equal(response.variant, 2);
    const presentation = app.events.find(e => e.name === 'jumpscare:event');
    const audio = app.events.find(e => e.name === 'audio:event');
    assert.equal(presentation.data.kind, 'audio');
    assert.equal(presentation.data.scope, 'global');
    assert.equal(presentation.data.visual, null);
    assert.equal(presentation.data.audioType, 'killerJumpscare2');
    assert.equal(audio.data.type, presentation.data.audioType);
    assert.equal(audio.data.global, true);
    assert.equal(audio.data.jumpscareEventId, presentation.data.id);
    assert.equal(JSON.stringify(app.getState().characters), before);
    assert.equal(app.invoke('jumpscare:trigger', { variant: '3' }).ok, false);
    assert.equal(app.invoke('jumpscare:trigger', { variant: '1' }).ok, false); // proteção contra duplo clique
  } finally { app.cleanup(); }
});
