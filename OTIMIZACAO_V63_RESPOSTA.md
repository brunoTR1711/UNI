# OTIMIZAÇÃO V63 — resposta mais rápida PC / Android / Tailscale

Esta versão ataca a causa mais provável da lentidão: o estado do jogo ficava pesado demais.

## O que deixava lento

Antes, quando uma foto/retrato era enviada, ela podia ficar salva dentro do `data/state.json` como uma string `data:image/...` gigante. Depois disso, qualquer comando simples — marcar dano, mudar carga, rolar dado, aplicar efeito — reenviava o estado inteiro para todos os navegadores.

Com retratos em base64 dentro do estado, cada clique podia trafegar megabytes pela rede/Tailscale e ainda forçar o tablet a gravar um JSON enorme no armazenamento.

## O que mudou

- Retratos novos agora são salvos como arquivos em:

```txt
public/uploads/portraits/
```

- O estado passa a guardar apenas o caminho do arquivo, por exemplo:

```txt
/uploads/portraits/leandro-saudavel-ab12cd.png
```

- Retratos antigos que ainda estiverem em `data:image/...` são migrados automaticamente na primeira inicialização da v63.
- O salvamento do estado foi otimizado com debounce assíncrono, evitando travar o servidor a cada clique.
- O servidor anuncia a versão `v63-performance` em `/api/network` e no cabeçalho `X-Uma-Noite-Version`.
- Os arquivos `.js` e `.css` foram atualizados para `?v=63` para evitar cache antigo.

## Como atualizar do jeito limpo

No tablet:

```bash
cd ~/alem-da-nevoa-sheet
pkill node
```

Depois atualize pelo Git ou substitua os arquivos pela versão nova.

Ao iniciar a v63 pela primeira vez, ela pode demorar alguns segundos se precisar converter retratos antigos. Depois disso, os comandos devem responder bem mais rápido.

## Importante

A pasta `public/uploads/` contém imagens usadas pela mesa. Ela não deve ir para o GitHub se você não quiser expor imagens/personagens da campanha, mas deve ser mantida no tablet/PC onde o servidor roda.
