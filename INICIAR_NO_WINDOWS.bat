@echo off
chcp 65001 > nul
title Revelação RGG Cards - Iniciando Aplicação Local
color 0B

echo ========================================================
echo             REVELAÇÃO RGG CARDS - WINDOWS
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERRO] O Node.js não foi encontrado no seu PC.
    echo Por favor, instale o Node.js em https://nodejs.org/ para executar.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [1/3] Primeira execução detectada! Instalando dependências...
    call npm install
)

if not exist "dist" (
    echo [2/3] Compilando arquivos da aplicação...
    call npm run build
)

echo [3/3] Iniciando o servidor de vídeos e cartas...
echo.
echo Aplicação rodando localmente!
echo Os vídeos enviados ficam salvos na pasta "public/uploads" no seu PC.
echo.

start "" "http://localhost:3000"
call npm start
pause
