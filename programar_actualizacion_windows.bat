@echo off
title LIMS-PRO - Programar Actualización Automática en Windows
chcp 65001 > nul
echo =========================================================
echo    PROGRAMADOR DE ACTUALIZACIONES AUTOMATICAS (LIMS-PRO)
echo =========================================================
echo.

set SCRIPT_PATH=%~dp0actualizar_sistema.bat

echo Se creará una Tarea Programada en Windows para ejecutar:
echo   %SCRIPT_PATH% --silent
echo   Todos los días a las 03:00 AM.
echo.

schtasks /create /tn "LIMS_Pro_Auto_Update" /tr "\"%SCRIPT_PATH%\" --silent" /sc daily /st 03:00 /f

if %errorlevel% equ 0 (
    echo.
    echo [OK] Tarea programada creada exitosamente con el nombre 'LIMS_Pro_Auto_Update'.
    echo El sistema LIMS se actualizará automáticamente todas las madrugadas a las 3:00 AM.
) else (
    echo.
    echo [ERROR] No se pudo crear la tarea programada. Asegúrate de ejecutar este script como Administrador.
)

echo.
pause
