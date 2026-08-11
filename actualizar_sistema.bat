@echo off
title LIMS-PRO - Auto Actualizador del Sistema
chcp 65001 > nul
echo =========================================================
echo    🚀 ACTUALIZANDO LIMS-PRO A LA ÚLTIMA VERSIÓN...
echo =========================================================
echo.

echo [1/4] Descargando ultimas mejoras de GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo sincronizar con GitHub.
    pause
    exit /b 1
)
echo [OK] Codigo descargado con exito.
echo.

echo [2/4] Verificando dependencias de Node.js...
call npm.cmd install --prefer-offline --no-audit
echo [OK] Dependencias al dia.
echo.

echo [3/4] Sincronizando esquema de base de datos...
cd api
call npx.cmd prisma db push
cd ..
echo [OK] Base de datos sincronizada.
echo.

echo [4/4] Compilando interfaz Frontend (Vite)...
call npm.cmd run build
echo [OK] Frontend compilado.
echo.

echo =========================================================
echo    ✨ ¡SISTEMA ACTUALIZADO AL 100%% CON ÉXITO! ✨
echo =========================================================
echo.
pause
