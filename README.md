# Uma Noite no Inferno

VTT local para uma mesa de RPG, com fichas de sobreviventes, painel do mestre e overlays para OBS. O servidor usa Node.js, Express e Socket.IO; as telas usam HTML, CSS e JavaScript, sem etapa de build.

## Iniciar

Instale Node.js 20 ou superior e execute na pasta do projeto:

```bash
npm ci
npm start
```

Abra `http://localhost:3000`. O terminal também mostra os endereços da rede. Para outra porta, defina a variável de ambiente `PORT` antes de iniciar.

No Windows, abra `scripts/windows/INSTALAR_E_ABRIR.bat` na primeira execução e `scripts/windows/ABRIR_SERVIDOR.bat` nas seguintes. Para Android/Termux, consulte o [guia do Android](docs/android.md).

## Organização da pasta

```text
UNI/
├── docs/                 Guias de Android e manutenção
├── scripts/
│   ├── android/          Instalação, inicialização e atualização no Termux
│   ├── windows/          Atalhos de instalação, inicialização e atualização
│   └── check.js          Verificação de código e referências
├── public/
│   ├── assets/           Sons e imagem do dado
│   └── …                 Páginas, estilos e scripts do navegador
├── test/                 Testes de regressão
├── data/                 Dados locais da mesa
├── node_modules/         Dependências instaladas
├── .github/              Verificações do GitHub Actions
├── .gitignore            Exclusões de arquivos locais
├── package.json          Configuração, comandos e dependências
├── package-lock.json     Versões das dependências
├── server.js             Servidor
└── README.md             Instruções principais
```

A pasta `.git/` guarda o histórico do repositório. Quando houver uploads, os retratos ficam em `public/uploads/`. Essas pastas têm função e devem ser preservadas na instalação em uso.

## Telas e funcionalidades

| Endereço | Uso |
| --- | --- |
| `/` | Central e endereços de rede |
| `/mestre` | Personagens, recursos, dados, dano, condições, obsessão e seletores do assassino |
| `/jogadores` | Seleção de personagem |
| `/jogador/ID` | Ficha individual |
| `/overlay` | Overlay de todos os sobreviventes visíveis |
| `/overlay/ID` | Overlay de um sobrevivente |
| `/audio` | Fonte opcional de áudio para OBS e diagnóstico |
| `/efeitos` | Camada de efeitos da stream |
| `/efeitos/ID` | Efeitos filtrados por assassino |
| `/assassinos` | Página com acesso ao painel do mestre |
| `/assassino/overlay` | Overlay geral dos assassinos |
| `/assassino/overlay/ID` | Overlay individual de assassino |
| `/api/state` | Estado atual da mesa em JSON |
| `/api/network` | Versão, porta e endereços de rede |

As fichas mantêm nome editável, estilo, sete temas, retratos por estado, Cooperação/Fôlego/Foco, rolagens de d20, quatro vantagens, cinco slots de itens, condições removíveis e anotações locais. Os estados são Saudável, Ferido, Machucado, Morrendo e Morto. Cada estilo só pode ser escolhido por um sobrevivente.

O painel do mestre mantém criação/exclusão de personagens, links individuais, ajuste de recursos e estados, histórico de rolagens, dano, condições, obsessão e seleção de vantagens/habilidades do assassino. Os eventos existentes de bloqueio da ficha e visibilidade do overlay continuam disponíveis. O servidor mantém o modelo de assassinos, seus eventos e os overlays correspondentes.

As anotações da ficha ficam no armazenamento do navegador usado pelo jogador. Os demais dados da mesa são sincronizados pelo servidor.

### Estilos

| Estilo | Cooperação | Fôlego | Foco |
| --- | ---: | ---: | ---: |
| Escapista | 1 | 6 | 1 |
| Protetor | 6 | 1 | 1 |
| Rebelde | 1 | 3 | 4 |
| Reservado | 1 | 4 | 3 |
| Curioso | 3 | 1 | 4 |
| Guia | 4 | 1 | 3 |
| Místico | 1 | 1 | 6 |
| Resiliente | 2 | 3 | 3 |
| Gênio | 2 | 1 | 5 |
| Artista | 2 | 2 | 4 |
| Amigável | 4 | 2 | 2 |

A migração dos estilos antigos continua automática: Robusto → Resiliente, Investigativo → Curioso, Altruísta → Amigável, Adepto → Guia, Sensitivo → Místico, Intelectual → Gênio, Artístico → Artista e Diplomático → Amigável.

## OBS e áudio

Adicione uma fonte do tipo Navegador com a URL desejada. Para um sobrevivente, use `/overlay/ID`; para todos, `/overlay`. O fundo dos overlays é transparente. A configuração anterior de referência é `960 × 430` para overlay individual e `1920 × 1080` para a camada `/efeitos`; ajuste a fonte à composição da cena.

Os overlays recebem os sons do personagem em tempo real. Se aparecer **ATIVAR SOM**, clique com o botão direito na fonte, escolha **Interagir** e pressione o botão. A página `/audio` continua disponível para quem prefere uma fonte dedicada: nela há ativação, testes e diagnóstico. Evite habilitar simultaneamente fontes que reproduzem o mesmo evento, para não duplicar o som.

A ficha do jogador não carrega a camada de FX da stream. A animação do dado dura três segundos, usa o resultado gerado pelo servidor e mantém o mesmo identificador entre ficha, mestre e overlay. O resultado permanece na ficha; a apresentação temporária do overlay desaparece depois.

## Dados e atualização

- `data/state.json`: estado persistente da mesa.
- `public/uploads/portraits/`: retratos dos sobreviventes. O estado guarda seus caminhos, evitando reenviar imagens grandes a cada clique.
- Retratos antigos em Data URL são convertidos automaticamente quando suportados pelo servidor.
- Preserve **as duas pastas** ao atualizar ou transferir a mesa. Elas não fazem parte do repositório.
- As gravações são agrupadas, executadas em sequência e substituem o JSON por meio de um arquivo temporário. O encerramento normal por SIGINT/SIGTERM grava o último estado.

As instruções de atualização, cópia dos dados e publicação do código estão no [guia de manutenção](docs/manutencao.md). Os atualizadores ficam em `scripts/windows/ATUALIZAR_WINDOWS.bat` e `scripts/android/ATUALIZAR_TERMUX.sh`.

## Manutenção e verificações

```bash
npm run check
npm test
```

`check` verifica a sintaxe dos scripts, inclusive os scripts embutidos no HTML, e as referências locais de arquivos. Funciona no Windows e no Linux sem depender da expansão de curingas do terminal.

`test` inicia um servidor em porta livre com dados temporários separados da mesa. Cobre as rotas, cache, estilos exclusivos, bloqueios, recursos, condições, itens, retratos, rolagens, comandos de assassino e persistência. Não exige dependências de teste adicionais. O GitHub Actions executa as duas verificações usando as versões do `package-lock.json`.

### Revisão de desempenho e organização

- Removidos estilos de telas antigas e o script sem uso do antigo painel avançado. As rotas e funções atuais foram mantidas.
- Centralizado o controlador de relógio e frames do dado em `common.js`.
- Ficha e overlay individual evitam redesenhar por alterações de outros personagens. O mestre reaproveita os cartões que não mudaram.
- Os cliques da ficha e dos cartões do mestre usam um listener por contêiner.
- Overlay e efeitos compartilham a conexão Socket.IO, com os listeners registrados antes de receber o estado inicial.
- Removida a consulta HTTP redundante do painel de jogadores; ele recebe o estado pela conexão em tempo real.
- Arquivos estáticos usam ETag e revalidação: conteúdo inalterado retorna `304` sem baixar novamente. A API de estado usa `no-store`.
- O áudio libera suas conexões ao terminar e decodifica o buffer sem uma cópia intermediária.
- Corrigidos os excessos de largura da central em telas pequenas e do mestre na faixa intermediária de desktop.
- As antigas notas de versões e diagnósticos foram consolidadas neste documento. O histórico completo permanece no Git.

A revisão incluiu testes de interação no Chrome e medidas de layout das quatro telas principais em 320, 360, 390, 768, 1024, 1440 e 1920 px. A comparação visual também incluiu overlays e páginas de áudio/FX. A emulação de tela e toque não substitui testes no aparelho Android e no navegador integrado do OBS.

## Diagnóstico rápido

Se uma página ficar desatualizada após substituir arquivos, reinicie o servidor correto e recarregue a página/fonte do OBS. A revalidação atual permite reaproveitar arquivos inalterados sem fixar uma versão antiga no cache.

Se o dado não aparecer, confira se ficha e overlay estão ligados à mesma instância do servidor e se há erros no console. A identificação da rolagem, seus frames e o resultado final devem vir da mesma instância.

Para problemas de som, use os testes de `/audio`, confira a ativação por interação e o mixer do OBS. Em acesso remoto, confirme o endereço/porta do servidor e a conectividade da rede utilizada. O projeto mantém o modelo original de acesso por links, sem autenticação forte.
