@echo off
chcp 65001 >nul
title Reparación del Sistema LIMS - Auto-Recuperable
color 0b

:: 1. Verificación y elevación automática de permisos de Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permisos de Administrador...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\lims_uac.vbs"
    echo UAC.ShellExecute "cmd.exe", "/k """"%~f0""""", "", "runas", 1 >> "%temp%\lims_uac.vbs"
    "%temp%\lims_uac.vbs"
    exit /b
)

:: Limpiar script temporal si existe
if exist "%temp%\lims_uac.vbs" del "%temp%\lims_uac.vbs"

cd /d "%~dp0"

echo ================================================================
echo    HERRAMIENTA DE REPARACIÓN Y ESCANEO DEL SISTEMA LIMS
echo ================================================================
echo.

set "STATE_FILE=c:\lims-microlabs\repair_state.txt"
set "LOG_FILE=c:\lims-microlabs\repair_system.log"

echo [%date% %time%] Iniciando sesion de reparacion >> "%LOG_FILE%"

:: Registrar tarea programada para auto-recuperacion en caso de corte de luz
schtasks /create /tn "LIMS_Repair_AutoResume" /tr "\"%~f0\"" /sc onlogon /rl highest /f >nul 2>&1

:: Inicializar estado si no existe
if not exist "%STATE_FILE%" (
    echo DISM=PENDING > "%STATE_FILE%"
    echo SFC=PENDING >> "%STATE_FILE%"
    echo MALWARE=PENDING >> "%STATE_FILE%"
)

:: ------------------------------------------------------------------
:: PASO 1: DISM
:: ------------------------------------------------------------------
findstr /i "DISM=COMPLETED" "%STATE_FILE%" >nul
if %errorlevel% neq 0 (
    echo ================================================================
    echo [1/3] PASO 1: Reparando Imagen de Windows con DISM...
    echo Esto puede demorar varios minutos, por favor espere...
    echo ================================================================
    echo [%date% %time%] Ejecutando DISM... >> "%LOG_FILE%"
    DISM.exe /Online /Cleanup-Image /RestoreHealth
    echo [%date% %time%] DISM finalizado con codigo %errorlevel% >> "%LOG_FILE%"
    
    powershell -Command "(Get-Content '%STATE_FILE%') -replace 'DISM=PENDING', 'DISM=COMPLETED' | Set-Content '%STATE_FILE%'"
) else (
    echo [1/3] PASO 1 (DISM): Ya completado previamente. Saltando...
)

:: ------------------------------------------------------------------
:: PASO 2: SFC
:: ------------------------------------------------------------------
findstr /i "SFC=COMPLETED" "%STATE_FILE%" >nul
if %errorlevel% neq 0 (
    echo.
    echo ================================================================
    echo [2/3] PASO 2: Comprobando y Reparando Archivos de Sistema (SFC)...
    echo ================================================================
    echo [%date% %time%] Ejecutando SFC... >> "%LOG_FILE%"
    sfc /scannow
    echo [%date% %time%] SFC finalizado con codigo %errorlevel% >> "%LOG_FILE%"
    
    powershell -Command "(Get-Content '%STATE_FILE%') -replace 'SFC=PENDING', 'SFC=COMPLETED' | Set-Content '%STATE_FILE%'"
) else (
    echo [2/3] PASO 2 (SFC): Ya completado previamente. Saltando...
)

:: ------------------------------------------------------------------
:: PASO 3: ANTIMALWARE
:: ------------------------------------------------------------------
findstr /i "MALWARE=COMPLETED" "%STATE_FILE%" >nul
if %errorlevel% neq 0 (
    echo.
    echo ================================================================
    echo [3/3] PASO 3: Escaneo Antivirus / Antimalware de Seguridad...
    echo ================================================================
    echo [%date% %time%] Ejecutando Escaneo Antimalware... >> "%LOG_FILE%"
    
    if exist "C:\Program Files\Windows Defender\MpCmdRun.exe" (
        "C:\Program Files\Windows Defender\MpCmdRun.exe" -Scan -ScanType 1
    ) else (
        mrt.exe /Q
    )
    echo [%date% %time%] Escaneo Antimalware finalizado >> "%LOG_FILE%"
    
    powershell -Command "(Get-Content '%STATE_FILE%') -replace 'MALWARE=PENDING', 'MALWARE=COMPLETED' | Set-Content '%STATE_FILE%'"
) else (
    echo [3/3] PASO 3 (Antimalware): Ya completado previamente. Saltando...
)

:: Limpiar tarea de arranque porque ya culminó con éxito
schtasks /delete /tn "LIMS_Repair_AutoResume" /f >nul 2>&1

echo.
echo ================================================================
echo    PROCESO DE REPARACIÓN Y ESCANEO COMPLETADO CON ÉXITO
echo ================================================================
echo [%date% %time%] TODO COMPLETADO AL 100%% >> "%LOG_FILE%"
echo.
echo Presione cualquier tecla para salir...
pause >nul
