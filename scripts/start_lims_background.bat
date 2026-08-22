@echo off
:: ====================================================================
:: Inicio en Segundo Plano de LIMS-PRO (API 3001 y Analizadores 9000)
:: ====================================================================
cd /d "C:\lims-microlabs"

:: 1. Verificar y montar unidad Z: (NAS)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\lims-microlabs\scripts\watchdog_nas_mount.ps1"

:: 2. Generar versión actualizada
call node scripts\generate_version.js >nul 2>&1

:: 3. Iniciar servicios mediante PM2 si está disponible o node directo
where pm2 >nul 2>&1
if %errorlevel% equ 0 (
    call pm2 start ecosystem.config.cjs
) else (
    call npx.cmd pm2 start ecosystem.config.cjs
)
