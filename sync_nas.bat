@echo off
title LIMS-PRO - Sincronizacion NAS Synology
cd /d "C:\lims-microlabs"

echo ================================================================
echo   SINCRONIZANDO RESPALDOS HACIA NAS SYNOLOGY
echo ================================================================
echo.

node scripts\sync_nas_synology.mjs

echo.
pause
