# UNI v72 — Correção de áudio das caixas de saúde

Esta atualização foi aplicada diretamente sobre o projeto do arquivo UNI(2).rar.

- Causar Dano (mestre) e marcar caixas (mestre/jogador) usam a mesma decisão do servidor.
- O som é o do estado de saúde **resultante**: 1 = `state-ferido.ogg`, 2 = `state-machucado.ogg`, 3 = `state-morrendo.ogg`.
- Saltos de 2 ou 3 caixas emitem apenas o áudio do estado final. Dano sem alteração de estado não emite novo som.
- O navegador mestre e a ficha do alvo recebem o mesmo `audio:event`, sem som duplicado pelo clique local.
- Pode ser necessário tocar/clicar na página uma vez para permitir áudio no navegador (restrição de reprodução automática).
- Os seus arquivos OGG foram preservados. WAVs originais que faltavam no RAR foram restaurados para não perder sons já referenciados pelo código.

## Instalação via GitHub / Termux

Não suba a pasta `node_modules` nem sobrescreva a pasta `data` do tablet. Atualize o código, execute `npm install` quando necessário e reinicie o servidor (`node server.js`). Recarregue também as abas PC/Android/OBS para atualizar o JavaScript.
