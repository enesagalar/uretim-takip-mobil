@echo off
chcp 65001 >nul
title Ekol Glass - Tünel Bekçisi
cd /d "%~dp0.."
echo.
echo Ekol Glass Tünel Bekçisi başlatılıyor...
echo (Kapatmak için bu pencereyi kapatın)
echo.
node tunnel\watchdog.js
if errorlevel 1 (
  echo.
  echo HATA: Node.js bulunamadi. https://nodejs.org adresinden kurun.
  pause
)
