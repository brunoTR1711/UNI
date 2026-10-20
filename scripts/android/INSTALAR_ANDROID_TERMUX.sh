#!/data/data/com.termux/files/usr/bin/bash
set -e
cd -- "$(dirname -- "$0")/../.."
clear
printf '\n=== UMA NOITE NO INFERNO — INSTALAR NO ANDROID / TERMUX ===\n\n'
printf 'Atualizando Termux e instalando Node.js...\n'
pkg update -y
pkg upgrade -y
pkg install -y nodejs
printf '\nInstalando dependencias do projeto...\n'
npm install
printf '\nPronto. Agora rode, na pasta do projeto:\n\n  bash scripts/android/INICIAR_ANDROID_TERMUX.sh\n\n'
