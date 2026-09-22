@echo off
:: ========================================================
:: ACTIVAR CHROME REMOTE DESKTOP AUTOMATICO
:: ========================================================
echo ========================================================
echo   ACTIVANDO SERVICIO DE CHROME REMOTE DESKTOP
echo ========================================================
echo.

:: Verificar permisos de administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] Se necesitan permisos de Administrador.
    echo.
    echo Por favor:
    echo 1. Cierra esta ventana.
    echo 2. Haz CLIC DERECHO sobre este archivo: ACTIVAR_ESCRITORIO_REMOTO.bat
    echo 3. Selecciona "Ejecutar como administrador".
    echo.
    pause
    exit /b
)

echo [1/3] Configurando inicio automatico...
sc.exe config chromoting start= auto

echo [2/3] Configurando autorrecuperacion ante caidas...
sc.exe failure chromoting reset= 86400 actions= restart/5000/restart/10000/restart/30000

echo [3/3] Iniciando servicio chromoting...
net start chromoting

echo.
echo ========================================================
echo   ESTADO FINAL DEL SERVICIO:
echo ========================================================
sc.exe query chromoting

echo.
echo [OK] Proceso terminado con exito. El escritorio remoto ya esta activo.
echo.
pause
