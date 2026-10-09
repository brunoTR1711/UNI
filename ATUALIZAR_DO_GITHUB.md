# Como atualizar no Redmi Pad 2 pelo GitHub

Depois que o projeto estiver no GitHub, o tablet não precisa mais receber ZIP novo.

## Primeira instalação

```bash
cd ~
pkg update -y
pkg install -y git nodejs

git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git alem-da-nevoa-sheet
cd alem-da-nevoa-sheet
npm install
node server.js
```

## Atualizações futuras

```bash
cd ~/alem-da-nevoa-sheet
bash ATUALIZAR_TERMUX.sh
```

Se quiser fazer manualmente:

```bash
cd ~/alem-da-nevoa-sheet
pkill node
git pull --ff-only
npm install
node server.js
```

## Dados da mesa

O GitHub atualiza o sistema, mas não substitui os dados da sua campanha.

Os dados ficam em:

```txt
data/state.json
```

Essa pasta fica fora do Git para não apagar nem vazar a mesa.
