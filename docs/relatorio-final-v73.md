# Relatório de revisão — UNI v73

Base: `UNI(3).rar` fornecido pelo usuário. Revisão concluída em 26/10/2026.

## Funcionalidades preservadas
- Socket.IO entre PC, Termux, Tailscale, OBS
- D20, frames remotos e sons por faixa de resultado
- Status de saúde, cores por estado e sons por dano
- Sete condições, itens com cargas e vantagens
- Inspeção de documentos: catálogo, destinatários, histórico, revogação e FX
- Jumpscare global, sons aleatórios de morte, cards FX VHS

## Mudanças
- Cores diferentes: vermelho, amarelo, turquesa, sem tons neutros como tema saudável; estado Morrrendo continua dessaturado e Morto preto
- Overlay sem asteriscos, sem rótulo ESTILO
- Central simplificada, explicação Tailscale expansível
- Áudio sob demanda, sem `preloadAll()` durante desbloqueio; reduz bloqueio inicial e decodificações simultâneas
- Gráficos móveis: redução de blur e sombras grandes, preservando animações funcionais
- Assets separados e URLs antigas redirecionadas para as novas
- 116 ícones PNG transparentes 1×1 com fallback SVG existente; guia CSV no docs
- Arquivos WAV de cena ausentes da base possuem modelos silenciosos válidos para personalização, evitando respostas 404
- Scripts de atualização do Termux e Windows com backup temporário de estado/inspeções/retratos

## Validação
- `node scripts/check.js` — sintaxe de 30 blocos de script e referências HTML
- `npm test` — 58 testes automatizados aprovados
- Testes HTTP integrados: rotas, Socket.IO, personagens, danos, vantagens, D20, documento, exclusão e áudio
- CSS da central inspecionado em 1280×800 e 412×915: sem overflow horizontal
- Existência de todas as referências atuais de áudio e dos PNGs de FX verificada

Limite: a execução em Redmi Pad 2 e OBS de verdade deve ser confirmada no ambiente do usuário. Uma suíte local e a emulação móvel não provam fluidez em todos os dispositivos.

## Segurança de atualização
Não coloque `node_modules` no GitHub. Antes de atualizar qualquer clone que já contenha campanha, copie para fora do repositório `data/state.json`, `public/inspection-images/` e `public/uploads/`. O ZIP de entrega **não inclui** os dados privados enviados no RAR; ao atualizar um clone existente, preserve-os.

`.gitignore` não remove arquivos que já eram rastreados pelo Git; se `data/state.json` tiver sido commitado anteriormente, use a rotina de backup e só depois remova-o do controle de versão com `git rm --cached data/state.json` (não remove o arquivo local). Também revise se as imagens privadas de inspeção já foram publicadas no histórico GitHub. Os scripts de atualização da v73 fazem cópia de segurança automaticamente; para a primeira atualização, faça backup manual antes de usar um script de versão antiga.
