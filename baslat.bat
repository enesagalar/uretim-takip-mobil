@echo off
chcp 65001 >nul
title Ekol Glass Uretim Takip - Mobil
cd /d "%~dp0"
echo.
echo Ekol Glass Uretim Takip - Mobil LAN Sunucusu baslatiliyor...
echo (Kapatmak icin bu pencereyi kapatin veya Ctrl+C basin)
echo.
node server.js
if errorlevel 1 (
  echo.
  echo HATA: Node.js bulunamadi. https://nodejs.org adresinden kurun.
  pause
)
