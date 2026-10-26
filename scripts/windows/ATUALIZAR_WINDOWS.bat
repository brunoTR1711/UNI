@echo off
setlocal
cd /d "%~dp0..\.." || exit /b 1
echo === UMA NOITE NO INFERNO - ATUALIZAR V73 ===
set "UNI_BACKUP=%TEMP%\UNI_BACKUP_%RANDOM%_%RANDOM%"
mkdir "%UNI_BACKUP%" 2>nul
if exist "data\state.json" copy /Y "data\state.json" "%UNI_BACKUP%\state.json" >nul
if exist "public\inspection-images" xcopy "public\inspection-images" "%UNI_BACKUP%\inspection-images\" /E /I /Q /Y >nul
if exist "public\uploads" xcopy "public\uploads" "%UNI_BACKUP%\uploads\" /E /I /Q /Y >nul
echo Parando servidores Node...
taskkill /IM node.exe /F >nul 2>nul
echo Atualizando do GitHub...
git pull --ff-only
if errorlevel 1 goto restore_error
call npm install
if errorlevel 1 goto restore_error
if exist "%UNI_BACKUP%\state.json" (
  if not exist "data" mkdir "data"
  copy /Y "%UNI_BACKUP%\state.json" "data\state.json" >nul
)
if exist "%UNI_BACKUP%\inspection-images" xcopy "%UNI_BACKUP%\inspection-images" "public\inspection-images\" /E /I /Q /Y >nul
if exist "%UNI_BACKUP%\uploads" xcopy "%UNI_BACKUP%\uploads" "public\uploads\" /E /I /Q /Y >nul
rmdir /S /Q "%UNI_BACKUP%" 2>nul
echo Versao atualizada; campanha preservada.
node server.js
pause
exit /b 0
:restore_error
echo Erro na atualizacao. Seus arquivos continuam protegidos em %UNI_BACKUP%.
pause
exit /b 1
