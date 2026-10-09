# Uma Noite no Inferno — ficha local com overlay para OBS

Projeto local em HTML, CSS e JavaScript com sincronização em tempo real por Socket.IO.

## O que já está implementado

- Painel do mestre.
- Criação e exclusão de personagens.
- Link individual para cada jogador.
- Nome e estilo editáveis com confirmar e cancelar.
- Upload de retrato independente para: saudável, ferido, machucado, morrendo e morto.
- Recorte automático das imagens com `object-fit: cover`, sem deformar.
- Três quadrados de estado:
  - nenhum marcado: saudável;
  - um marcado: ferido;
  - dois marcados: machucado;
  - três marcados: morrendo.
- Botão para declarar o personagem morto quando estiver morrendo.
- Cooperação, Fôlego e Foco com stacks clicáveis.
- Rolagem automática de 1d20 clicando no ícone.
- Resultado do d20 aparecendo por alguns segundos no overlay.
- Quatro slots de vantagens.
- Modal com catálogo de vantagens.
- Overlay geral e overlay individual para OBS.
- Salvamento automático em `data/state.json`.
- Bloqueio da ficha pelo mestre.
- Ocultar ou mostrar personagem no overlay.

## Requisitos

Instale uma versão recente do Node.js.

## Como iniciar

Abra o terminal dentro da pasta do projeto e rode:

```bash
npm install
npm start
```

O terminal exibirá endereços parecidos com:

```txt
Local: http://localhost:3000
Rede:  http://192.168.0.15:3000
```

## Links principais

```txt
http://localhost:3000/
http://localhost:3000/mestre
http://localhost:3000/overlay
http://localhost:3000/jogador/ID_DO_PERSONAGEM
http://localhost:3000/overlay/ID_DO_PERSONAGEM
```

## Como usar no OBS

1. Abra o OBS.
2. Adicione uma fonte do tipo `Navegador`.
3. Cole `http://localhost:3000/overlay` para mostrar todos os personagens.
4. Para mostrar somente um personagem, use `http://localhost:3000/overlay/ID_DO_PERSONAGEM`.
5. Defina uma largura adequada, por exemplo `1920`, e uma altura suficiente para a sua cena.
6. O overlay tem fundo transparente.

## Como compartilhar com os jogadores

Na mesma rede Wi-Fi, use o endereço `Rede` exibido no terminal:

```txt
http://192.168.0.15:3000/jogador/buffy
```

O painel do mestre também possui um botão para copiar a ficha de cada personagem.

## Acesso pela internet

O IP local funciona somente dentro da mesma rede. Para jogadores remotos, use um túnel temporário, por exemplo:

```bash
cloudflared tunnel --url http://localhost:3000
```

Depois substitua `localhost:3000` pelo endereço público gerado.

## Observações

- As imagens são salvas no arquivo JSON como Data URL. Isso é simples para o MVP, mas o arquivo pode ficar grande com muitos retratos.
- O sistema não possui autenticação forte. Para uma campanha privada, compartilhe somente os links necessários.
- O triângulo vermelho e a área de ITEM não foram implementados, conforme solicitado.


## Forma mais simples no Windows

Em vez de digitar comandos, dê dois cliques em:

```txt
INSTALAR_E_ABRIR.bat
```

Na primeira execução ele verifica se o Node.js está instalado, instala as dependências e inicia o servidor.

Nas próximas vezes, você pode usar:

```txt
ABRIR_SERVIDOR.bat
```

## Atualização v2

- O último resultado rolado de Cooperação, Fôlego e Foco agora aparece também na ficha do próprio jogador.
- O valor exibido na ficha é exatamente o mesmo armazenado no servidor e mostrado no overlay.
- No overlay, a rolagem mais recente aparece na área livre do canto superior direito do cartão, ao lado do nome e do retrato.
- O aviso de rolagem permanece visível temporariamente no overlay e desaparece automaticamente. Na ficha do jogador, o último resultado continua visível até a próxima rolagem.


## Overlay individual por personagem

No painel do mestre, cada personagem possui um bloco chamado `LINK INDIVIDUAL PARA O OBS`.

Exemplo:

```txt
http://localhost:3000/overlay/leandro
```

Adicione esse endereço como uma fonte `Navegador` separada no OBS. Assim você pode posicionar e redimensionar cada personagem independentemente.

Resolução recomendada para cada fonte individual:

```txt
Largura: 360
Altura: 170
```

O link geral continua disponível em:

```txt
http://localhost:3000/overlay
```

Ele é opcional e serve apenas para mostrar todos os personagens juntos.


## Atualização v4 — cor temática e animações

- Cada jogador pode escolher a própria cor temática pela ficha.
- O mestre também consegue alterar a cor pelo painel.
- A cor escolhida representa o personagem saudável.
- Os demais estados são derivados automaticamente:
  - saudável: cor original;
  - ferido: versão mais escura com detalhes vermelhos;
  - machucado: versão ainda mais escura;
  - morrendo: versão dessaturada e puxada para cinza;
  - morto: fundo preto e retrato escurecido.
- Mudanças de estado recebem uma transição suave.
- Ao adicionar um stack de Cooperação, Fôlego ou Foco, o ícone brilha rapidamente em verde e cresce 10%.
- Ao remover um stack, o ícone recebe uma animação inversa com brilho vermelho.
- As animações também aparecem nos overlays individuais do OBS.


## Atualização v5 — feedback por pingo e sons

- A animação agora acontece no pingo exato que foi clicado ou alterado.
- Ao ganhar um ponto, esse pingo cresce bastante, brilha em verde e retorna ao tamanho normal.
- Ao perder um ponto, o último pingo preenchido cresce, brilha em vermelho e desaparece.
- Foram adicionados dois efeitos sonoros simples:
  - `public/assets/stack-add.wav`
  - `public/assets/stack-remove.wav`
- Os sons são tocados na ficha do jogador e também no overlay do OBS.
- No OBS, para ouvir os sons do overlay, habilite o áudio da fonte Navegador quando necessário.


## Atualização v6 — correção do áudio

Os navegadores modernos bloqueiam áudio automático até existir uma interação manual.

### Ficha do jogador

O som agora é tocado imediatamente no clique do jogador, antes da resposta do servidor. Isso evita o bloqueio causado pelo atraso da sincronização.

### Overlay do OBS

Ao adicionar o overlay individual no OBS, aparecerá temporariamente um botão:

```txt
ATIVAR SOM
clique uma vez no OBS
```

Para habilitar:

1. Clique com o botão direito na fonte Navegador.
2. Escolha `Interagir`.
3. Clique em `ATIVAR SOM`.
4. Feche a janela de interação.

O botão desaparece depois da ativação e a preferência fica salva naquele overlay.

Também confira nas propriedades da fonte Navegador se o áudio está habilitado e, quando necessário, use a opção de controlar o áudio pelo OBS.


## Atualização v7 — sons de mudança de estado

Foram adicionados efeitos sonoros próprios para a deterioração da saúde:

- `public/assets/state-ferido.wav`
  - impacto leve quando o personagem entra em `Ferido`;
- `public/assets/state-machucado.wav`
  - impacto mais grave quando o personagem entra em `Machucado`;
- `public/assets/state-morrendo.wav`
  - impacto crítico e grave quando o personagem entra em `Morrendo`;
- `public/assets/state-morto-flatline.wav`
  - sinal contínuo inspirado no alerta de monitor hospitalar quando o personagem é declarado `Morto`.

Os efeitos são executados:

- imediatamente na ficha do jogador quando ele piora o próprio estado;
- imediatamente no painel do mestre quando o mestre altera o estado;
- no overlay individual do OBS, desde que o som do overlay tenha sido ativado pelo botão `ATIVAR SOM`.

Ao recuperar um estado, nenhum som de dano é executado.


## Atualização v8 — fonte exclusiva de áudio para o OBS

O áudio da transmissão agora é centralizado em uma única fonte de navegador.

Use esta URL no OBS:

```txt
http://localhost:3000/audio
```

### Configuração recomendada

1. Adicione uma nova fonte do tipo `Navegador`.
2. Cole `http://localhost:3000/audio`.
3. Use aproximadamente `360 × 140 px`.
4. Marque a opção equivalente a `Controlar áudio pelo OBS`.
5. Clique com o botão direito na fonte e escolha `Interagir`.
6. Clique em `ATIVAR SOM DA TRANSMISSÃO`.
7. Clique em `TESTAR SOM`.
8. Confira se a fonte aparece no mixer do OBS e se o medidor reage.

A fonte `/audio` pode permanecer em uma cena auxiliar ou fora da área visível da transmissão. Ela serve apenas para enviar os efeitos ao mixer do OBS.

Os overlays individuais continuam sendo usados somente para a parte visual:

```txt
http://localhost:3000/overlay/ID_DO_PERSONAGEM
```

Isso evita sons duplicados quando vários overlays individuais estão abertos ao mesmo tempo.


## Atualização v9 — paletas temáticas selecionáveis

O seletor livre de cores foi removido. Agora cada personagem escolhe uma entre sete paletas preparadas para manter boa leitura visual em todos os estados:

- `Ciano Elétrico`
- `Magenta Ritual`
- `Âmbar Dourado`
- `Verde Ácido`
- `Violeta Arcano`
- `Laranja Brasa`
- `Azul Celeste`

Cada paleta possui versões próprias para:

- `Saudável`: cor principal vibrante;
- `Ferido`: versão mais escura com detalhes vermelhos;
- `Machucado`: versão ainda mais pesada e escura;
- `Morrendo`: versão dessaturada, puxada para cinza, mas ainda com identidade visual;
- `Morto`: preto.

A ficha do jogador e o painel do mestre agora apresentam pequenos losangos coloridos para selecionar o tema. O overlay individual acompanha automaticamente a escolha.


## Atualização v10 — correção dos sons de stacks e animação de rolagem

### Sons de Cooperação, Fôlego e Foco na transmissão

Os eventos de áudio agora recebem um identificador sequencial único no servidor. Isso impede que efeitos rápidos de ganho e perda sejam descartados pela fonte dedicada `/audio`.

Mantenha esta fonte no OBS:

```txt
http://localhost:3000/audio
```

### Rolagem animada de 1d20

Ao clicar no ícone de Cooperação, Fôlego ou Foco:

- toca um novo efeito de dado rolando;
- os números mudam rapidamente entre `1` e `20` durante aproximadamente 2 segundos;
- a animação aparece na ficha do jogador;
- a mesma animação aparece no overlay individual do OBS;
- após os 2 segundos, o resultado real é revelado;
- o resultado final continua sendo um único valor gerado pelo servidor e compartilhado por todas as telas.

Novo arquivo de áudio:

```txt
public/assets/dice-roll.wav
```


## Atualização v11 — animação do dado reforçada no overlay da stream

A rolagem agora fica mais evidente no overlay da transmissão:

- a caixa do dado no canto do overlay cresce e pulsa enquanto o dado está rolando;
- aparece o texto `ROLANDO` durante a animação;
- o número continua mudando rapidamente durante cerca de 2 segundos;
- ao final, o resultado real é revelado e a caixa volta ao estado normal.

Isso vale tanto para o overlay individual quanto para o overlay geral em `/overlay`.


## Atualização v12 — refinamento visual e identidade própria

Esta versão recebeu um polimento geral para a apresentação em live:

- ícones próprios em SVG para `Cooperação`, `Fôlego` e `Foco` (sem emojis);
- badges de estado mais legíveis e com aparência profissional;
- frames, brilhos e detalhes de acabamento nas fichas e overlays;
- blocos de recursos mais definidos, com melhor leitura dos stacks na transmissão;
- popup de rolagem mais chamativo e coeso visualmente;
- efeito sonoro adicional de revelação do resultado do dado:
  - `public/assets/dice-reveal.wav`;
- refinamento de hover, brilho, contraste e microanimações para o projeto inteiro.

O resultado foi pensado para parecer mais próximo de um pacote visual profissional para stream, mantendo o mesmo funcionamento do sistema já existente.


## Atualização v13 — overlay da stream em estilo brutal e sangrento

A parte da stream recebeu uma direção de arte mais agressiva, inspirada em uma identidade visual brutal/sangrenta:

- overlay com acabamento mais pesado, sombrio e contrastado;
- reforço de sangue, sujeira, riscos e brilho vermelho;
- tarja `STATUS AO VIVO` no card da transmissão;
- retratos e blocos com visual mais hostil e dramático;
- popup de dado mais chamativo, com shape mais agressivo;
- stacks e recursos com leitura mais forte na live;
- pulso contínuo no estado `Morrendo` para elevar a tensão visual;
- refinamento focado especificamente na parte usada no OBS.


## Atualização v14 — overlay em escala maior para transmissão

A parte da stream foi ampliada para trabalhar melhor em resoluções maiores no OBS.

### O que mudou

- os cards do `overlay geral` agora estão maiores e mais legíveis;
- o `overlay individual` também recebeu um tamanho base maior;
- retrato, tipografia, status, stacks e popup de dado cresceram proporcionalmente;
- isso melhora a qualidade visual ao reescalonar a fonte de navegador na transmissão.

### Recomendação para o OBS

Para aproveitar melhor a nitidez, use a fonte navegador com resolução mais alta, por exemplo:

- `Overlay geral`: `1920 x 1080`
- `Overlay individual`: entre `1600 x 900` e `1920 x 1080`

Como o overlay é HTML/CSS, ele fica muito mais limpo quando a fonte do navegador já nasce em resolução alta antes de ser redimensionada na cena.


## Atualização v15 — overlay individual renderizado em 2×

O overlay individual agora renderiza internamente em escala `2×`, independentemente do tamanho usado pelo overlay geral.

### Correção realizada

Antes, o overlay individual ainda herdava uma área-base antiga de `360 × 170 px`, o que podia limitar a renderização e fazer com que somente o overlay geral aparentasse ter aumentado.

Agora o link individual usa uma área própria de alta resolução:

```txt
http://localhost:3000/overlay/ID_DO_PERSONAGEM
```

### Configuração recomendada no OBS

Para cada fonte individual do tipo `Navegador`, use:

```txt
Largura: 960
Altura: 430
```

Depois reduza o tamanho normalmente dentro da cena do OBS. A fonte nasce maior e é diminuída na composição, preservando melhor a nitidez.

O overlay geral continua com cards de tamanho considerável, adequado para visualizar vários personagens ao mesmo tempo:

```txt
http://localhost:3000/overlay
```


## Atualização v16 — áudio robusto para o OBS

A fonte `/audio` foi reforçada para impedir que o navegador interno do OBS suspenda os efeitos:

- motor de áudio baseado em Web Audio API;
- pré-carregamento dos arquivos;
- fallback para reprodução HTML quando necessário;
- sinal silencioso de manutenção para manter o canal ativo;
- fila curta para eventos recebidos durante a inicialização;
- painel de diagnóstico mostrando conexão, motor, arquivos carregados e último efeito recebido;
- botões separados para testar ganho, perda, dano e dado.

### Configuração recomendada no OBS

Use uma fonte `Navegador` exclusiva:

```txt
http://localhost:3000/audio
```

Nas propriedades da fonte:

1. marque a opção equivalente a `Controlar áudio pelo OBS`;
2. deixe desmarcada a opção de desligar a fonte quando ela não estiver visível;
3. deixe desmarcada a opção de recarregar a página quando a cena ficar ativa;
4. clique com o botão direito na fonte e escolha `Interagir`;
5. clique em `ATIVAR ÁUDIO DO OBS`;
6. use os botões de teste e confirme a movimentação do medidor no mixer.


## Atualização v17 — áudio em tempo real dentro dos próprios overlays

Os overlays agora escutam diretamente os eventos emitidos pelos jogadores em tempo real.

### O que isso significa

Você pode usar apenas os links visuais normalmente:

```txt
http://localhost:3000/overlay/ID_DO_PERSONAGEM
```

Cada overlay individual recebe e toca os sons do próprio personagem:

- adicionar ponto;
- remover ponto;
- entrar em `Ferido`;
- entrar em `Machucado`;
- entrar em `Morrendo`;
- declarar `Morto`;
- rolar dado;
- revelar resultado do dado.

O overlay geral também recebe os sons de todos os personagens:

```txt
http://localhost:3000/overlay
```

### Primeira ativação no OBS

Ao abrir uma fonte nova, pode aparecer o botão `ATIVAR SOM` no canto superior esquerdo.

Para ativar:

1. clique com o botão direito na fonte navegador;
2. escolha `Interagir`;
3. clique uma vez em `ATIVAR SOM`;
4. feche a janela de interação.

A configuração fica salva para aquele overlay.

### Evitar áudio duplicado

A antiga página dedicada ainda continua disponível:

```txt
http://localhost:3000/audio
```

Mas ela agora é opcional. Se os overlays já estiverem tocando som, remova ou silencie essa fonte no OBS para evitar efeitos duplicados.


# Sistema completo de assassinos

Esta versão integra um painel privado do mestre para assassinos e um motor audiovisual para jogadores e stream.

## Novas rotas

```txt
/assassinos                 painel privado do mestre
/assassino/overlay          overlay geral dos assassinos
/assassino/overlay/ID       overlay individual de um assassino
/efeitos                    camada fullscreen de FX para OBS
/efeitos/ID                 camada FX filtrada para um assassino
```

## Estrutura da ficha do assassino

- criação e exclusão de assassinos;
- upload de retrato;
- seis estilos com Violência e Tormento automáticos;
- Sede de Sangue ajustável e progressiva;
- escolha de uma habilidade especial;
- quatro vantagens selecionáveis;
- controle de perseguição, alvo, obsessão e fase;
- overlay individual e geral;
- comandos de cena em tempo real;
- aplicação de dano e execução no sobrevivente selecionado.

## FX da stream

Adicione uma fonte Navegador no OBS:

```txt
http://localhost:3000/efeitos
```

Use resolução `1920 × 1080`, clique com o botão direito na fonte, escolha `Interagir` e pressione `ATIVAR SOM` uma vez.

Eventos como golpe, golpe crítico, perseguição, tormento, habilidade especial, quebra de obstáculo, arrastar, nova fase e execução geram banners, tremor, sangue, vinheta e áudio próprios.

## Jogadores

As fichas dos jogadores também carregam o motor de FX. Assim, os mesmos eventos aparecem para eles enquanto aparecem na transmissão.

## Atualização v20 — textos resumidos, 5 itens e remoção de efeitos

### Textos mais legíveis

Os cartões de Efeitos, Ações Violentas e Atormentar agora usam descrições corridas na largura disponível do cartão. Os textos foram resumidos para consulta rápida durante a sessão e incluem explicações breves entre parênteses quando um termo do sistema aparece pela primeira vez.

Exemplos:

- `Exposto`: próximo golpe leva diretamente a Em Risco; se já estiver Em Risco, morre.
- `Quebrado`: não recupera Estados de Saúde.
- `Alheio`: não pode ficar de tocaia nem resistir.
- `Ferida Profunda`: perde 1 Fôlego por rodada até ser curado.
- `Sorte`: recebe 1 rerrolagem extra.

### Efeitos removíveis pelo jogador

Os efeitos aplicados pelo assassino continuam aparecendo na ficha do sobrevivente, mas agora cada cartão possui um botão `×`. O jogador pode remover uma condição quando o efeito terminar ou quando o mestre autorizar sua retirada.

### Até 5 itens por sobrevivente

Cada personagem agora possui 5 slots de itens. Personagens salvos na versão anterior são migrados automaticamente: o item antigo ocupa o primeiro slot e os demais começam vazios.

Na ficha do jogador, cada item mantém seus stacks clicáveis para registrar o consumo de cargas. No overlay da transmissão, os itens equipados aparecem de forma compacta com quantidade numérica, por exemplo:

```txt
ITEM MÉDICO ×4
CHAVES ×2
```

Itens sem cargas próprias, como a Lanterna, aparecem com `—`. As Baterias ficam registradas separadamente.

### Limites de cargas

Os itens com cargas usam o limite visual indicado nas referências: até 6 cargas. A Lanterna não possui cargas próprias e utiliza Baterias.

### Vantagens resumidas

As descrições das vantagens dos sobreviventes, das Vantagens Obscuras e das vantagens dos assassinos foram reduzidas para conter apenas as informações necessárias para aplicação durante a sessão.


## Atualização v21 — overlay compacto de itens, efeitos animados e ficha horizontal

### Overlay dos sobreviventes

- Os itens no overlay agora aparecem somente como ícones compactos, acompanhados pelo número de cargas.
- Os nomes completos continuam disponíveis por tooltip, sem poluir a transmissão.
- Os ícones são organizados em uma linha horizontal compacta.
- Os efeitos ativos aparecem como ícones vermelhos.
- Quando uma condição é aplicada, seu ícone entra com uma animação vermelha de impacto.
- Quando uma condição é removida ou curada, o ícone desaparece com uma animação verde.

### Ficha do jogador

- A ficha passou a aproveitar melhor a largura disponível da tela.
- A seção de itens cresce horizontalmente em telas largas.
- Em resoluções intermediárias, a seção reorganiza os cartões automaticamente.
- Em celulares, os cartões continuam empilhados verticalmente.
- As descrições não ficam mais espremidas em colunas estreitas.


## Atualização v25 — sincronização imediata de efeitos

- Efeitos aplicados diretamente pelo painel do assassino agora atualizam imediatamente a ficha e o overlay do alvo.
- Os sons do assassino são transmitidos em tempo real para o overlay individual e para a ficha do personagem afetado.
- Não é mais necessário alterar stacks ou executar outra ação para forçar a atualização visual.

## Atualização v26 — avisos direcionados por alvo e fade único

- Eventos ligados a um sobrevivente agora usam escopo `target`.
- Em `/overlay/ID`, avisos direcionados aparecem somente no overlay do sobrevivente afetado.
- Em `/jogador/ID`, avisos direcionados também aparecem somente na ficha do sobrevivente afetado.
- O overlay geral `/overlay` ignora avisos direcionados para evitar que uma condição individual cubra todos os cards.
- A camada fullscreen `/efeitos` continua mostrando os VFX completos da stream.
- Ao aplicar uma condição, o banner mostra o nome do efeito e uma descrição curta.
- Os banners permanecem legíveis por aproximadamente 4,3 segundos e encerram com um único fade suave de 0,7 segundo.

## v28 — Versão Lite para one-shot: Uma Noite no Inferno

Esta versão simplifica o sistema para uso em uma one-shot curta, mantendo apenas o que é realmente necessário para os jogadores e para o mestre.

### Jogador

A ficha do jogador agora foca em:

- nome, estilo/arquetipo e retrato;
- estado do personagem;
- Cooperação, Fôlego e Foco;
- rolagem de 1d20 nos três recursos;
- resultados visíveis na ficha e no overlay;
- condições ativas, com remoção manual pelo jogador;
- até 5 itens com cargas simples.

Foram removidos da interface principal do jogador os módulos avançados de vantagens normais, vantagens obscuras e estilo mecânico detalhado.

### Mestre

O painel do mestre agora concentra:

- criação de sobreviventes;
- ajuste rápido de estados;
- ajuste de stacks de Cooperação, Fôlego e Foco;
- rolagens rápidas;
- cópia de links de ficha e overlay;
- escolha de alvo;
- dano leve, dano pesado, aparição/susto e tormento;
- aplicação e remoção de condições.

O painel avançado de assassinos foi removido da rotina principal. A ameaça da cabana é controlada diretamente pelo painel do mestre.

### OBS

- Overlay geral: `/overlay`
- Overlay individual: `/overlay/ID_DO_PERSONAGEM`
- Camada de efeitos: `/efeitos`
- Áudio separado: `/audio`

Resoluções recomendadas:

- Overlay individual: `960 × 430`
- FX fullscreen: `1920 × 1080`


## v41 - Correção da ficha do jogador

- A ficha do jogador não carrega mais a camada de FX da stream (`scene-fx.js`).
- Isso evita aparecer a tela/aviso "EVENTO DO ASSASSINO" e o botão "ATIVAR SOM" por cima da ficha.
- Use `/efeitos` somente como fonte de efeitos visuais da stream no OBS.
- Use `/jogador/ID_DO_PERSONAGEM` para abrir a ficha do jogador.

## Rodar no Redmi Pad 2 / Android

Esta versão inclui suporte para rodar o servidor diretamente no Android usando Termux.

Arquivos úteis:

```txt
RODAR_NO_REDMI_PAD_2.md
INSTALAR_ANDROID_TERMUX.sh
INICIAR_ANDROID_TERMUX.sh
```

Primeiro uso no Termux:

```bash
termux-setup-storage
cd /sdcard/Download/alem-da-nevoa-sheet
chmod +x INSTALAR_ANDROID_TERMUX.sh INICIAR_ANDROID_TERMUX.sh
./INSTALAR_ANDROID_TERMUX.sh
./INICIAR_ANDROID_TERMUX.sh
```

Se a pasta estiver em `Downloads`, troque o caminho para:

```bash
cd /sdcard/Downloads/alem-da-nevoa-sheet
```


## v62 — Estilos oficiais

A lista de estilos dos sobreviventes foi substituída pelos estilos das referências: Escapista, Protetor, Rebelde, Reservado, Curioso, Guia, Místico, Resiliente, Gênio, Artista e Amigável.
