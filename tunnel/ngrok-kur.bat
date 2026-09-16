@echo off
chcp 65001 >nul
title Ekol Glass - ngrok Kurulumu
cd /d "%~dp0.."
echo.
echo ============================================
echo   EKOL GLASS - NGROK KALICI TUNEL KURULUMU
echo ============================================
echo.
echo Bu kurulum BIR KEZ yapilir. Sonrasinda tamamen otomatiktir.
echo.
echo  1. https://dashboard.ngrok.com/signup  adresinden ucretsiz hesap acin
echo  2. https://dashboard.ngrok.com/get-started/your-authtoken adresinden
echo     authtoken'inizi kopyalayin
echo  3. https://dashboard.ngrok.com/tunnels/authtokens ... yerine:
echo     "Universal Gateway ^| Domains" bolumunden statik domain'inizi alin
echo     (orn: ekol-glass.ngrok-free.app)
echo.
set /p TOKEN="Authtoken'inizi yapistirin: "
set /p DOMAIN="Statik domain'inizi yazin (orn: ekol-glass.ngrok-free.app): "
echo.
if "%TOKEN%"=="" goto :hata
if "%DOMAIN%"=="" goto :hata

echo ngrok indiriliyor...
if not exist tunnel\ngrok.exe (
  curl -sL -o ngrok.zip https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip
  powershell -NoProfile -Command "Expand-Archive -Force ngrok.zip tunnel" >nul 2>&1
  del ngrok.zip
)
if not exist tunnel\ngrok.exe (
  echo INDIRME BASARISIZ - ngrok.exe'yi elle https://ngrok.com/download adresinden
  echo tunnel\ klasorune koyup bu kurulumu tekrar calistirin.
  pause
  exit /b 1
)

tunnel\ngrok.exe config add-authtoken %TOKEN%
if errorlevel 1 goto :hata

> tunnel\ngrok.conf echo NGROK_URL=https://%DOMAIN%
echo.
echo Yapilandirma tamam. Bekci yeniden baslatiliyor...
taskkill /F /IM cloudflared.exe >nul 2>&1
taskkill /F /IM ngrok.exe >nul 2>&1
wmic process where "commandline like '%%watchdog.js%%' and name='node.exe'" call terminate >nul 2>&1
timeout /t 2 >nul
start "" tunnel\baslat-tunel.bat
echo.
echo KURULUM TAMAM! Tum cihazlar otomatik olarak yeni adrese gececek.
echo (Mobil uygulamada hicbir ayar yapmaniza gerek yok.)
pause
exit /b 0

:hata
echo.
echo HATA: Authtoken ve domain zorunludur. Tekrar deneyin.
pause
exit /b 1
