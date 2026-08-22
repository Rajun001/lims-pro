@echo off
title LIMS-PRO - Auto Actualizador v2 del Sistema
chcp 65001 > nul
echo =========================================================
echo    ACTUALIZANDO LIMS-PRO A LA ULTIMA VERSION...
echo =========================================================
echo.

rem Crear directorio de logs si no existe
if not exist "logs" mkdir logs

echo [1/6] Descargando ultimas mejoras de GitHub...
git pull origin main
if %errorlevel% neq 0 (
    echo [ERROR] No se pudo sincronizar con GitHub.
    echo [%date% %time%] ERROR: git pull falló >> logs\actualizaciones.log
    if "%1" neq "--silent" pause
    exit /b 1
)
echo [OK] Codigo descargado con exito.
echo.

echo [*] Generando numero de version y sello de trazabilidad...
call node scripts/generate_version.js
echo.

echo [2/6] Verificando dependencias de Node.js...
call npm.cmd install --prefer-offline --no-audit
if %errorlevel% neq 0 (
    echo [ERROR] Falló la instalación de dependencias.
    echo [%date% %time%] ERROR: npm install falló >> logs\actualizaciones.log
    if "%1" neq "--silent" pause
    exit /b 1
)
echo [OK] Dependencias al dia.
echo.

echo [3/6] Generando copia de seguridad pre-actualización de la base de datos...
node -e "import('./api/utils/backup.js').then(async (m) => { const res = await m.createDatabaseBackup('PRE_UPDATE'); if (res.success) { console.log('[OK] Respaldo pre-actualización completado.'); process.exit(0); } else { console.error('[ERROR] Error en respaldo:', res.error); process.exit(1); } }).catch(e => { console.error('[ERROR FATAL]:', e.message); process.exit(1); })"
if %errorlevel% neq 0 (
    echo [ADVERTENCIA] El respaldo automático pre-actualización falló o reportó error.
)
echo.

echo [4/6] Sincronizando esquema de base de datos con Prisma...
cd api
call npx.cmd prisma db push
cd ..
if %errorlevel% neq 0 (
    echo [ERROR] Falló la sincronización del esquema de base de datos.
    echo [%date% %time%] ERROR: prisma db push falló >> logs\actualizaciones.log
    if "%1" neq "--silent" pause
    exit /b 1
)
echo [OK] Base de datos sincronizada.
echo.

echo [5/6] Compilando interfaz Frontend (Vite)...
call npm.cmd run build
if %errorlevel% neq 0 (
    echo [ERROR] Falló la compilación del Frontend.
    echo [%date% %time%] ERROR: npm run build falló >> logs\actualizaciones.log
    if "%1" neq "--silent" pause
    exit /b 1
)
echo [OK] Frontend compilado con exito.
echo.

echo [6/6] Reiniciando servicios PM2...
where pm2 >nul 2>&1
if %errorlevel% equ 0 (
    call pm2 reload ecosystem.config.cjs --update-env
    if %errorlevel% neq 0 (
        call pm2 start ecosystem.config.cjs
    )
    call pm2 save
    echo [OK] Servicios PM2 reiniciados.
) else (
    echo [AVISO] PM2 no instalado globalmente. Para instalar: npm install -g pm2
)
echo.

echo [%date% %time%] ACTUALIZACIÓN COMPLETADA CON ÉXITO >> logs\actualizaciones.log

echo =========================================================
echo    SISTEMA ACTUALIZADO AL 100%% CON EXITO!
echo =========================================================
echo.
echo App Cloud:  https://lims-microlabs.web.app
echo API Local:  http://localhost:3001/health
echo Log Audit:  logs\actualizaciones.log
echo.
if "%1" neq "--silent" pause
