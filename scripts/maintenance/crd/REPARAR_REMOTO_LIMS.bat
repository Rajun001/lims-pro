@echo off
title REPARACIÓN COMPLETA DE ESCRITORIO REMOTO - LIMS MICROLABS
chcp 65001 > nul
color 0f

:: 1. Verificar y solicitar privilegios de Administrador de forma robusta
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permisos de Administrador...
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\crd_uac.vbs"
    echo UAC.ShellExecute "cmd.exe", "/c ""%~f0""", "", "runas", 1 >> "%temp%\crd_uac.vbs"
    "%temp%\crd_uac.vbs"
    exit /b
)
if exist "%temp%\crd_uac.vbs" del "%temp%\crd_uac.vbs"

cd /d "%~dp0"

echo ====================================================================
echo      DIAGNÓSTICO Y REPARACIÓN PROFUNDA DE CHROME REMOTE DESKTOP
echo ====================================================================
echo.

:: 2. Detener servicios y matar procesos
echo [1/6] Deteniendo el servicio chromoting y procesos remoting...
net stop chromoting /y >nul 2>&1
taskkill /F /IM remoting_host.exe >nul 2>&1
taskkill /F /IM remoting_desktop.exe >nul 2>&1
taskkill /F /IM remoting_native_messaging_host.exe >nul 2>&1
timeout /t 2 /nobreak >nul

:: 3. Tomar propiedad y reparar permisos de la carpeta y archivos
echo [2/6] Corrigiendo permisos NTFS bloqueados en ProgramData...
set "TARGET_DIR=C:\ProgramData\Google\Chrome Remote Desktop"

if exist "%TARGET_DIR%" (
    takeown /f "%TARGET_DIR%" /r /d y >nul 2>&1
    icacls "%TARGET_DIR%" /reset /t /c >nul 2>&1
    icacls "%TARGET_DIR%" /grant Administrators:(OI)(CI)F /grant SYSTEM:(OI)(CI)F /grant Users:(OI)(CI)F /grant Everyone:(OI)(CI)F /t /c >nul 2>&1
    
    :: Asegurar permisos individuales en los archivos internos
    powershell -Command "Get-ChildItem -Path '%TARGET_DIR%' -Recurse -ErrorAction SilentlyContinue | ForEach-Object { attrib -r -h -s $_.FullName; icacls $_.FullName /grant 'Administrators:F' /grant 'SYSTEM:F' /grant 'Users:F' /grant 'Everyone:F' /c; Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue }" >nul 2>&1
)

:: 4. Eliminar archivos de configuración corruptos / bloqueados
echo [3/6] Eliminando archivos de configuración corruptos para forzar reinicio limpio...
if exist "%TARGET_DIR%\host.json" (
    del /f /q "%TARGET_DIR%\host.json" >nul 2>&1
)
if exist "%TARGET_DIR%\host_unprivileged.json" (
    del /f /q "%TARGET_DIR%\host_unprivileged.json" >nul 2>&1
)

:: 5. Ejecutar script de reparación de registros y allowed_origins
echo [4/6] Reparando claves de Registro (HKLM/HKCU) y extensiones permitidas...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\fix_crd.ps1"

:: 6. Iniciar el servicio chromoting
echo [5/6] Iniciando el servicio chromoting...
net start chromoting

:: 7. Recrear tarea del watchdog/centinela correctamente como SYSTEM
echo [6/6] Reinstalando Centinela Watchdog como SYSTEM...
schtasks /delete /tn "CRD_Watchdog_Service" /f >nul 2>&1
powershell -Command "$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File ''%~dp0scripts\crd_watchdog.ps1'''; $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15); $principal = New-ScheduledTaskPrincipal -UserId 'NT AUTHORITY\SYSTEM' -RunLevel Highest; $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances Parallel; Register-ScheduledTask -TaskName 'CRD_Watchdog_Service' -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force" >nul 2>&1

echo.
echo ====================================================================
echo   ¡PROCESO DE REPARACIÓN DE ESCRITORIO REMOTO COMPLETADO!
echo.
echo   1. Abre Google Chrome.
echo   2. Ve a: https://remotedesktop.google.com/access
echo   3. Si ves tu PC anterior en la lista, elíminala (icono de basura).
echo   4. Haz clic en el botón azul "Activar" para configurar de nuevo.
echo ====================================================================
echo.
start chrome "https://remotedesktop.google.com/access"
start