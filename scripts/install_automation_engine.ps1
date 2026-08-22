# ====================================================================
# Motor de Instalacion de Automatizacion Total LIMS-PRO
# ====================================================================
$ErrorActionPreference = "Continue"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     INSTALANDO AUTOMATIZACION Y RESILIENCIA TOTAL LIMS-PRO     " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Configurar auto-arranque silencioso en Inicio de Windows (Startup)
Write-Host "`n[1/4] Configurando Auto-Arranque en Inicio de Windows..." -ForegroundColor Green
$startupDir = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Startup)
$startupVbs = Join-Path $startupDir "LIMS_AutoStart.vbs"
$sourceVbs = "C:\lims-microlabs\scripts\start_lims_silent.vbs"

if (Test-Path $sourceVbs) {
    Copy-Item -Path $sourceVbs -Destination $startupVbs -Force
    Write-Host "  -> Creado ejecutable de inicio silencioso en: $startupVbs" -ForegroundColor Cyan
} else {
    Write-Host "  [!] Archivo origen $sourceVbs no encontrado." -ForegroundColor Yellow
}

# 2. Configurar Tarea Programada para Guardian del NAS (Z:)
Write-Host "`n[2/4] Programando Guardian del NAS (Verificacion y Auto-reconexion)..." -ForegroundColor Green
$taskNameWatchdog = "LIMS_NAS_Watchdog"
$actionWatchdog = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File C:\lims-microlabs\scripts\watchdog_nas_mount.ps1'

try {
    $argList = @('/create', '/tn', $taskNameWatchdog, '/tr', $actionWatchdog, '/sc', 'HOURLY', '/mo', '1', '/f')
    & schtasks.exe $argList
    Write-Host "  -> Tarea Programada '$taskNameWatchdog' registrada exitosamente (Cada 1 Hora)." -ForegroundColor Cyan
} catch {
    Write-Host "  [!] Error registrando tarea de watchdog." -ForegroundColor Yellow
}

# 3. Configurar Tarea Programada para Respaldo Diario al NAS (Z:)
Write-Host "`n[3/4] Programando Respaldo Diario Nocturno (23:00 hrs)..." -ForegroundColor Green
$taskNameBackup = "LIMS_Daily_Backup_NAS"
$actionBackup = 'cmd.exe /c C:\lims-microlabs\scripts\run_daily_nas_backup.bat'

try {
    $argList2 = @('/create', '/tn', $taskNameBackup, '/tr', $actionBackup, '/sc', 'DAILY', '/st', '23:00', '/f')
    & schtasks.exe $argList2
    Write-Host "  -> Tarea Programada '$taskNameBackup' registrada exitosamente (Diaria a las 23:00 hrs)." -ForegroundColor Cyan
} catch {
    Write-Host "  [!] Error registrando tarea de respaldo." -ForegroundColor Yellow
}

# 4. Configurar Autorrecuperacion del Servicio Chrome Remote Desktop
Write-Host "`n[4/4] Configurando Autorrecuperacion de Escritorio Remoto (chromoting)..." -ForegroundColor Green
try {
    & sc.exe failure chromoting reset= 86400 actions= restart/5000/restart/10000/restart/30000
    Write-Host "  -> Servicio 'chromoting' configurado para reinicio infinito ante caidas." -ForegroundColor Cyan
} catch {
    Write-Host "  [!] Configuracion de chromoting omitida." -ForegroundColor Yellow
}

# 5. Ejecutar verificacion inmediata del Guardian del NAS
Write-Host "`n[+] Ejecutando prueba inmediata del Guardian NAS..." -ForegroundColor Yellow
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File "C:\lims-microlabs\scripts\watchdog_nas_mount.ps1"

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  SISTEMA AUTONOMO Y RESILIENTE INSTALADO CON EXITO!            " -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
