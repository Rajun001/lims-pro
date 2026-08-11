@echo off
title Servidor LIMS-PRO - Control de Ejecución
chcp 65001 > nul
echo ===================================================
echo             INICIANDO SISTEMA LIMS-PRO             
echo ===================================================
echo.

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado en este sistema.
    echo Por favor, descarga e instala Node.js desde https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Verificar si node_modules existe en el directorio raíz
if not exist node_modules (
    echo [INFO] No se detectó la carpeta node_modules. Instalando dependencias...
    call npm.cmd install
    if %errorlevel% neq 0 (
        echo [ERROR] Hubo un problema al instalar las dependencias.
        pause
        exit /b 1
    )
)

echo [INFO] Iniciando los servidores de desarrollo (Frontend, API y Analizador)...
echo [INFO] Por favor, abre en tu navegador: http://localhost:5173
echo.
call npm.cmd run dev
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Hubo un problema al iniciar el sistema.
    echo.
)
pause
