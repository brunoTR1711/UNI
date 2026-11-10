# UNI v78.1 — Correção da abertura de páginas no Termux

## Sintoma

Ao acessar `/efeitos` ou `/jogadores`, o navegador exibiu conteúdo bruto de bibliotecas do Node.js, em vez da interface HTML. Os documentos HTML incluídos na v78 original estavam corretos dentro do ZIP. A causa exata na instalação do tablet não pôde ser reproduzida sem acesso ao aparelho.

## Mudança

- O servidor agora lê os documentos HTML do próprio projeto **na inicialização**, verifica a assinatura de HTML e os serve diretamente da memória.
- As rotas `/efeitos`, `/efeitos/:id`, `/jogadores` e as demais páginas usam este mesmo mecanismo.
- As respostas HTML não são armazenadas em cache, inclusive na raiz `/`.
- O projeto mantém Express e Socket.IO; não cria novas dependências, nem altera estado de campanha, StreamKit ou som do FX.
- Testes automáticos verificam o **corpo HTML**, o tipo de conteúdo e respostas concorrentes, não apenas HTTP 200.

## Atualização do servidor no tablet

1. Faça backup de `data/state.json`, `public/inspection-images/` e `public/uploads/` (se existirem).
2. Pare o servidor antigo no Termux (`Ctrl+C`).
3. Suba para o repositório os arquivos da pasta `UNI/` deste ZIP.
4. No Termux, execute:

```sh
cd ~/alem-da-nevoa-sheet
git pull origin main
node server.js
```

Se o Node reclamar de `Cannot find module 'express'` ou `socket.io`, use `npm ci` na pasta do projeto e inicie novamente. Não copie `node_modules` do PC para o tablet.

## Conferência rápida

Abra `http://IP-DO-TABLET:3000/jogadores` e `http://IP-DO-TABLET:3000/efeitos`, substituindo o endereço pelo IP usado na sua rede.

Se continuar exibindo conteúdo estranho, confira se o Termux está iniciando **este** `server.js` e se os arquivos `public/effects.html` e `public/jogadores.html` foram realmente atualizados. O início de cada um deles deve ser `<!DOCTYPE html>` (maiúsculo ou minúsculo). Reinicie também o navegador ou atualize as fontes do OBS.

> Observação: a fonte FX tem fundo transparente e pouco conteúdo parado; isso é normal. Os cartões de efeitos aparecem ao serem acionados pelo mestre.
