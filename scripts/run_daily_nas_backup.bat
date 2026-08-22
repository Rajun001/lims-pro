@echo off
:: ====================================================================
:: Tarea Programada: Respaldo Diario y Replicación al NAS (Z:)
:: ====================================================================
cd /d "C:\lims-microlabs"

:: Asegurar unidad Z:
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\lims-microlabs\scripts\watchdog_nas_mount.ps1"

:: Ejecutar respaldo
node -e "import('./api/utils/backup.js').then(async (m) => { const res = await m.createDatabaseBackup('SCHEDULED_WINDOWS_TASK'); console.log('Respaldo finalizado:', res.success ? 'OK' : res.error); process.exit(0); }).catch(e => { console.error(e.message); process.exit(1); })"
