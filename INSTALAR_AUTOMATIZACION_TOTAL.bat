@echo off
title LIMS-PRO - Instalador de Automatización y Resiliencia Total
echo ================================================================
echo   INSTALANDO SERVICIOS AUTONOMOS Y TAREAS PROGRAMADAS
echo ================================================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\lims-microlabs\scripts\install_automation_engine.ps1"

echo.
pause
