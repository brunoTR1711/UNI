@echo off
title Alem da Nevoa - Servidor
cd /d "%~dp0"

if not exist "node_modules" (
  echo As dependencias ainda nao foram instaladas.
  echo Execute primeiro o arquivo INSTALAR_E_ABRIR.bat
  echo.
  pause
  exit /b 1
)

call npm start
pause
