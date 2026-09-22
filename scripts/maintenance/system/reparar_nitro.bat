@echo off
setlocal
echo Iniciar reparacion > "c:\lims-microlabs\scratch\repair_exec.log"
msiexec.exe /fa "C:\Windows\Installer\81161.msi" /qn /norestart /lv* "c:\lims-microlabs\scratch\nitro_msi.log"
echo Codigo de salida: %errorlevel% >> "c:\lims-microlabs\scratch\repair_exec.log"
