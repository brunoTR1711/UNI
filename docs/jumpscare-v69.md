# Jumpscare global — v69

No painel `/mestre`, no bloco **Jumpscare**, selecione **Aleatório**, **Jumpscare 1** ou **Jumpscare 2** e clique **DISPARAR JUMPSCARE**.

- A escolha é feita uma vez pelo servidor e enviada por Socket.IO a todos os dispositivos conectados.
- O som toca em todas as fichas abertas, overlays e na camada `/efeitos`, no overlay do assassino e no canal `/audio` quando o áudio estiver habilitado.
- Não altera estado de saúde, condições, documentos ou inventário, nem gera banner visual.
- Os dois sons ficam em `public/assets/killer-JUMPSCARE1.ogg` e `public/assets/killer-JUMPSCARE2.ogg`. Substitua pelos seus OGG reais mantendo os nomes.
- Os modelos atuais são silenciosos; **substituí-los é necessário para ouvir um susto**.
- O volume é 100% dentro do player, sem distorção ou ganho artificial. Ajuste o volume final no mixer do OBS e nos aparelhos para evitar volume excessivo.
- Navegadores bloqueiam áudio automático até a primeira interação. Na ficha, o jogador deve permitir/ativar som; no OBS é preciso ativar áudio usando a opção de interação na fonte.
- **No OBS, não capture áudio simultaneamente de `/efeitos`, `/audio` e de overlays individuais**, ou o mesmo jumpscare tocará mais de uma vez no mixer. Escolha uma fonte principal de som, ou silencie as outras.
- O evento `jumpscare:event` já prevê `kind: "audio"` e `visual: null` para futura expansão com imagem/vídeo; `audio:event` é o canal atual de reprodução.
- Há um intervalo mínimo de 1 segundo entre disparos para evitar cliques duplicados.
