> **Atenção (v73):** os caminhos abaixo são históricos. Consulte [`organizacao-assets-v73.md`](organizacao-assets-v73.md) para os caminhos atuais.

# v70 — Som original do D20 restaurado

A v68 introduziu `public/assets/dice-roll.ogg` como **modelo silencioso**. O mapeamento em `public/audio.js` passou a usá-lo, e por isso a rolagem ficou sem som.

## Correção

- `rollDice` volta a usar `/assets/dice-roll.wav`, preservado das versões antigas.
- O som é acionado no começo de cada rolagem nas fichas e no painel do mestre, e distribuído como `audio:event` para overlays e canal de áudio do OBS.
- Os sons de revelação continuam usando `dice-reveal-1.ogg`, `dice-reveal-2-19.ogg` e `dice-reveal-20.ogg`, conforme o resultado.
- Jumpscares e as demais funções não foram alterados.
- As páginas carregam `/audio.js?v=70` para descartar cache antigo. Se houver outras fontes OBS com áudio da mesma rolagem, escolha uma única fonte de áudio para evitar duplicação.

`dice-roll.ogg` permanece na pasta como modelo, mas **não está em uso**. O arquivo em uso é `dice-roll.wav`.
