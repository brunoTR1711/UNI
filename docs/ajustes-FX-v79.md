# UNI v79 — Ajustes de Event-Card e volume

Base: UNI v78.1 corrigida (FX/jogadores).

## Card da página /efeitos

- **Somente** /efeitos e /efeitos/:id apresentam cards.
- Alinhado ao centro, no alto: `top: 1.5vh` e `width: min(790px, 42vw)` para a cena OBS 1920x1080.
- Preserva arte original (1280x375), ícones, textos e temporização (4,3s + fade 0,7s).
- No navegador estreito (até 700px), `top: 2.5vh`, `width: min(790px, 88vw)`.
- Arquivo: `public/event-card.css`.

## Som dos eventos (FX e fichas)

- Áudios continuam saindo **apenas no FX e nas fichas abertas**, não no mestre ou nos overlays.
- `public/audio.js` aplica ganho mestre **0.42** (~-7,5 dB) e compressor compartilhado para domar transientes e somas de eventos simultâneos (`threshold -20dB, knee 10dB, ratio 8:1, attack 5ms, release 280ms`).
- Fallback HTMLAudio recebe o mesmo fator de redução, mas não conta com a compressão dinâmica.
- Os arquivos OGG/WAV não foram alterados; o volume final ainda pode ser regulado no mixer do OBS.
- Cache atualizado nos HTMLs relevantes para recarregar `audio.js` e `event-card.css`.

## Atualização segura

Não substitua `data/state.json` nem sobrescreva seus arquivos personalizados de `public/inspection-images/` e `public/uploads/`. Reinicie o servidor Termux e atualize a fonte do OBS.
