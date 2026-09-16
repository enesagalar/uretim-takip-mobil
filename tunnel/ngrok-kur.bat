@echo off
chcp 65001 >nul
title Ekol Glass - ngrok Kurulumu
cd /d "%~dp0.."
echo.
echo ============================================
echo   EKOL GLASS - NGROK KALICI TUNEL KURULUMU
echo ============================================
echo.
echo Bu kurulum BIR KEZ yapilir. Sonrasinda tamamen otomatiktir:
echo Tünel bu makinede (üretim sunucusunda) çalişir — diger PC'ler KAPALI olsa bile.
echo.
echo  1. https://dashboard.ngrok.com/signup  adresinden ucretsiz hesap acin (e-posta yeterli)
echo  2. https://dashboard.ngrok.com/get-started/your-authtoken adresinden
echo     authtoken'inizi kopyalayin
echo  3. ngrok panelinde "Domains" bolumunden ucretsiz statik domain alin
echo     (orn: ekol-glass.ngrok-free.app)
echo.
set /p TOKEN="Authtoken'inizi yapistirin: "
set /p DOMAIN="Statik domain'inizi yazin (orn: ekol-glass.ngrok-free.app): "
echo.
if "%TOKEN%"=="" goto :hata
if "%DOMAIN%"=="" goto :hata
if not exist tunnel mkdir tunnel

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

echo Windows acilisinda otomatik baslama ayarlaniyor...
powershell -NoProfile -Command "$s = [Environment]::GetFolderPath('Startup'); Set-Content -Path ($s + '\Ekol Tünel Bekçisi.bat') -Value ('@echo off' + [char]13 + [char]10 + 'cd /d \"' + (Get-Location).Path + '\"' + [char]13 + [char]10 + 'node tunnel\watchdog.js') "

echo.
echo Yapilandirma tamam. Bekci baslatiliyor...
taskkill /F /IM cloudflared.exe >nul 2>&1
taskkill /F /IM ngrok.exe >nul 2>&1
powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \"name='node.exe'\" | Where-Object { $_.CommandLine -like '*watchdog*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }" >nul 2>&1
timeout /t 2 >nul
start "" tunnel\baslat-tunel.bat
echo.
echo ============================================================
echo  KURULUM TAMAM!
echo  Tünel adresiniz: https://%DOMAIN%
echo  Telefondan uygulamada SUNUCU ADRESI olarak bunu girin ya da
echo  su baglantiyi tek kez acin:
echo  https://enesagalar.github.io/uretim-takip-mobil/?server=https://%DOMAIN%
echo ============================================================
echo.
echo (Sunucu makinesi acik kaldigi surece tünel 7/24 çalişir.
echo  Durum: http://127.0.0.1:4040)
pause
exit /b 0

:hata
echo.
echo HATA: Authtoken ve domain zorunludur. Tekrar deneyin.
pause
exit /b 1
