(function () {
  const RESOURCE_LABELS = {
    cooperacao: "COOPERAÇÃO",
    folego: "FÔLEGO",
    foco: "FOCO"
  };

  const RESOURCE_ICON = {
    cooperacao: `
      <svg class="resource-glyph resource-glyph--cooperacao" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <linearGradient id="glyph-coop-a" x1="0" x2="1">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0.95"/>
            <stop offset="100%" stop-color="currentColor" stop-opacity="0.55"/>
          </linearGradient>
        </defs>
        <path d="M18 22l8-8 12 12-8 8c-3 3-9 3-12 0l-4-4c-3-3-3-9 0-12l4-4z" fill="none" stroke="url(#glyph-coop-a)" stroke-width="4" stroke-linejoin="round"/>
        <path d="M46 42l-8 8-12-12 8-8c3-3 9-3 12 0l4 4c3 3 3 9 0 12l-4 4z" fill="none" stroke="url(#glyph-coop-a)" stroke-width="4" stroke-linejoin="round"/>
        <path d="M24 40l16-16" stroke="currentColor" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
      </svg>
    `,
    folego: `
      <svg class="resource-glyph resource-glyph--folego" viewBox="0 0 64 64" aria-hidden="true">
        <path d="M31 18c-8 0-13 6-13 14v10c0 4 2 7 5 9l8-9V18z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        <path d="M33 18c8 0 13 6 13 14v10c0 4-2 7-5 9l-8-9V18z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>
        <path d="M32 15v31" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
        <path d="M48 16c5 3 8 7 8 12 0 5-3 9-8 12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.75"/>
      </svg>
    `,
    foco: `
      <svg class="resource-glyph resource-glyph--foco" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="16" fill="none" stroke="currentColor" stroke-width="4"/>
        <circle cx="32" cy="32" r="6" fill="currentColor"/>
        <path d="M32 8v10M32 46v10M8 32h10M46 32h10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>
    `
  };

  const CONDITION_LABELS = {
    saudavel: "SAUDÁVEL",
    ferido: "FERIDO",
    machucado: "MACHUCADO",
    morrendo: "MORRENDO",
    morto: "MORTO"
  };

  const CONDITION_ORDER = ["saudavel", "ferido", "machucado", "morrendo", "morto"];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function getCharacterIdFromPath() {
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[1] || "";
  }

  function getConditionPortrait(character) {
    if (!character) return "";
    return character.portraits?.[character.estado] ||
      character.portraits?.saudavel ||
      "";
  }

  function makeStateMarks(character, options = {}) {
    const { editable = false, role = "player", id = character.id, compact = false } = options;
    const marks = [];

    for (let index = 0; index < 3; index += 1) {
      const active = index < character.marcasEstado;
      marks.push(`
        <button
          class="health-mark ${active ? "marked" : ""} ${compact ? "compact" : ""}"
          ${editable ? "" : "disabled"}
          type="button"
          data-action="set-marks"
          data-id="${escapeHtml(id)}"
          data-role="${escapeHtml(role)}"
          data-marks="${index + 1 === character.marcasEstado ? index : index + 1}"
          aria-label="Alterar estado"
        >✚</button>
      `);
    }

    return marks.join("");
  }

  function makeStacks(character, resource, options = {}) {
    const {
      editable = false,
      role = "player",
      id = character.id,
      compact = false,
      changedIndex = null,
      changeType = ""
    } = options;
    const data = character.resources[resource];
    const result = [];

    for (let index = 0; index < data.max; index += 1) {
      const active = index < data.stacks;
      const isChanged = Number.isInteger(changedIndex) && changedIndex === index;
      const animationClass = isChanged && changeType
        ? `stack-${changeType}`
        : "";

      result.push(`
        <button
          class="stack-drop ${active ? "filled" : ""} ${compact ? "compact" : ""} ${animationClass}"
          ${editable ? "" : "disabled"}
          type="button"
          data-action="set-stacks"
          data-id="${escapeHtml(id)}"
          data-role="${escapeHtml(role)}"
          data-resource="${escapeHtml(resource)}"
          data-stacks="${index + 1 === data.stacks ? index : index + 1}"
          aria-label="Alterar ${escapeHtml(RESOURCE_LABELS[resource])}"
        ></button>
      `);
    }

    return result.join("");
  }

  function makeEditableText(field, value, label) {
    return `
      <section class="editable-text" data-editable="${escapeHtml(field)}">
        <button class="editable-display" type="button" data-action="start-edit" data-field="${escapeHtml(field)}">
          <span>${escapeHtml(value)}</span>
          <small>${escapeHtml(label)}</small>
        </button>
        <div class="editable-form hidden">
          <input class="dark-input editable-input" value="${escapeHtml(value)}" maxlength="90" />
          <div class="editable-actions">
            <button class="confirm-button" type="button" data-action="confirm-edit" data-field="${escapeHtml(field)}">CONFIRMAR</button>
            <button class="cancel-button" type="button" data-action="cancel-edit" data-field="${escapeHtml(field)}">CANCELAR</button>
          </div>
        </div>
      </section>
    `;
  }

  function makeStatusBadge(character) {
    const value = formatCondition(character.estado);
    return `<span class="status-badge status-badge--${escapeHtml(character.estado)}">${escapeHtml(value)}</span>`;
  }

  function makeAdvantageSlot(advantage, index, editable = true, id = "") {
    const selected = Boolean(advantage);
    return `
      <article class="advantage-slot ${selected ? "selected" : ""}">
        <button
          type="button"
          class="advantage-diamond"
          ${editable ? "" : "disabled"}
          data-action="select-advantage"
          data-id="${escapeHtml(id)}"
          data-slot="${index}"
          aria-label="Escolher vantagem"
        >
          <span>${selected ? "✦" : ""}</span>
        </button>
        <div class="advantage-copy">
          <h3>${escapeHtml(advantage?.nome || "NOME DA VANTAGEM")}</h3>
          <p>${escapeHtml(advantage?.descricao || "DESCRIÇÃO DETALHADA SOBRE A VANTAGEM")}</p>
        </div>
      </article>
    `;
  }

  function makeResource(character, resource, options = {}) {
    const {
      editable = true,
      role = "player",
      compact = false,
      id = character.id,
      changedIndex = null,
      changeType = ""
    } = options;
    return `
      <section class="resource-block ${compact ? "compact" : ""}">
        <button
          class="resource-icon"
          type="button"
          ${editable ? "" : "disabled"}
          data-action="roll-d20"
          data-id="${escapeHtml(id)}"
          data-role="${escapeHtml(role)}"
          data-resource="${escapeHtml(resource)}"
          title="Rolar 1d20 de ${escapeHtml(RESOURCE_LABELS[resource])}"
        >
          <span class="resource-icon-core">${RESOURCE_ICON[resource]}</span>
        </button>
        <div class="resource-label">${escapeHtml(RESOURCE_LABELS[resource])}</div>
        <div class="stacks-row">${makeStacks(character, resource, { editable, role, id, compact, changedIndex, changeType })}</div>
      </section>
    `;
  }

  function formatCondition(value) {
    return CONDITION_LABELS[value] || String(value || "").toUpperCase();
  }


  const THEME_PRESETS = {
    ciano: {
      label: "CIANO ELÉTRICO",
      swatch: "#00d5ff",
      saudavel: { main: "#00d5ff", deep: "#042b39", accent: "#7befff", dice: "#00bfe9", glow: "#72f1ff" },
      ferido: { main: "#07556d", deep: "#081a21", accent: "#c41727", dice: "#174b5e", glow: "#f22a3e" },
      machucado: { main: "#12303a", deep: "#050e12", accent: "#6e121c", dice: "#172e35", glow: "#b11e2b" },
      morrendo: { main: "#77858a", deep: "#1a2022", accent: "#9aabb0", dice: "#69777b", glow: "#c1d0d4" },
      morto: { main: "#000000", deep: "#000000", accent: "#111111", dice: "#000000", glow: "#1f1f1f" }
    },
    magenta: {
      label: "MAGENTA RITUAL",
      swatch: "#ff2ca8",
      saudavel: { main: "#ff2ca8", deep: "#4a0a33", accent: "#ff8fd3", dice: "#e52394", glow: "#ff7bc9" },
      ferido: { main: "#7e2459", deep: "#260a1d", accent: "#d11b2d", dice: "#71214f", glow: "#ff3147" },
      machucado: { main: "#451b35", deep: "#130710", accent: "#771421", dice: "#3b1a30", glow: "#c11f31" },
      morrendo: { main: "#8d7b86", deep: "#231c20", accent: "#b0a0a8", dice: "#7c6d75", glow: "#d4c1ca" },
      morto: { main: "#000000", deep: "#000000", accent: "#111111", dice: "#000000", glow: "#1f1f1f" }
    },
    ambar: {
      label: "ÂMBAR DOURADO",
      swatch: "#ffc247",
      saudavel: { main: "#ffc247", deep: "#4b3004", accent: "#ffe08a", dice: "#e8a925", glow: "#ffd96f" },
      ferido: { main: "#806022", deep: "#251b08", accent: "#c41b27", dice: "#6c511d", glow: "#f42b3e" },
      machucado: { main: "#44371d", deep: "#130f07", accent: "#74141c", dice: "#3b301b", glow: "#ad1d2a" },
      morrendo: { main: "#918878", deep: "#24211c", accent: "#b8aea0", dice: "#80786a", glow: "#d7cdbf" },
      morto: { main: "#000000", deep: "#000000", accent: "#111111", dice: "#000000", glow: "#1f1f1f" }
    },
    verde: {
      label: "VERDE ÁCIDO",
      swatch: "#78ff45",
      saudavel: { main: "#78ff45", deep: "#174808", accent: "#b9ff96", dice: "#5ee833", glow: "#adff88" },
      ferido: { main: "#3c7c2a", deep: "#10240b", accent: "#c71927", dice: "#356b27", glow: "#f22b3e" },
      machucado: { main: "#27411f", deep: "#0a1208", accent: "#74131c", dice: "#233a1d", glow: "#ad1e2a" },
      morrendo: { main: "#7d8d78", deep: "#1c221a", accent: "#a8b7a4", dice: "#6f7d6b", glow: "#c7d6c3" },
      morto: { main: "#000000", deep: "#000000", accent: "#111111", dice: "#000000", glow: "#1f1f1f" }
    },
    violeta: {
      label: "VIOLETA ARCANO",
      swatch: "#9d5cff",
      saudavel: { main: "#9d5cff", deep: "#28124c", accent: "#c9a7ff", dice: "#8548e8", glow: "#c29aff" },
      ferido: { main: "#593b86", deep: "#1b102b", accent: "#ca1b2b", dice: "#4e3576", glow: "#f42b3e" },
      machucado: { main: "#332747", deep: "#0e0a14", accent: "#75141d", dice: "#30243f", glow: "#b01e2b" },
      morrendo: { main: "#837d8c", deep: "#201e25", accent: "#aaa4b2", dice: "#746f7c", glow: "#cec7d6" },
      morto: { main: "#000000", deep: "#000000", accent: "#111111", dice: "#000000", glow: "#1f1f1f" }
    },
    laranja: {
      label: "LARANJA BRASA",
      swatch: "#ff7a28",
      saudavel: { main: "#ff7a28", deep: "#4b1d06", accent: "#ffb06f", dice: "#eb6820", glow: "#ffa260" },
      ferido: { main: "#84441f", deep: "#28150a", accent: "#ce1c2b", dice: "#713c1d", glow: "#f32a3d" },
      machucado: { main: "#48291b", deep: "#140b08", accent: "#74131c", dice: "#3d251a", glow: "#ae1d2a" },
      morrendo: { main: "#918078", deep: "#261f1b", accent: "#baa9a1", dice: "#81716b", glow: "#d8c4bb" },
      morto: { main: "#000000", deep: "#000000", accent: "#111111", dice: "#000000", glow: "#1f1f1f" }
    },
    azul: {
      label: "AZUL CELESTE",
      swatch: "#4f7cff",
      saudavel: { main: "#4f7cff", deep: "#13265e", accent: "#9bb4ff", dice: "#416ae8", glow: "#8eaaff" },
      ferido: { main: "#344d8d", deep: "#111b38", accent: "#c91929", dice: "#30467c", glow: "#f22b3d" },
      machucado: { main: "#26334d", deep: "#0b0f18", accent: "#73131c", dice: "#242f46", glow: "#ad1e2a" },
      morrendo: { main: "#78818f", deep: "#1b2028", accent: "#a5aebc", dice: "#6b7380", glow: "#c6cfdb" },
      morto: { main: "#000000", deep: "#000000", accent: "#111111", dice: "#000000", glow: "#1f1f1f" }
    }
  };

  function normalizeThemePreset(value) {
    return Object.prototype.hasOwnProperty.call(THEME_PRESETS, value)
      ? value
      : "ciano";
  }

  function themeForCondition(preset, condition) {
    const safePreset = normalizeThemePreset(preset);
    const palette = THEME_PRESETS[safePreset];
    return palette[condition] || palette.saudavel;
  }

  function themeStyle(character) {
    const theme = themeForCondition(character?.themePreset, character?.estado);
    return [
      `--character-main:${theme.main}`,
      `--character-deep:${theme.deep}`,
      `--character-accent:${theme.accent}`,
      `--character-dice:${theme.dice}`,
      `--character-glow:${theme.glow}`
    ].join(";");
  }

  function makeThemePicker(character, options = {}) {
    const {
      id = character.id,
      role = "player",
      compact = false,
      editable = true
    } = options;

    const selected = normalizeThemePreset(character?.themePreset);

    return `
      <section class="theme-preset-picker ${compact ? "compact" : ""}">
        <span class="theme-preset-label">TEMA</span>
        <div class="theme-swatches">
          ${Object.entries(THEME_PRESETS).map(([key, preset]) => `
            <button
              type="button"
              class="theme-swatch ${selected === key ? "selected" : ""}"
              style="--swatch-color:${preset.swatch}"
              title="${escapeHtml(preset.label)}"
              data-action="set-theme-preset"
              data-id="${escapeHtml(id)}"
              data-role="${escapeHtml(role)}"
              data-preset="${escapeHtml(key)}"
              ${editable ? "" : "disabled"}
            >
              <span class="sr-only">${escapeHtml(preset.label)}</span>
            </button>
          `).join("")}
        </div>
      </section>
    `;
  }

  function copyText(text) {
    navigator.clipboard?.writeText(text);
  }

  window.NevoaCommon = {
    RESOURCE_LABELS,
    RESOURCE_ICON,
    CONDITION_LABELS,
    CONDITION_ORDER,
    escapeHtml,
    getCharacterIdFromPath,
    getConditionPortrait,
    makeStateMarks,
    makeStacks,
    makeEditableText,
    makeAdvantageSlot,
    makeResource,
    makeStatusBadge,
    formatCondition,
    copyText,
    THEME_PRESETS,
    normalizeThemePreset,
    themeForCondition,
    themeStyle,
    makeThemePicker
  };
})();
