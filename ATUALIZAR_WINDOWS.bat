@echo off
cd /d "%~dp0"
echo === UMA NOITE NO INFERNO - ATUALIZAR PELO GITHUB ===
echo.
echo Fechando servidores Node antigos, se existirem...
taskkill /IM node.exe /F >nul 2>nul
echo Baixando atualizacao do GitHub...
git pull --ff-only
echo Instalando/atualizando dependencias...
npm install
echo.
echo Iniciando servidor...
node server.js
pause
