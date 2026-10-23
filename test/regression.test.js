const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
let directory, child, base, client;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exercise Socket.IO over its supported polling transport, without test dependencies.
async function connect() {
  const endpoint = `${base}/socket.io/?EIO=4&transport=polling`;
  const response = await fetch(endpoint);
  const open = await response.text();
  const { sid } = JSON.parse(open.slice(1));
  const url = `${endpoint}&sid=${encodeURIComponent(sid)}`;
  const post = async (packet) => {
    const result = await fetch(url, { method: "POST", body: packet });
    assert.equal(result.status, 200);
  };
  await post("40");
  const packets = (await (await fetch(url)).text()).split("\x1e");
  assert.ok(packets.some((packet) => packet.startsWith('42["state:update"')));
  return {
    emit: (name, data) => post(`42${JSON.stringify([name, data])}`),
    events: async () => {
      const packets = (await (await fetch(url)).text()).split("\x1e");
      if (packets.includes("2")) await post("3");
      return packets.filter((packet) => packet.startsWith("42")).map((packet) => JSON.parse(packet.slice(2)));
    },
    close: () => post("1")
  };
}
async function state() {
  return (await fetch(`${base}/api/state`)).json();
}
async function send(name, data) {
  await client.emit(name, data);
  return state();
}

before(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "uni-regression-"));
  fs.copyFileSync(path.join(root, "server.js"), path.join(directory, "server.js"));
  fs.cpSync(path.join(root, "lib"), path.join(directory, "lib"), { recursive: true });
  fs.cpSync(path.join(root, "public"), path.join(directory, "public"), {
    recursive: true,
    filter: (source) => path.basename(source) !== "uploads"
  });
  child = spawn(process.execPath, [path.join(directory, "server.js")], {
    env: { ...process.env, PORT: "0", NODE_PATH: path.join(root, "node_modules") },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.on("data", (chunk) => { output += chunk; });
  child.stderr.on("data", (chunk) => { output += chunk; });
  // The process writes its actual listening port for isolated tests and PORT=0 callers.
  for (let attempt = 0; attempt < 100; attempt++) {
    const match = output.match(/Local: http:\/\/localhost:(\d+)/);
    if (match) { base = `http://127.0.0.1:${match[1]}`; break; }
    if (child.exitCode !== null) throw new Error(output);
    await delay(30);
  }
  assert.ok(base, output || "Servidor não iniciou");
  client = await connect();
});

after(async () => {
  if (client) await client.close().catch(() => {});
  if (child && child.exitCode === null) {
    const exited = once(child, "exit");
    child.kill();
    await exited;
  }
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
});

test("rotas existentes e revalidação de arquivos sem cache do estado", async () => {
  for (const route of ["/", "/mestre", "/jogadores", "/jogador/ana", "/overlay",
    "/overlay/ana", "/audio", "/assassinos", "/assassino/overlay",
    "/assassino/overlay/ameaca", "/efeitos", "/efeitos/ameaca"]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    assert.match(response.headers.get("content-type"), /text\/html/);
  }
  for (const asset of ["/style.css", "/common.js", "/assets/stack-add.wav"]) {
    const first = await fetch(base + asset);
    assert.equal(first.headers.get("cache-control"), "no-cache");
    const etag = first.headers.get("etag");
    assert.ok(etag);
    const cached = await fetch(base + asset, { cache: "no-cache", headers: { "If-None-Match": etag } });
    assert.equal(cached.status, 304);
    assert.equal((await cached.arrayBuffer()).byteLength, 0);
  }
  assert.equal((await fetch(base + "/api/state")).headers.get("cache-control"), "no-store");
});

test("personagens, bloqueio, estilos exclusivos, recursos, condições, itens e retratos", async () => {
  await send("character:create", { id: "ana", nome: "Ana" });
  await send("character:create", { id: "bia", nome: "Bia" });
  await send("character:setStyleProfile", { id: "ana", style: { key: "escapista" } });
  let result = await send("character:setStyleProfile", { id: "bia", style: { key: "escapista" } });
  assert.equal(result.characters.ana.styleKey, "escapista");
  assert.notEqual(result.characters.bia.styleKey, "escapista");
  await send("character:setLocked", { id: "ana", locked: true });
  result = await send("character:updateText", { id: "ana", field: "nome", value: "Bloqueado" });
  assert.equal(result.characters.ana.nome, "Ana");
  result = await send("character:updateText", { id: "ana", field: "nome", value: "Mestre", role: "master" });
  assert.equal(result.characters.ana.nome, "Mestre");
  await send("character:setLocked", { id: "ana", locked: false });
  await send("resource:setStacks", { id: "ana", resource: "foco", stacks: 3 });
  result = await send("character:setMarks", { id: "ana", marcasEstado: 3 });
  assert.equal(result.characters.ana.estado, "morrendo");
  result = await send("character:setDead", { id: "ana" });
  assert.equal(result.characters.ana.estado, "morto");
  result = await send("character:setMarks", { id: "ana", marcasEstado: 0 });
  assert.equal(result.characters.ana.estado, "saudavel");
  const effect = { key: "teste", nome: "Teste", descricao: "Condição", icon: "star" };
  result = await send("character:setEffect", { id: "ana", effect });
  assert.equal(result.characters.ana.effects[0].key, effect.key);
  result = await send("character:setEffect", { id: "ana", effect, enabled: false });
  assert.equal(result.characters.ana.effects.length, 0);
  await send("character:setItem", { id: "ana", slotIndex: 4,
    item: { key: "bateria", nome: "Bateria", max: 6, charges: 6, icon: "star" } });
  result = await send("item:setCharges", { id: "ana", slotIndex: 4, charges: 2 });
  assert.equal(result.characters.ana.items[4].charges, 2);
  const dataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8XkAAAAASUVORK5CYII=";
  result = await send("character:updatePortrait", { id: "ana", key: "saudavel", dataUrl });
  const portrait = result.characters.ana.portraits.saudavel;
  assert.match(portrait, /^\/uploads\/portraits\//);
  assert.equal((await fetch(base + portrait)).status, 200);
});

test("rolagens mantêm resultado, eventos e duração; alterações rápidas são persistidas", async () => {
  let result = await send("resource:rollD20", { id: "ana", resource: "foco" });
  const roll = result.characters.ana.resources.foco.lastRoll;
  assert.ok(roll.value >= 1 && roll.value <= 20);
  assert.equal(roll.revealAt - roll.at, 3000);
  for (let index = 0; index < 20; index++) {
    result = await send("character:updateText", { id: "ana", field: "nome", value: `Nome ${index}` });
    await delay(15);
  }
  await delay(350);
  const persisted = JSON.parse(fs.readFileSync(path.join(directory, "data/state.json"), "utf8"));
  assert.equal(persisted.characters.ana.nome, "Nome 19");
  assert.equal(persisted.characters.ana.resources.foco.lastRoll.value, roll.value);
  assert.equal(fs.existsSync(path.join(directory, "data/state.json.tmp")), false);
  // Aguarda a janela completa da rolagem (90 ms por frame) mais margem do polling.
  await delay(2500);
  const events = await client.events();
  assert.ok(events.some(([name, data]) => name === "dice:roll" && data.roll.id === roll.id));
  assert.ok(events.some(([name, data]) => name === "dice:frame" && !data.final));
  assert.ok(events.some(([name, data]) => name === "dice:reveal" && data.value === roll.value));
  const expectedReveal = roll.value === 1 ? "roll-reveal-1" : roll.value === 20 ? "roll-reveal-20" : "roll-reveal-2-19";
  assert.ok(events.some(([name, data]) => name === "audio:event" && data.type === expectedReveal && data.rollId === roll.id),
    "Deve emitir o áudio certo só depois do resultado final");
});

test("assassino e comandos de cena continuam afetando o alvo", async () => {
  await send("assassin:create", { id: "ameaca", nome: "Ameaça" });
  let result = await send("assassin:damageTarget", { id: "ameaca", targetCharacterId: "bia", amount: 1 });
  assert.equal(result.characters.bia.estado, "ferido");
  result = await send("assassin:applyEffectToTarget", {
    id: "ameaca", targetCharacterId: "bia", effect: { key: "exposto", nome: "Exposto" }
  });
  assert.equal(result.characters.bia.effects[0].key, "exposto");
  result = await send("assassin:executeTarget", { id: "ameaca", targetCharacterId: "bia" });
  assert.equal(result.characters.bia.estado, "morto");
  assert.ok(result.sceneHistory.length > 0);
  result = await send("character:delete", { id: "bia" });
  assert.equal(result.characters.bia, undefined);
});

test("controlador compartilhado preserva o relógio local e os frames do dado", () => {
  let now = 100;
  const context = vm.createContext({
    window: {}, performance: { now: () => now }, setTimeout,
    document: { querySelectorAll: () => [] }
  });
  vm.runInContext(fs.readFileSync(path.join(root, "public/common.js"), "utf8"), context);
  const dice = context.window.NevoaCommon.createDiceController();
  dice.primeClientRollTiming("roll-1");
  assert.equal(dice.getClientRollTiming("roll-1").revealAt, 3100);
  assert.equal(dice.isClientRollRolling("roll-1"), true);
  dice.applyDiceServerFrame("roll-1", 8);
  assert.equal(dice.getDiceDisplayValue("roll-1", 17), "8");
  dice.applyDiceServerFrame("roll-1", 17, true);
  assert.equal(dice.getDiceDisplayValue("roll-1", 17), "17");
  now = 3200;
  assert.equal(dice.isClientRollRolling("roll-1"), false);
  assert.equal(dice.isClientRollVisible("roll-1"), true);
  now = 11200;
  assert.equal(dice.isClientRollVisible("roll-1"), false);
});


test("inspeção: upload PNG com alfa, catálogo, envio, leitura e histórico independentes", async () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8XkAAAAASUVORK5CYII=", "base64");
  const uploaded = await fetch(`${base}/api/inspection-images`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUrl: `data:image/png;base64,${png.toString("base64")}` })
  });
  assert.equal(uploaded.status, 200);
  const { image } = await uploaded.json();
  assert.match(image, /^\/inspection-images\/arquivo-.*\.png$/);
  assert.deepEqual(Buffer.from(await (await fetch(base + image)).arrayBuffer()), png);

  await client.emit("inspection:saveDocument", {
    title: "Bilhete de teste", body: "Dia 22\n\nNão abra a porta.\n\n— M.",
    style: "handwritten", image
  });
  let current = await state();
  const doc = current.inspectionDocuments.find((d) => d.title === "Bilhete de teste");
  assert.ok(doc);
  await client.emit("inspection:send", { documentId: doc.id, characterIds: ["ana"] });
  current = await state();
  const delivery = current.characters.ana.inspectionDeliveries.find((d) => d.documentId === doc.id);
  assert.equal(delivery.image, image);
  assert.equal(delivery.readAt, null);
  assert.equal(delivery.closedAt, null);
  assert.equal(current.characters.ana.items.length, 5);
  // A apresentação do mestre é independente do que cada jogador lê.
  const live = current.inspectionPresentation;
  assert.ok(live?.id?.startsWith('present-'));
  assert.equal(live.title, 'Bilhete de teste');
  assert.equal(live.reading, false);
  await client.emit("inspection:presentationAction", { id: live.id, action: "read" });
  current = await state();
  assert.equal(current.inspectionPresentation.reading, true);
  assert.equal(current.characters.ana.inspectionDeliveries.find(d => d.id === delivery.id).readAt, null);
  await client.emit("inspection:presentationAction", { id: live.id, action: "close" });
  current = await state();
  assert.equal(current.inspectionPresentation, null);
  assert.ok(current.inspectionPresentationRevision > live.revision);
  await client.emit("inspection:markRead", { characterId: "ana", deliveryId: delivery.id });
  await client.emit("inspection:finish", { characterId: "ana", deliveryId: delivery.id });
  await client.emit("inspection:deleteDocument", { id: doc.id });
  current = await state();
  assert.ok(!current.inspectionDocuments.find((d) => d.id === doc.id));
  assert.ok(!current.characters.ana.inspectionDeliveries.some((d) => d.id === delivery.id),
    "Excluir do catálogo também revoga o histórico já lido.");
});

test("exclusão de documentos revoga leitores, pendências e apresentação FX, sem tocar em outros documentos", async () => {
  const newDoc = async (title) => {
    await client.emit("inspection:saveDocument", { title, body: `Conteúdo: ${title}`, style: "typewritten" });
    return (await state()).inspectionDocuments.find((doc) => doc.title === title);
  };
  // Bia foi removida no teste anterior. Recria para comprovar vários destinatários.
  await client.emit("character:create", { id: "bia", nome: "Bia" });
  const condemned = await newDoc("Documento a excluir");
  const kept = await newDoc("Documento mantido");
  await client.emit("inspection:send", { documentId: kept.id, characterIds: ["ana", "bia"] });
  const keptAna = (await state()).characters.ana.inspectionDeliveries.find(e => e.documentId === kept.id);
  await client.emit("inspection:markRead", { characterId: "ana", deliveryId: keptAna.id });
  await client.emit("inspection:finish", { characterId: "ana", deliveryId: keptAna.id });
  await client.emit("inspection:send", { documentId: condemned.id, characterIds: ["ana", "bia"] });
  let current = await state();
  const toDeleteAna = current.characters.ana.inspectionDeliveries.find(e => e.documentId === condemned.id);
  const toDeleteBia = current.characters.bia.inspectionDeliveries.find(e => e.documentId === condemned.id);
  assert.ok(toDeleteAna && toDeleteBia);
  await client.emit("inspection:markRead", { characterId: "ana", deliveryId: toDeleteAna.id });
  await client.emit("inspection:finish", { characterId: "ana", deliveryId: toDeleteAna.id });
  const live = (await state()).inspectionPresentation;
  assert.equal(live.documentId, condemned.id);
  await client.emit("inspection:deleteDocument", { id: condemned.id });
  current = await state();
  assert.ok(!current.inspectionDocuments.some(doc => doc.id === condemned.id));
  assert.ok(!current.characters.ana.inspectionDeliveries.some(e => e.documentId === condemned.id));
  assert.ok(!current.characters.bia.inspectionDeliveries.some(e => e.documentId === condemned.id));
  assert.ok(current.characters.ana.inspectionDeliveries.some(e => e.id === keptAna.id));
  assert.ok(current.characters.bia.inspectionDeliveries.some(e => e.documentId === kept.id));
  assert.equal(current.inspectionPresentation, null);
  assert.ok(current.inspectionPresentationRevision > live.revision);
  const events = await client.events();
  assert.ok(events.some(([name, payload]) => name === "inspection:presentation" &&
    payload.action === "close" && payload.id === live.id));
  // Eventos de leitura obsoletos não ressuscitam um item apagado.
  await client.emit("inspection:markRead", { characterId: "bia", deliveryId: toDeleteBia.id });
  assert.ok(!(await state()).characters.bia.inspectionDeliveries.some(e => e.documentId === condemned.id));
});
