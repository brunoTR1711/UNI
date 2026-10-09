# Diagnóstico v61 — overlay sem dado/número

O problema da v59 era um erro específico no `public/overlay.js`: a tela de overlay usava `diceServerFrames`, mas essa variável não existia nesse arquivo.

Resultado:

- ficha do jogador e painel do mestre podiam receber a rolagem;
- o som chegava;
- o overlay quebrava silenciosamente quando recebia `dice:roll`/`dice:frame`;
- por isso o dado e os números deixavam de aparecer no overlay.

A v61 corrige isso adicionando o armazenamento de frames também no overlay:

```js
const diceServerFrames = new Map();
```

Depois de atualizar, limpe o cache do navegador/OBS.
