# Atualização, dados e GitHub

## Instalar a partir do GitHub

No Termux, instale as ferramentas necessárias:

```bash
pkg update -y
pkg install -y git nodejs
```

Depois, no computador ou no Termux, substitua o endereço abaixo pelo repositório da mesa:

```bash
git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git UNI
cd UNI
npm ci
npm start
```

## Atualizar uma instalação

Os atalhos ficam separados por plataforma:

- Windows: `scripts/windows/ATUALIZAR_WINDOWS.bat`.
- Android: `bash scripts/android/ATUALIZAR_TERMUX.sh`.

Os atualizadores mantêm o comportamento de encerrar processos Node antes da atualização. No Windows, o script encerra todos os processos `node.exe`; no Android, procura processos `node server.js`. Se houver outros projetos em execução, prefira o procedimento manual.

Para atualizar manualmente, encerre o servidor da mesa com **Ctrl+C** e execute na raiz:

```bash
git pull --ff-only
npm ci
npm start
```

Se o Git informar alterações locais ou conflito, revise essas alterações antes de continuar.

## Preservar os dados

Guarde uma cópia destas pastas antes de substituir ou transferir a instalação:

| Pasta | Conteúdo |
| --- | --- |
| `data/` | Estado persistente da mesa |
| `public/uploads/` | Retratos enviados pelos jogadores |

As anotações individuais ficam no navegador do jogador, não no servidor.

`node_modules/` contém as dependências instaladas e é necessário para executar esta instalação. Pode ser reconstruído com `npm ci`, mas não precisa ser enviado ao GitHub.

## Publicar o código

Para uma pasta que ainda não esteja vinculada a um repositório, crie um repositório vazio no GitHub e execute:

```bash
git init
git add .
git commit -m "Projeto Uma Noite no Inferno"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

O `.gitignore` exclui dependências, dados da mesa, uploads, logs e configurações locais. Mantenha `package-lock.json` no repositório para reproduzir as versões instaladas.

Se usar o envio de arquivos pelo site do GitHub, selecione apenas os arquivos do projeto: o envio manual não aplica o `.gitignore` da mesma forma que `git add`.

## Verificar o projeto

```bash
npm run check
npm test
```

Os testes criam dados temporários separados da sua mesa. A estrutura e os recursos do sistema estão descritos no [README](../README.md).
