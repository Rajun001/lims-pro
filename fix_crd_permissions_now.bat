@echo off
title Reparacion Profunda de Permisos y Reset de Host - Chrome Remote Desktop
chcp 65001 > nul

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] Solicitando permisos de Administrador...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo   CORRIGIENDO PERMISOS DENEGADOS (ACCESS DENIED FIX)
echo ========================================================
echo.

echo [1/4] Deteniendo servicio chromoting y matando procesos remoting...
net stop chromoting >nul 2>&1
taskkill /F /IM remoting_host.exe >nul 2>&1
taskkill /F /IM remoting_native_messaging_host.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/4] Tomando propiedad total de la carpeta y archivos...
set "TARGET=C:\ProgramData\Google\Chrome Remote Desktop"
takeown /f "%TARGET%" /r /d y
icacls "%TARGET%" /reset /t /c
icacls "%TARGET%" /grant "Administrators:(OI)(CI)F" /grant "SYSTEM:(OI)(CI)F" /grant "Users:(OI)(CI)F" /grant "Everyone:(OI)(CI)F" /t /c

echo [3/4] Eliminando configuraciones viejas o denegadas...
if exist "%TARGET%\host.json" (
    attrib -r -h -s "%TARGET%\host.json"
    del /f /q "%TARGET%\host.json"
)
if exist "%TARGET%\host_unprivileged.json" (
    attrib -r -h -s "%TARGET%\host_unprivileged.json"
    del /f /q "%TARGET%\host_unprivileged.json"
)

echo [4/4] Re-aplicando permisos en la carpeta limpia e iniciando servicio...
icacls "%TARGET%" /grant "Administrators:(OI)(CI)F" /grant "SYSTEM:(OI)(CI)F" /grant "Users:(OI)(CI)F" /grant "Everyone:(OI)(CI)F" /t /c
net start chromoting

echo.
echo ========================================================
echo   ¡PERMISOS RESTABLECIDOS CON ÉXITO!
echo   Abriendo Google Chrome para la Activación...
echo ========================================================
echo.

start chrome "https://remotedesktop.google.com/access"
timeout /t 3 /nobreak >nul
