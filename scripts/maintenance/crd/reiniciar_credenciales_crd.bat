@echo off
title Reiniciar Credenciales de Chrome Remote Desktop
chcp 65001 > nul

:: Elevación a Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permisos de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ========================================================
echo   RESETEO Y PREPARACIÓN DE CHROME REMOTE DESKTOP
echo ========================================================
echo.

echo [1/3] Deteniendo servicio chromoting y liberando candados de archivos...
net stop chromoting >nul 2>&1
taskkill /F /IM remoting_host.exe >nul 2>&1
taskkill /F /IM remoting_native_messaging_host.exe >nul 2>&1

echo [2/3] Limpiando credenciales obsoletas, caché de navegador y aplicando permisos...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\clean_chrome_crd_cache.ps1"
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\clean_host_for_activation.ps1"
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\fix_crd.ps1"


echo [3/3] Abriendo Google Chrome para la Activación Limpia...
echo.
echo ========================================================
echo   ¡SISTEMA LISTO PARA ACTIVACIÓN!
echo   1. Si no tienes la Extensión de Chrome Remote Desktop,
echo      haz clic en "Añadir a Chrome" en la Web Store.
echo   2. Ve a la pestaña de Escritorio Remoto y haz clic en "Activar".
echo ========================================================
echo.

start chrome "https://chromewebstore.google.com/detail/chrome-remote-desktop/inmgicbfkbbpflfbdbbgcaicapuackqn" "https://remotedesktop.google.com/access"
timeout /t 3 /nobreak >nul



