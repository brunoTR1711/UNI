#!/data/data/com.termux/files/usr/bin/bash
set -e
cd "$(dirname "$0")"
clear
printf '\n=== UMA NOITE NO INFERNO — ATUALIZAR PELO GITHUB ===\n\n'
printf 'Parando servidor antigo, se existir...\n'
pkill -f "node server.js" 2>/dev/null || true
printf 'Baixando atualizacao do GitHub...\n'
git pull --ff-only
printf 'Instalando/atualizando dependencias...\n'
npm install
printf '\nAtualizacao concluida. Iniciando servidor...\n\n'
bash ./INICIAR_ANDROID_TERMUX.sh
