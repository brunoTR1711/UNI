@echo off
title Alem da Nevoa - Instalacao e Servidor
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ============================================================
  echo  NODE.JS NAO FOI ENCONTRADO
  echo ============================================================
  echo.
  echo Instale o Node.js LTS pelo site oficial:
  echo https://nodejs.org/
  echo.
  echo Depois feche esta janela, abra este arquivo novamente
  echo e aguarde a instalacao das dependencias.
  echo.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo.
  echo ============================================================
  echo  NPM NAO FOI ENCONTRADO
  echo ============================================================
  echo.
  echo Reinstale o Node.js LTS marcando a opcao para adicionar
  echo o Node.js ao PATH do Windows.
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  ALEM DA NEVOA - PREPARANDO O SERVIDOR
echo ============================================================
echo.

if not exist "node_modules" (
  echo Instalando dependencias. Isso pode levar alguns minutos...
  call npm install
  if errorlevel 1 (
    echo.
    echo Nao foi possivel instalar as dependencias.
    echo Copie a mensagem de erro acima ou tire um print.
    echo.
    pause
    exit /b 1
  )
)

echo.
echo Iniciando o servidor...
echo Quando aparecer o endereco, abra no navegador:
echo http://localhost:3000/mestre
echo.
call npm start

echo.
echo O servidor foi encerrado.
pause
