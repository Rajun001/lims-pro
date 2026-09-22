@echo off
title LIMS-PRO — Panel de Control y Administración General
chcp 65001 > nul
color 0b

:MENU
cls
echo ================================================================================
echo             🔬  LIMS-PRO — PANEL DE CONTROL Y ADMINISTRACIÓN  🔬
echo               Laboratorio Microlabs Químicos S.A. | Costa Rica
echo ================================================================================
echo.
echo   [1]  🚀 Iniciar Servidores LIMS (Modo Desarrollo - Frontend + API + Analizador)
echo   [2]  🔄 Actualizar Sistema a Última Versión (Git + Backup + DB + PM2)
echo   [3]  📦 Generar Respaldo Inmediato de Base de Datos SQLite (VACUUM INTO)
echo   [4]  💾 Sincronizar Respaldos con NAS Synology (Unidad Z:)
echo   [5]  🌐 Acceso Remoto Seguro (Probar desde Casa / Túnel Cloudflare)
echo   [6]  🛡️  Diagnóstico y Reparación de Windows (DISM / SFC / Antivirus)
echo   [7]  🔧 Mantenimiento Avanzado (Escritorio Remoto, Red y Servicios)
echo   [8]  📘 Abrir Manual de Usuario Oficial del Laboratorio
echo   [9]  📁 Explorar Carpeta de Documentación (docs\)
echo   [0]  ❌ Salir
echo.
echo ================================================================================
set /p OPCION="Selecciona una opción [0-9] y presiona Enter: "

if "%OPCION%"=="1" goto INICIAR
if "%OPCION%"=="2" goto ACTUALIZAR
if "%OPCION%"=="3" goto RESPALDO
if "%OPCION%"=="4" goto NAS
if "%OPCION%"=="5" goto REMOTO
if "%OPCION%"=="6" goto REPARAR
if "%OPCION%"=="7" goto SUBMENU_MANTENIMIENTO
if "%OPCION%"=="8" goto MANUAL
if "%OPCION%"=="9" goto EXPLORAR_DOCS
if "%OPCION%"=="0" exit /b 0

echo.
echo [!] Opción no válida. Intenta de nuevo.
timeout /t 2 > nul
goto MENU

:INICIAR
cls
echo [INFO] Ejecutando: iniciar.bat...
echo.
call "%~dp0iniciar.bat"
goto MENU

:ACTUALIZAR
cls
echo [INFO] Ejecutando: actualizar_sistema.bat...
echo.
call "%~dp0actualizar_sistema.bat"
goto MENU

:RESPALDO
cls
echo [INFO] Ejecutando: respaldar_bd.bat...
echo.
call "%~dp0respaldar_bd.bat"
goto MENU

:NAS
cls
echo [INFO] Sincronizando respaldos con NAS Synology...
echo.
call "%~dp0sync_nas.bat"
echo.
pause
goto MENU

:REMOTO
cls
echo [INFO] Iniciando Túnel de Acceso Remoto Seguro...
echo.
call "%~dp0probar_desde_casa.bat"
goto MENU

:REPARAR
cls
echo [INFO] Iniciando Herramienta de Reparación del Sistema...
echo.
call "%~dp0reparar_sistema.bat"
goto MENU

:MANUAL
cls
echo [INFO] Abriendo Manual de Usuario Oficial...
if exist "%~dp0docs\MANUAL_DE_USUARIO_LIMS.md" (
    start "" "%~dp0docs\MANUAL_DE_USUARIO_LIMS.md"
) else (
    echo [ERROR] No se encontró el manual en docs\MANUAL_DE_USUARIO_LIMS.md
    pause
)
goto MENU

:EXPLORAR_DOCS
cls
echo [INFO] Abriendo carpeta de documentación...
start explorer "%~dp0docs"
goto MENU

:SUBMENU_MANTENIMIENTO
cls
echo ================================================================================
echo             🔧  HERRAMIENTAS DE MANTENIMIENTO AVANZADO Y REMOTO  🔧
echo ================================================================================
echo.
echo   [1]  Activar y Reparar Conexión de Chrome Remote Desktop
echo   [2]  Reiniciar Servicio de Chrome Remote Desktop
echo   [3]  Reparar Permisos de Registro y Orígenes de CRD
echo   [4]  Instalar Guardián Automático Watchdog de CRD
echo   [5]  Montar Unidad de Respaldo NAS (Z:)
echo   [6]  Mantenimiento Profundo y Desinstalador de Nitro
echo   [7]  Volver al Menú Principal
echo.
echo ================================================================================
set /p SUBOPCION="Selecciona una opción [1-7]: "

if "%SUBOPCION%"=="1" (
    if exist "%~dp0scripts\maintenance\crd\REPARAR_REMOTO_LIMS.bat" (
        call "%~dp0scripts\maintenance\crd\REPARAR_REMOTO_LIMS.bat"
    )
    goto SUBMENU_MANTENIMIENTO
)
if "%SUBOPCION%"=="2" (
    if exist "%~dp0scripts\maintenance\crd\Reiniciar_Chrome_Remote_Desktop.bat" (
        call "%~dp0scripts\maintenance\crd\Reiniciar_Chrome_Remote_Desktop.bat"
    )
    goto SUBMENU_MANTENIMIENTO
)
if "%SUBOPCION%"=="3" (
    if exist "%~dp0scripts\maintenance\crd\fix_crd_permissions_now.bat" (
        call "%~dp0scripts\maintenance\crd\fix_crd_permissions_now.bat"
    )
    goto SUBMENU_MANTENIMIENTO
)
if "%SUBOPCION%"=="4" (
    if exist "%~dp0scripts\maintenance\crd\instalar_watchdog_crd.bat" (
        call "%~dp0scripts\maintenance\crd\instalar_watchdog_crd.bat"
    )
    goto SUBMENU_MANTENIMIENTO
)
if "%SUBOPCION%"=="5" (
    if exist "%~dp0scripts\maintenance\system\montar_respaldo_aomei.bat" (
        call "%~dp0scripts\maintenance\system\montar_respaldo_aomei.bat"
    )
    goto SUBMENU_MANTENIMIENTO
)
if "%SUBOPCION%"=="6" (
    if exist "%~dp0scripts\maintenance\system\ejecutar_mantenimiento_profundo.bat" (
        call "%~dp0scripts\maintenance\system\ejecutar_mantenimiento_profundo.bat"
    )
    goto SUBMENU_MANTENIMIENTO
)
if "%SUBOPCION%"=="7" goto MENU

goto SUBMENU_MANTENIMIENTO
