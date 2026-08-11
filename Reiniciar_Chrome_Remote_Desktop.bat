@echo off
:: Batch script con auto-elevación a Administrador
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Solicitando permisos de Administrador...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "cmd.exe", "/c ""%~s0""", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    del "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    pushd "%CD%"
    CD /D "%~dp0"

echo ========================================================
echo   REINICIANDO SERVICIO DE GOOGLE CHROME REMOTE DESKTOP
echo ========================================================
echo.
net stop chromoting
timeout /t 2 /nobreak >nul
net start chromoting
echo.
echo ========================================================
echo  LISTO! El servicio fue reiniciado correctamente.
echo  Ya puedes recargar la pagina (F5) en Google Chrome.
echo ========================================================
echo.
pause
