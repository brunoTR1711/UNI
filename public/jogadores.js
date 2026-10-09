const socket = io();
const Common = window.NevoaCommon;
const CAT = window.NEVOA_PLAYER_CATALOG;
const grid = document.getElementById("players-grid");
const { escapeHtml, getConditionPortrait, formatCondition } = Common;

function svg(key) {
  return CAT?.svg?.[key] || CAT?.svg?.star || "";
}

function getStyle(character) {
  return CAT.styles.find((entry) => entry.key === character.styleKey) || null;
}

function renderCharacters(state) {
  const characters = Object.values(state?.characters || {})
    .filter(Boolean)
    .sort((a, b) => String(a.nome || a.id).localeCompare(String(b.nome || b.id), "pt-BR"));

  if (!characters.length) {
    grid.innerHTML = `
      <article class="players-empty">
        <strong>Nenhum personagem criado ainda.</strong>
        <p>Crie os sobreviventes no painel do mestre. Depois eles aparecerão aqui lado a lado.</p>
        <a class="primary-button" href="/mestre">ABRIR PAINEL DO MESTRE</a>
      </article>`;
    return;
  }

  grid.innerHTML = characters.map((character) => {
    const portrait = getConditionPortrait(character);
    const style = getStyle(character);
    const stateLabel = formatCondition(character.estado);
    return `
      <article class="player-select-card condition-${escapeHtml(character.estado)}">
        <a class="player-select-photo" href="/jogador/${encodeURIComponent(character.id)}">
          ${portrait ? `<img src="${portrait}" alt="Retrato de ${escapeHtml(character.nome)}">` : `<span>${svg(style?.icon || "user")}</span>`}
          <em>${escapeHtml(stateLabel)}</em>
        </a>
        <div class="player-select-info">
          <small>PERSONAGEM</small>
          <h2>${escapeHtml(character.nome || character.id)}</h2>
          <p>${escapeHtml(style?.nome || character.estilo || "Sem estilo")}</p>
          <div class="player-select-actions">
            <a class="primary-button" href="/jogador/${encodeURIComponent(character.id)}">ABRIR FICHA</a>
            <a class="secondary-button" href="/overlay/${encodeURIComponent(character.id)}" target="_blank">OVERLAY</a>
          </div>
        </div>
      </article>`;
  }).join("");
}

socket.on("state:update", renderCharacters);
fetch("/api/state")
  .then((response) => response.json())
  .then(renderCharacters)
  .catch(() => {
    grid.innerHTML = `<article class="players-empty"><strong>Não foi possível carregar os personagens.</strong><p>Verifique se o servidor está aberto.</p></article>`;
  });
