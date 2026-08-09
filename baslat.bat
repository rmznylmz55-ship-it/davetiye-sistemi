@echo off
title Davetiye Editor - RMZN Panel
echo =====================================
echo   Davetiye Editor Baslatiliyor...
echo =====================================
echo.
cd /d "%~dp0"
echo Klasor: %cd%
echo.

set PORT=3000

where node >nul 2>nul
if %errorlevel% equ 0 goto node_server

where npx >nul 2>nul
if %errorlevel% equ 0 goto npx_server

where python >nul 2>nul
if %errorlevel% equ 0 goto python_server

where py >nul 2>nul
if %errorlevel% equ 0 goto py_server

echo [HATA] Node.js ve Python bulunamadi!
echo LUTFEN Node.js kurun: https://nodejs.org
echo.
pause
exit /b 1

:node_server
echo HTTP sunucu baslatiliyor (node server.js): http://localhost:%PORT%
echo NOT: "Kaydet" butonu dosyalari bu klasore yazar.
start "" "http://localhost:%PORT%/index.html"
echo Tarayicida otomatik acildi. Cikmak icin Ctrl+C
echo.
node "%~dp0server.js" %PORT%
goto end

:npx_server
echo HTTP sunucu baslatiliyor (npx serve): http://localhost:%PORT%
echo NOT: npx ile "klasore kaydet" DEVREDISI. Node'un yoksa dusuyorsun.
start "" "http://localhost:%PORT%/index.html"
echo Tarayicida otomatik acildi. Cikmak icin Ctrl+C
echo.
npx serve . --listen %PORT% --no-clipboard
goto end

:python_server
echo HTTP sunucu baslatiliyor (python): http://localhost:%PORT%
start "" "http://localhost:%PORT%/index.html"
echo Tarayicida otomatik acildi. Cikmak icin Ctrl+C
echo.
python -m http.server %PORT% --bind 127.0.0.1
goto end

:py_server
echo HTTP sunucu baslatiliyor (py): http://localhost:%PORT%
start "" "http://localhost:%PORT%/index.html"
echo Tarayicida otomatik acildi. Cikmak icin Ctrl+C
echo.
py -m http.server %PORT% --bind 127.0.0.1
goto end

:end
pause
