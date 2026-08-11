@echo off
title LIMS-PRO - Auto Actualizador v2 del Sistema
chcp 65001 > nul
echo =========================================================
echo    ACTUALIZANDO LIMS-PRO A LA ULTIMA VERSION...
echo =========================================================
echo.

rem Crear directorio de logs si no existe
if not exist "logs" mkdir logs

echo [1/5] Descargando ultimas mejoras de GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo sincronizar con GitHub.
    pause
    exit /b 1
)
echo [OK] Codigo descargado con exito.
echo.

echo [2/5] Verificando dependencias de Node.js...
call npm.cmd install --prefer-offline --no-audit
echo [OK] Dependencias al dia.
echo.

echo [3/5] Sincronizando esquema de base de datos...
cd api
call npx.cmd prisma db push
cd ..
echo [OK] Base de datos sincronizada.
echo.

echo [4/5] Compilando interfaz Frontend (Vite)...
call npm.cmd run build
echo [OK] Frontend compilado.
echo.

echo [5/5] Reiniciando servicios PM2...
where pm2 >nul 2>&1
if %errorlevel% equ 0 (
    call pm2 reload ecosystem.config.cjs --update-env
    if %errorlevel% neq 0 (
        call pm2 start ecosystem.config.cjs
    )
    call pm2 save
    echo [OK] Servicios PM2 reiniciados.
) else (
    echo [AVISO] PM2 no instalado. Para instalar: npm install -g pm2
)
echo.

echo =========================================================
echo    SISTEMA ACTUALIZADO AL 100%% CON EXITO!
echo =========================================================
echo.
echo App Cloud:  https://lims-microlabs.web.app
echo API Local:  http://localhost:3001/health
echo.
pause
