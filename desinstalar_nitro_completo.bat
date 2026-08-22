@echo off
echo ========================================================
echo   DESINSTALACION COMPLETA Y LIMPIEZA DE NITRO PRO 9
echo ========================================================
echo Deteniendo procesos y servicios...
taskkill /F /IM NitroPDF.exe /T >nul 2>&1
taskkill /F /IM Nitro_UpdateService.exe /T >nul 2>&1
taskkill /F /IM NitroPDFDriverService9x64.exe /T >nul 2>&1

sc.exe stop NitroUpdateService >nul 2>&1
sc.exe stop NitroDriverReadSpool9 >nul 2>&1
sc.exe delete NitroUpdateService >nul 2>&1
sc.exe delete NitroDriverReadSpool9 >nul 2>&1

echo Ejecutando desinstalacion de Windows Installer...
msiexec.exe /x "C:\Windows\Installer\81161.msi" /qb /norestart /lv* "c:\lims-microlabs\scratch\nitro_uninstall.log"

echo Limpiando accesos directos y carpetas...
del /f /q "C:\Users\Public\Desktop\Nitro Pro 9.lnk" >nul 2>&1
del /f /q "%ProgramData%\Microsoft\Windows\Start Menu\Programs\Nitro Pro 9.lnk" >nul 2>&1

echo ========================================================
echo Proceso finalizado. Codigo: %errorlevel%
echo ========================================================
timeout /t 3
