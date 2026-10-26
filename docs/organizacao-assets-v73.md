# Organização final dos assets — UNI v73

## Estrutura

- `public/assets/audio/estados/` — efeitos de saúde e morte
- `public/assets/audio/dados/` — rolagem e revelação D20
- `public/assets/audio/efeitos/` — condições (OGG killer-...)
- `public/assets/audio/efeitos/modelos/` — exemplos silenciosos legados, NÃO tocados
- `public/assets/audio/recursos/` — aumento e diminuição de stacks
- `public/assets/audio/jumpscare/` — JUMPSCARE1/2
- `public/assets/audio/cena/` — áudio cênico antigo
- `public/assets/fx/event-cards/` — event cards completos com transparência
- `public/assets/ui/` — imagem PNG do dado
- `public/assets/icons/{vantagens,efeitos,itens,atributos,estilos,vantagens-assassino,habilidades-assassino}/` — PNGs individuais de customização.
- `public/inspection-images/` — imagens **criadas no painel do mestre**. Não mover nem apagar: URLs e histórico dependem disso.
- `public/uploads/portraits/` — retratos criados pelo aplicativo (quando existirem); igualmente persistentes.

## Como substituir ícones

Cada PNG em `assets/icons/` é um placeholder **transparente válido de 1x1**. O navegador exibe o SVG original enquanto for 1x1. Substitua por um PNG real (recomendação 128x128 ou 256x256) com o **mesmo nome** e transparência. O SVG some automaticamente após recarregar a página. Isso evita perder o indicador antigo por falta de imagem.

As vantagens têm nome técnico baseado em `key` (ex.: `vant-1.png`), e itens em `key` completo (`cura-1.png`); consulte `player-catalog.js`, `advantages.js` ou os nomes dos arquivos. Arquivos de vantagens de assassino e habilidades têm pastas distintas, mesmo que as chaves sejam iguais.

## Compatibilidade / Atualização

Os caminhos antigos de assets existentes continuam aceitos como redirecionamentos HTTP 302 via `lib/legacy-assets-map.json`; as novas páginas já apontam para os caminhos reorganizados. Mantenha `data/`, `public/inspection-images/` e `public/uploads/` do servidor atual. Não envie dados privados da campanha ao GitHub.

## Otimização

O áudio deixa de pré-decodificar todos os arquivos a cada toque/desbloqueio; só o som utilizado é carregado. No mobile, removemos blurs dispendiosos e sombras grandes, **sem desabilitar dados, inspeções e efeitos**. As regras de status e cores continuam iguais, acrescidas apenas de vermelho, amarelo e turquesa.
