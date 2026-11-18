@echo off
cd /d "%~dp0"
chcp 65001 >nul
title TikTok Canli Misket Yarisi Sunucusu
echo ========================================================
echo   TIKTOK CANLI YAYIN MISKET YARISI BASLATILIYOR...
echo ========================================================
echo.

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    )
)

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [UYARI] Bilgisayarinizda Node.js bulunamadi!
    echo Lutfen https://nodejs.org adresinden Node.js LTS surumunu indirip kurun.
    echo.
    echo Simdilik dogrudan Simulasyon/Test modunda tarayicida aciliyor...
    start "" "%~dp0public\index.html"
    pause
    exit /b
)

if not exist "%~dp0node_modules" (
    echo [1/2] Ilk kurulum yapiliyor (TikTok baglanti paketleri indiriliyor)...
    call npm install
    echo.
)

echo [2/2] Sunucu baslatiliyor: http://localhost:3000
echo OBS / TikTok Live Studio adresi: http://localhost:3000?obs=1
echo.
start "" "http://localhost:3000"
node server.js
pause
