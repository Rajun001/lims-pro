@echo off
title Reiniciar y Corregir Chrome Remote Desktop
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
echo   REINICIANDO Y CORRIGIENDO CHROME REMOTE DESKTOP
echo ========================================================
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\fix_crd.ps1"

echo.
echo ========================================================
echo  ¡LISTO! El servicio fue verificado y reiniciado.
echo  Abre Google Chrome y presiona 'Activar' / 'Configurar'.
echo ========================================================
echo.
pause
