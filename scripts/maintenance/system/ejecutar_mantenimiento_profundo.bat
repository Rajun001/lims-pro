@echo off
title Mantenimiento Profundo de Windows - LIMS-PRO
chcp 65001 >nul
cd /d "C:\lims-microlabs"

echo ================================================================
echo    INICIANDO MANTENIMIENTO PROFUNDO DEL SISTEMA (LIMS-PRO)
echo ================================================================
echo.
echo Solicitando elevación de Administrador...
echo.

wscript.exe "C:\lims-microlabs\scratch\elevate_mantenimiento.vbs"

echo Proceso iniciado. Si aparece la ventana de control de cuentas (UAC), presione 'Sí'.
exit
