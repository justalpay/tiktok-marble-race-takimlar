@echo off
chcp 65001 >nul
title TikTok Misket Yarisi - Canli Yayin Baslatici
cd /d "%~dp0"

echo ========================================================
echo   TIKTOK CANLI YAYIN MISKET YARISI BASLATILIYOR...
echo ========================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0launcher.ps1"
pause
