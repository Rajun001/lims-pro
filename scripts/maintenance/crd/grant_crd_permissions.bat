@echo off
:: Permisos de Lectura y Ejecución para Chrome Remote Desktop Host
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)
set "TARGET=C:\ProgramData\Google\Chrome Remote Desktop"
takeown /f "%TARGET%" /r /d y >nul 2>&1
icacls "%TARGET%" /grant "Administrators:(OI)(CI)F" /grant "SYSTEM:(OI)(CI)F" /grant "Users:(OI)(CI)F" /grant "Everyone:(OI)(CI)F" /t /c >nul 2>&1
net stop chromoting >nul 2>&1
net start chromoting >nul 2>&1
start chrome "https://remotedesktop.google.com/access"
