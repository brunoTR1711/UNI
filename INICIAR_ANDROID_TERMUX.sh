#!/data/data/com.termux/files/usr/bin/bash
set -e
clear
printf '\n=== UMA NOITE NO INFERNO — SERVIDOR NO ANDROID ===\n\n'
termux-wake-lock 2>/dev/null || true
printf 'Tentando manter o tablet acordado enquanto o servidor roda...\n'
printf '\nEnderecos provaveis para abrir no navegador ou no OBS:\n'
if command -v ip >/dev/null 2>&1; then
  ip -4 addr show wlan0 2>/dev/null | awk '/inet / {print "  http://" $2}' | sed 's#/24#:3000#;s#/.*#:3000#' || true
  ip -4 addr show 2>/dev/null | awk '/inet / && $2 !~ /^127\./ {print "  http://" $2}' | sed 's#/24#:3000#;s#/.*#:3000#' | sort -u || true
fi
printf '\nRotas importantes:\n  /            Central\n  /mestre      Painel do mestre\n  /jogadores   Painel para abrir fichas\n  /overlay     Overlay geral\n  /efeitos     FX da stream\n\n'
printf 'Servidor iniciando... Para parar: CTRL + C\n\n'
node server.js
