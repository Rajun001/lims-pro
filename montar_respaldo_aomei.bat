@echo off
title Abrir AOMEI Backupper para Explorar Respaldo
chcp 65001 > nul
echo ===================================================
echo     ABRIENDO AOMEI BACKUPPER
echo ===================================================
echo.
echo Instrucciones:
echo 1. En AOMEI, haz clic en "Herramientas" (Tools).
echo 2. Selecciona "Explorar imagen" (Explore Image).
echo 3. Busca el archivo: E:\Respaldo sistema(1)\Respaldo sistema(1)1.adi
echo 4. Selecciona la particion del sistema C: y asignale una letra (ej. F:).
echo 5. Haz clic en "Siguiente" para montarlo.
echo.
echo Iniciando AOMEI Backupper...
start "" "C:\Program Files (x86)\AOMEI\AOMEI Backupper\ABLauncher.exe"
timeout /t 5 > nul
exit
