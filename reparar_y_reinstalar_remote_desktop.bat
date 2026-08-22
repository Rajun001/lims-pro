@echo off
title Reparación y Reinstalación Limpia de Chrome Remote Desktop
chcp 65001 > nul

:: Verificación y elevación automática a Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permisos de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ========================================================
echo   REINSTALACIÓN LIMPIEZA PROFUNDA - CHROME REMOTE DESKTOP
echo ========================================================
echo.

echo Ejecutando proceso de desinstalación limpia, purga y reinstalación del MSI...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\reinstall_clean_crd.ps1"

echo.
echo ========================================================
echo   ¡REINSTALACIÓN LIMPIA COMPLETADA CON ÉXITO!
echo.
echo   Abriendo Google Chrome...
echo   1. Si no tienes la extensión instalada, haz clic en "Añadir a Chrome".
echo   2. En la pestaña de Escritorio Remoto, haz clic en "Activar".
echo ========================================================
echo.

start chrome "https://chromewebstore.google.com/detail/chrome-remote-desktop/inmgicbfkbbpflfbdbbgcaicapuackqn" "https://remotedesktop.google.com/access"
timeout /t 3 /nobreak >nul


