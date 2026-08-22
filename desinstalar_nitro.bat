@echo off
setlocal
cd /d "%~dp0"

:: Auto-elevar a Administrador
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo ===================================================
echo     DESINSTALANDO NITRO PRO 9 DE FORMA LIMPIA
echo ===================================================
echo Deteniendo procesos y servicios de Nitro...
taskkill /F /IM NitroPDF.exe /T >nul 2>&1
taskkill /F /IM Nitro_UpdateService.exe /T >nul 2>&1
taskkill /F /IM NitroPDFDriverService9x64.exe /T >nul 2>&1
net stop NitroUpdateService >nul 2>&1
net stop NitroDriverReadSpool9 >nul 2>&1

echo Ejecutando desinstalador de Windows (MSI)...
msiexec.exe /X{96DB185A-51FB-43D7-AA98-900D91C682DC} /qb /norestart

echo.
echo Limpiando accesos directos residuales...
del /f /q "C:\Users\Public\Desktop\Nitro Pro 9.lnk" >nul 2>&1
del /f /q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\Nitro Pro 9.lnk" >nul 2>&1

echo ===================================================
echo Nitro Pro 9 ha sido desinstalado correctamente.
echo ===================================================
timeout /t 5
