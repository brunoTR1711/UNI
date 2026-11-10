# UNI v76 — canais de áudio e efeitos

- Somente `/efeitos` e as fichas abertas `/jogador/:id` se inscrevem para receber `audio:event` via Socket.IO.
- O servidor escolhe o áudio e envia ao FX e ao personagem correspondente; eventos globais chegam a todas as fichas abertas.
- `/mestre`, `/overlay`, `/overlay/:id`, `/assassino/overlay` e `/audio` não reproduzem sons. `/audio` é uma página informativa para evitar mixagens duplicadas.
- `scene:event` gera event-card **somente em** `/efeitos` (e `/efeitos/:id`). Não dispara áudio: este chega exclusivamente por `audio:event`.
- Quando uma condição é aplicada ao jogador, a ficha recebe um flash vermelho leve de 480 ms. O evento não mostra card nessa página.
- Áudio no navegador requer a política de autoplay: clique na ficha pelo menos uma vez; no OBS clique no botão **ATIVAR SOM** via Interagir na fonte `/efeitos`.
- Após atualizar no GitHub, reinicie o servidor e recarregue as fontes PC/OBS para registrar as novas inscrições.
