# UNI v76 — Validação da separação de áudio e FX

Base utilizada: `UNI(4).rar` fornecido para esta atualização. As alterações foram restritas ao encaminhamento de sons, à apresentação do FX, ao flash de aplicação de condições e aos testes associados.

## Verificações executadas

- Sintaxe de `server.js`, `public/*.js`, `lib/*.js` e scripts de testes: aprovada.
- 58 testes unitários e de regressão sem servidor real: 58 aprovados.
- Distribuição de som (simulação real das funções): condição/dano apenas no FX e ficha do alvo; evento global apenas no FX e fichas abertas.
- Reconexão e inscrição em salas: validação de transição e atualização de destinatários.
- Sem card nem reprodução de áudio no overlay (testado com execução simulada do script).
- `scene:event` é somente visual; `audio:event` é a única origem de sons no FX.
- Flash na ficha somente por condição aplicada, diferente do efeito antigo de dano.
- URLs de scripts das páginas modificadas atualizadas para `?v=76`.

## Limitação do ambiente

Os sete testes de integração HTTP/Socket.IO reais, em `test/regression.test.js`, exigem `express` e `socket.io` instalados. A instalação não foi concluída neste ambiente, portanto esses testes **não foram aprovados nem reprovados por lógica**: ficaram bloqueados por falta de dependências. Para executá-los no tablet ou PC, rodar `npm ci && npm test`.

## Como ativar som na transmissão

Abra `/efeitos` no OBS como fonte Navegador e habilite o som com **Interagir → ATIVAR SOM**. A página `/audio` foi silenciada para impedir mixagem duplicada. Os jogadores devem abrir suas fichas `/jogador/:id` e interagir ao menos uma vez para permitir o áudio no navegador.

## Dados que devem ser preservados

- `data/state.json`
- `public/inspection-images/` (imagens enviadas pelo mestre)
- `public/uploads/` (retratos)

Essas pastas de conteúdo privado não são distribuídas no ZIP de código.
