#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
cd -- "$(dirname -- "$0")/../.."
ROOT="$PWD"
BACKUP="$(mktemp -d "${TMPDIR:-$HOME}/uni-atualizacao.XXXXXX")"
restore() {
  [ -f "$BACKUP/state.json" ] && { mkdir -p "$ROOT/data"; cp -f "$BACKUP/state.json" "$ROOT/data/state.json"; }
  [ -d "$BACKUP/inspection-images" ] && { mkdir -p "$ROOT/public/inspection-images"; cp -R "$BACKUP/inspection-images/." "$ROOT/public/inspection-images/"; }
  [ -d "$BACKUP/uploads" ] && { mkdir -p "$ROOT/public/uploads"; cp -R "$BACKUP/uploads/." "$ROOT/public/uploads/"; }
}
if [ -f data/state.json ]; then cp data/state.json "$BACKUP/state.json"; fi
if [ -d public/inspection-images ]; then cp -R public/inspection-images "$BACKUP/inspection-images"; fi
if [ -d public/uploads ]; then cp -R public/uploads "$BACKUP/uploads"; fi
trap 'restore; echo "Backup de segurança preservado em: $BACKUP"' EXIT
printf '\n=== UMA NOITE NO INFERNO — ATUALIZAÇÃO SEGURA V73 ===\n\n'
printf 'Parando servidor antigo...\n'
pkill -f "node server.js" 2>/dev/null || true
printf 'Atualizando código via Git...\n'
git pull --ff-only
printf 'Instalando dependências...\n'
npm install
restore
trap - EXIT
rm -rf "$BACKUP"
printf '\nAtualização concluída, campanha preservada. Abrindo servidor...\n'
bash scripts/android/INICIAR_ANDROID_TERMUX.sh
