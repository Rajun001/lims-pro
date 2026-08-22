@echo off
title Servidor de Respaldo LIMS Microlabs - Acceso Remoto Alternativo
chcp 65001 > nul

echo ========================================================
echo   ACCESO REMOTO DE RESPALDO - LIMS MICROLABS
echo ========================================================
echo.
echo Este asistente abre un túnel de comunicación directo y seguro
echo para garantizar que puedas conectarte a tu sistema desde cualquier
echo lugar aun cuando Chrome Remote Desktop o Google tengan fallas.
echo.

cd /d "%~dp0"

if exist "%~dp0cloudflared.exe" (
    echo [INFO] Iniciando Túnel Seguro de Cloudflare en puerto 3001...
    echo.
    "%~dp0cloudflared.exe" tunnel --url http://localhost:3001
) else (
    echo [INFO] Iniciando Túnel de respaldo SSH...
    echo.
    ssh -o StrictHostKeyChecking=no -R 80:localhost:3001 nokey@localhost.run
)

pause
