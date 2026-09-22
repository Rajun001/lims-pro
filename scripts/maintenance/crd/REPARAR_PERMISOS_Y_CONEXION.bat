@echo off
title Reparar Permisos y Conexion de Chrome Remote Desktop
chcp 65001 > nul

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permisos de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d "%~dp0"

echo ========================================================
echo   REPARANDO PERMISOS Y SERVICIO DE CHROME REMOTE DESKTOP
echo ========================================================
echo.

echo [1/5] Deteniendo servicio chromoting...
net stop chromoting >nul 2>&1
taskkill /F /IM remoting_host.exe >nul 2>&1
taskkill /F /IM remoting_native_messaging_host.exe >nul 2>&1

echo [2/5] Tomando propiedad y desbloqueando ProgramData (Access Denied Fix)...
takeown /f "C:\ProgramData\Google\Chrome Remote Desktop" /r /d y >nul 2>&1
icacls "C:\ProgramData\Google\Chrome Remote Desktop" /reset /t /c >nul 2>&1
icacls "C:\ProgramData\Google\Chrome Remote Desktop" /grant "Administrators:(OI)(CI)F" /grant "SYSTEM:(OI)(CI)F" /grant "Users:(OI)(CI)F" /grant "Everyone:(OI)(CI)F" /t /c >nul 2>&1

echo [3/5] Desbloqueando archivos internos y host.json...
powershell -Command "Get-ChildItem -Path 'C:\ProgramData\Google\Chrome Remote Desktop' -Recurse -ErrorAction SilentlyContinue | ForEach-Object { attrib -r -h -s $_.FullName; icacls $_.FullName /grant 'Administrators:F' /grant 'SYSTEM:F' /grant 'Users:F' /grant 'Everyone:F' /c; Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue }" >nul 2>&1

echo [4/5] Ejecutando reparación de registros y manifiestos de Chrome Remote Desktop...
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\fix_crd.ps1"

echo [5/5] Iniciando servicio chromoting...
net start chromoting

echo.
echo ========================================================
echo   ¡REPARACIÓN COMPLETADA EXITOSAMENTE!
echo   Abre Google Chrome y verifica tu conexión en:
echo   https://remotedesktop.google.com/access
echo ========================================================
echo.
start chrome "https://remotedesktop.google.com/access"
timeout /t 5 >nul
