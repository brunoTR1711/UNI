> **Atenção (v73):** os caminhos abaixo são históricos. Consulte [`organizacao-assets-v73.md`](organizacao-assets-v73.md) para os caminhos atuais.

# V71 — Event Cards na camada FX

Os oito PNGs originais enviados pelo mestre estão em `public/assets/event-cards/`: uma base e sete ícones de condições. Mantenha o nome do arquivo e a transparência PNG.

- Os efeitos de personagem usam o ícone correspondente (`ferida-profunda`, `quebrado`, `incapacitado`, `exposto`, `alheio`, `exaustao` e `sorte`).
- Eventos de golpes, perseguição e demais acontecimentos usam a mesma base com um marcador genérico, pois não foi fornecida arte específica para eles.
- O cartão mostra personagem em verde, evento em vermelho  e descrição branca, como na referência.
- O FX dura cinco segundos: entrada analógica curta, leitura estável e fade final. Sangue, vinheta, flash, arranhões e sons permanecem ligados ao mesmo evento do servidor.
- A apresentação de documentos do mestre continua independente e aparece sobre FX quando ativada.
- Os arquivos `event-card.js` (texto e seleção do ícone) e `event-card.css` (layout e animações) estão separados de `scene-fx.js` (Socket.IO e tempo dos eventos).
- Reinicie o servidor e atualize as fontes do OBS para carregar os novos arquivos `?v=71`.
