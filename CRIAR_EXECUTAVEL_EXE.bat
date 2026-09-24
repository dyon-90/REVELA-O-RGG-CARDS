@echo off
chcp 65001 > nul
title Revelação RGG Cards - Gerador de Executável Windows (.EXE)
color 0E

echo ========================================================
echo       REVELAÇÃO RGG CARDS - GERADOR DE EXECUTÁVEL (.EXE)
echo ========================================================
echo.
echo [1/4] Verificando ambiente Node.js...

where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERRO] O Node.js não foi encontrado no seu computador!
    echo Para gerar o executável .exe, por favor instale o Node.js:
    echo Acesse: https://nodejs.org/ (Baixe a versão LTS)
    echo Depois de instalar, execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detectado!
echo.
echo [2/4] Instalando dependências e ferramentas do Electron...
call npm install
call npm install --save-dev electron electron-builder

echo.
echo [3/4] Compilando a interface e o sistema de cartas...
call npm run build

echo.
echo [4/4] Gerando o executável Windows (.exe)...
echo Isso pode levar de 1 a 2 minutos na primeira vez. Por favor, aguarde...
call npx electron-builder --win portable nsis

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ========================================================
    echo      SUCESSO! O EXECUTÁVEL .EXE FOI GERADO COM ÊXITO!
    echo ========================================================
    echo.
    echo Os seguintes arquivos foram criados na pasta "dist_electron":
    echo  - RevelacaoRGG_Cards_Portable.exe (Executável direto, não precisa instalar!)
    echo  - Instalador Setup Windows (.exe)
    echo.
    echo Abrindo a pasta do executável agora...
    start "" "dist_electron"
) else (
    color 0C
    echo.
    echo [AVISO] Houve um aviso durante a criação do .exe.
    echo Tentando gerar executável portátil alternativo...
    call npx electron-packager . "RevelacaoRGG_Cards" --platform=win32 --arch=x64 --out=dist_electron --overwrite
    if exist "dist_electron" (
        start "" "dist_electron"
    )
)

echo.
echo Pressione qualquer tecla para fechar esta janela...
pause > nul
