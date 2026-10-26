> **Atenção (v73):** os caminhos abaixo são históricos. Consulte [`organizacao-assets-v73.md`](organizacao-assets-v73.md) para os caminhos atuais.

# UNI v68 — áudios personalizados (.ogg)

Substitua os arquivos abaixo em `public/assets/`, mantendo exatamente o mesmo nome e letras maiúsculas/minúsculas. Todos os `.ogg` novos neste pacote são **modelos silenciosos válidos**; seus sons reais ainda precisam ser copiados para essa pasta.

| Gatilho | Arquivo |
| --- | --- |
| Alheio | `killer-alheio.ogg` |
| Exaustão | `killer-exausto.ogg` |
| Exposto | `killer-exposto.ogg` |
| Incapacitado | `killer-incapacitado.ogg` |
| Quebrado | `killer-quebrado.ogg` |
| Sorte | `killer-sorte.ogg` |
| **Ferida Profunda (faltava na sua lista)** | `killer-ferida-profunda.ogg` |
| Adicionar/retirar recurso ou carga | `stack-add.ogg` / `stack-remove.ogg` |
| Ferido, Machucado, Morrendo | `state-ferido.ogg`, `state-machucado.ogg`, `state-morrendo.ogg` |
| Declarar morto | **sorteia** entre `state-morto1.ogg` e `state-morto2.ogg` |
| Começar D20 | `dice-roll.wav` (som original restaurado na v70; `dice-roll.ogg` é somente modelo silencioso sem uso) |
| Revelar D20 = **1** | `dice-reveal-1.ogg` |
| Revelar D20 = **2 a 19** | `dice-reveal-2-19.ogg` |
| Revelar D20 = **20** | `dice-reveal-20.ogg` |
| Reservados, sem gatilho automático | `killer-JUMPSCARE1.ogg` e `killer-JUMPSCARE2.ogg` |

## Sincronização

A escolha do som de **morte** é aleatória, mas feita uma única vez **no servidor**. Assim, todos recebem a mesma variante via `audio:event`, inclusive PC e Android.

O som de **revelação** só é emitido pelo servidor no final da animação de 3 segundos, com o resultado verdadeiro. As antigas reproduções genéricas por timer foram removidas de ficha, mestre, overlay e `/audio` para evitar sons duplicados.

Os demais efeitos visuais e a rolagem de números permanecem inalterados. Os sons antigos `.wav` de cena/assassino (perseguição, golpe etc.) também continuam disponíveis, pois não receberam arquivos substitutos na sua lista.

Depois de adicionar seus áudios, faça commit/push no GitHub, `git pull` no Termux, reinicie `node server.js` e recarregue as páginas de ficha/OBS para descartar buffers antigos.

Se você captura áudio de várias páginas simultaneamente no OBS, a mesma ação pode sair duplicada em canais diferentes. Prefira uma única fonte de áudio de saída.
