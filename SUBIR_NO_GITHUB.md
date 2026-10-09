# Como subir este projeto no GitHub

Este pacote já está limpo para GitHub. Ele não inclui `node_modules` nem os dados vivos da mesa.

## Jeito simples pelo site do GitHub

1. Crie um repositório vazio no GitHub.
2. Extraia este ZIP no PC.
3. Abra a pasta `uma-noite-no-inferno-vtt`.
4. No GitHub, use **Add file > Upload files**.
5. Arraste os arquivos e pastas de dentro da pasta do projeto.
6. Faça o commit.

## Jeito recomendado pelo terminal

Dentro da pasta `uma-noite-no-inferno-vtt`:

```bash
git init
git add .
git commit -m "Versao inicial do VTT Uma Noite no Inferno"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

## O que não deve ir para o GitHub

O `.gitignore` já evita subir:

- `node_modules/`
- `data/`
- `public/uploads/`
- `uploads/`
- logs e arquivos temporários

A pasta `data/` guarda personagens, estados, fotos em base64 e dados vivos da mesa. Ela deve ficar local no tablet/PC.
