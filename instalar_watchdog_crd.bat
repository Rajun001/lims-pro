@echo off
title Instalación de Centinela Watchdog y Reparación de Chrome Remote Desktop
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
echo   INSTALACIÓN DE CENTINELA Y REPARACIÓN DEFINITIVA
echo ========================================================
echo.

echo [1/4] Ejecutando reparación total de licencias y registros...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\fix_crd.ps1"

echo [2/4] Registrando Tarea Programada Centinela (CRD_Watchdog_Service)...
powershell -Command "$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File `%~dp0scripts\crd_watchdog.ps1`'; $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15); $principal = New-ScheduledTaskPrincipal -UserId 'NT AUTHORITY\SYSTEM' -RunLevel Highest; $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances Parallel; Register-ScheduledTask -TaskName 'CRD_Watchdog_Service' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force"

echo [3/4] Ejecutando primera verificación del Centinela...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\crd_watchdog.ps1"

echo [4/4] Verificando servicio chromoting...
net start chromoting >nul 2>&1

echo.
echo ========================================================
echo   ¡INSTALACIÓN DEL CENTINELA COMPLETADA CON ÉXITO!
echo   El sistema monitoreará Chrome Remote Desktop cada 15 min.
echo.
echo   Abriendo Google Chrome...
echo ========================================================
echo.

start chrome "https://remotedesktop.google.com/access"
timeout /t 3 /nobreak >nul
