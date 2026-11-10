# UNI v78 — Retrato reativo à voz com Discord StreamKit (sem bot)

**Base: v76.** Esta versão não usa a ponte da v77, token de bot ou programa auxiliar.

## Como configurar (um personagem)

1. Deixe o Discord **desktop** aberto no PC onde o OBS está rodando, conectado ao canal de voz da mesa.
2. Abra https://streamkit.discord.com/overlay no navegador, autorize a integração se solicitado, selecione **Voice**, o servidor e o canal de voz, e copie o URL do widget.
3. Abra no projeto `http://SEU-IP:3000/discord-obs` (o servidor continua no Redmi Pad 2).
4. Escolha o personagem, cole o **ID numérico** do jogador no Discord e o URL do widget.
5. No OBS, configure a fonte individual da UNI (`/overlay/ID`) como **Navegador** de **960 × 720**.
6. Acrescente **outra fonte Navegador**, com o URL do widget **Voice do StreamKit**, também de **960 × 720**. Cole o **CSS personalizado** copiado no gerador UNI. Fonte StreamKit **ACIMA** da fonte UNI.
7. Deixe as duas fontes na **mesma posição e com a mesma escala**. Agrupe as duas no OBS para movimentá-las juntas. Repita para os outros personagens usando IDs do Discord diferentes.
8. Teste falando e calando no Discord. Durante o silêncio ou quando a pessoa está fora do canal, a imagem permanece escura; ao detectar fala, a máscara fica transparente, deixando a imagem com o brilho original.

**Para copiar o ID:** Discord → Configurações → Avançado → Modo desenvolvedor → clique direito no participante → Copiar ID de usuário.

## O que efetivamente acontece

- O StreamKit tem classes que indicam atividade vocal (`li.voice_state[data-userid="..."].wrapper_speaking`). O gerador cria CSS para que a própria **fonte do StreamKit** desenhe um retângulo semitransparente preto (silêncio), que desaparece quando essa classe aparece.
- A máscara fica **sobre** a imagem atual da UNI, então a foto do estado saudável/ferido/machucado/morrendo continua atualizando ao vivo pela UNI e não precisa ser recarregada no Discord.
- O CSS inclui seletores alternativos para versões antigas do StreamKit, mas depende do comportamento do site externo; se o Discord atualizar a marcação, o CSS poderá precisar de manutenção.
- OBS tem **duas fontes de navegador por jogador** (UNI + StreamKit). Não há bot/token, nem servidor de áudio extra.
- **Limitação:** o filtro é uma **camada de fonte OBS**. É impossível ao CSS da fonte StreamKit modificar diretamente o DOM de outra fonte isolada. A máscara escurece também ícones/textos da UNI que ficarem dentro dos 900×560 pixels da foto. O painel de atributos (abaixo da foto) não é afetado. Ajuste a máscara em "Avançado" se necessário.
- **Não existe ligação de voz fora do OBS**: no celular/navegador, `/overlay/:id` aparece normal. O escurecimento é feito pelo OBS e só existe na composição da transmissão.
- Compatibilidade: OBS recente com CSS `:has()` e StreamKit funcionando no OBS (Discord desktop disponível). O Discord StreamKit pode exigir autorização via página oficial. O StreamKit pode não funcionar com **Discord somente no navegador**, sem o aplicativo desktop.
- Se o jogador estiver fora do canal a máscara permanece escura por segurança; em caso de falha StreamKit, não haverá detecção de fala e o retrato continuará escuro, até a fonte ser ocultada no OBS.

## Valores padrão da máscara (coordenadas do navegador OBS)

| Propriedade | Valor |
|--|--|
| Dimensões da fonte UNI | 960 × 720 |
| Dimensões da fonte StreamKit | 960 × 720 |
| Máscara X/Y | 20px / 20px |
| Máscara largura/altura | 900px × 560px |
| Escurecimento em silêncio | 58% (rgba preto) |
| Transição ao falar | 160ms |

Para o overlay de todos os personagens `/overlay`, prefira as fontes **individuais** `/overlay/:id` porque as posições no mosaico variam conforme a tela e a quantidade de jogadores.

## Testes independentes de Discord

A página `/discord-obs` inclui uma simulação visual de silêncio/fala para conferir o efeito. O teste real de voz só ocorre no PC com Discord e OBS abertos.

## Regressão

Nenhum arquivo de `server.js` relacionado a áudio, FX, dados, morte, inventário, condições ou inspeção foi alterado. Apenas a rota estática `/discord-obs` foi acrescentada; o resto é HTML/CSS/JS de configuração. `data/state.json` permanece fora do ZIP para preservar a campanha existente.
