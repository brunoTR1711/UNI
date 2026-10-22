# Inspeção de documentos — fichas e painel do mestre

Este recurso é **independente dos itens consumíveis**. Bilhetes, páginas, fotografias e relatórios não ocupam slots, não têm cargas e não alteram os atributos do personagem.

## Como o mestre envia

1. Abra `/mestre` e encontre **Inspeção de documentos** na coluna de controles.
2. Clique **Novo documento**. Escreva um nome e o texto completo. Datas, parágrafos e assinaturas podem ser inseridos com quebras de linha.
3. Escolha entre **Manuscrito**, **Datilografado** e **Página impressa**. A prévia é mostrada no editor.
4. Selecione uma imagem PNG, WebP ou JPG. O servidor grava o arquivo em `public/inspection-images/` sem convertê-lo; a transparência de PNG e WebP permanece intacta. Tamanho máximo: **6 MB**.
5. Marque **um ou mais personagens** e clique **Salvar e enviar**. O comando envia para todas as fichas selecionadas, mesmo que o navegador esteja em outro dispositivo conectado ao mesmo servidor (incluindo Tailscale).

Use **Salvar** para preparar documentos antes da sessão. Clique num documento existente na lista para editar, enviar novamente ou excluir. Documentos já enviados preservam a versão do texto/imagem que o jogador recebeu, mesmo se o mestre editar ou apagar o original do catálogo.

## O que o jogador vê

- Um documento recebido abre uma janela pequena sobre a ficha, com escalonamento rápido de 0 a 100% e aviso sonoro discreto quando a política de áudio do navegador permitir.
- A imagem fica **flutuando levemente** até clicar em **Ler**; então permanece estática enquanto o texto é exibido.
- **Fechar** encerra a inspeção sem alterar os demais controles da ficha.
- O **Histórico de leitura** fica no fim da ficha. Ao clicar no nome, abre somente o texto, sem imagem ou animação. Recebimentos não concluídos reaparecem após recarregar a ficha.
- Se houver vários recebimentos, eles podem ser lidos sucessivamente.

## Arquivos e backup

- Definições dos documentos: `data/state.json` em `inspectionDocuments`.
- Entregas e leituras: `data/state.json` em `characters.<id>.inspectionDeliveries`.
- Imagens: `public/inspection-images/` (também pode colocar imagens manualmente na pasta para manter uma cópia).

**Ao atualizar o tablet**, preserve a pasta `data/` **e** `public/inspection-images/`. Para GitHub, a pasta de imagens de inspeção é separada dos retratos (`public/uploads/`). Se guardar imagens no repositório, lembre-se de que elas podem ficar públicas num repositório público.

O servidor original não tem autenticação por usuário; esta função segue o mesmo modelo de confiança do painel do mestre. Não exponha a aplicação inteira à internet aberta sem proteção adicional.
