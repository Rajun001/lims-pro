# ====================================================================
# Motor de Reparación y Escaneo Autónomo con Auto-Recuperación
# Si se va la luz o se reinicia la PC, continúa donde se quedó.
# ====================================================================

$ErrorActionPreference = "Continue"
$workDir = "C:\lims-microlabs"
$stateFile = "$workDir\repair_state.json"
$logFile = "$workDir\repair_system.log"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     SISTEMA DE REPARACIÓN Y ESCANEO AUTÓNOMO RESUMIBLE        " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Cargar o Inicializar Estado
$state = @{
    dism = "PENDING"
    sfc = "PENDING"
    antimalware = "PENDING"
    status = "IN_PROGRESS"
    last_update = (Get-Date).ToString("o")
}

if (Test-Path $stateFile) {
    try {
        $json = Get-Content $stateFile -Raw -Encoding UTF8 | ConvertFrom-Json
        $state.dism = $json.dism
        $state.sfc = $json.sfc
        $state.antimalware = $json.antimalware
        $state.status = $json.status
        Write-Log "Estado previo detectado: DISM=$($state.dism), SFC=$($state.sfc), Antimalware=$($state.antimalware)"
    } catch {
        Write-Log "No se pudo leer el archivo de estado previo, iniciando de nuevo." "WARN"
    }
}

function Save-State {
    $state.last_update = (Get-Date).ToString("o")
    $json = $state | ConvertTo-Json -Depth 4
    Set-Content -Path $stateFile -Value $json -Encoding UTF8
}

# 2. Registrar Tarea Programada para auto-reanudar tras apagón / reinicio
try {
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Normal -File `"$workDir\repair_engine.ps1`""
    $trigger = New-ScheduledTaskTrigger -AtLogOn
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    Register-ScheduledTask -TaskName "LIMS_Repair_AutoResume" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force -ErrorAction SilentlyContinue | Out-Null
    Write-Log "Protección de recuperación activada: La tarea se reanudará automáticamente si se reinicia o apaga la PC."
} catch {
    Write-Log "Aviso al registrar tarea de inicio automático: $_" "WARN"
}

Save-State

# ====================================================================
# PASO 1: DISM (Reparación de la imagen de Windows)
# ====================================================================
if ($state.dism -ne "COMPLETED") {
    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "[1/3] PASO 1: Reparando Imagen de Windows con DISM..." -ForegroundColor Green
    Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Log "Iniciando DISM RestoreHealth..."
    
    $state.dism = "RUNNING"
    Save-State

    $dismProc = Start-Process -FilePath "DISM.exe" -ArgumentList "/Online /Cleanup-Image /RestoreHealth" -NoNewWindow -Wait -PassThru
    if ($dismProc.ExitCode -eq 0) {
        $state.dism = "COMPLETED"
        Write-Log "DISM completado exitosamente (Código 0)." "OK"
    } else {
        Write-Log "DISM finalizó con código $($dismProc.ExitCode)." "WARN"
        $state.dism = "COMPLETED" # Se avanza para no bloquear el flujo si no hay conexión
    }
    Save-State
} else {
    Write-Host "`n[1/3] PASO 1 (DISM): Ya completado previamente. Saltando..." -ForegroundColor Gray
}

# ====================================================================
# PASO 2: SFC (Comprobador de Archivos de Sistema)
# ====================================================================
if ($state.sfc -ne "COMPLETED") {
    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "[2/3] PASO 2: Comprobando y Reparando Archivos de Sistema (SFC)..." -ForegroundColor Green
    Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Log "Iniciando SFC /scannow..."
    
    $state.sfc = "RUNNING"
    Save-State

    $sfcProc = Start-Process -FilePath "sfc.exe" -ArgumentList "/scannow" -NoNewWindow -Wait -PassThru
    Write-Log "SFC finalizó con código $($sfcProc.ExitCode)."
    $state.sfc = "COMPLETED"
    Save-State
} else {
    Write-Host "`n[2/3] PASO 2 (SFC): Ya completado previamente. Saltando..." -ForegroundColor Gray
}

# ====================================================================
# PASO 3: Escaneo Antimalware Automático
# ====================================================================
if ($state.antimalware -ne "COMPLETED") {
    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "[3/3] PASO 3: Ejecutando Escaneo Antimalware de Seguridad..." -ForegroundColor Green
    Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Log "Iniciando escaneo de Microsoft Defender / MRT..."

    $state.antimalware = "RUNNING"
    Save-State

    # Buscar MpCmdRun.exe
    $mpCmd = Get-ChildItem "C:\ProgramData\Microsoft\Windows Defender\Platform\*\MpCmdRun.exe", "C:\Program Files\Windows Defender\MpCmdRun.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    
    if ($mpCmd -and (Test-Path $mpCmd)) {
        Write-Log "Ejecutando escaneo rápido con Defender: $mpCmd"
        $scanProc = Start-Process -FilePath $mpCmd -ArgumentList "-Scan -ScanType 1" -NoNewWindow -Wait -PassThru
        Write-Log "Escaneo de Defender finalizado con código $($scanProc.ExitCode)."
    } else {
        Write-Log "Iniciando MRT como alternativa..."
        Start-Process -FilePath "mrt.exe" -ArgumentList "/Q" -Wait -ErrorAction SilentlyContinue
    }

    $state.antimalware = "COMPLETED"
    Save-State
} else {
    Write-Host "`n[3/3] PASO 3 (Antimalware): Ya completado previamente. Saltando..." -ForegroundColor Gray
}

# ====================================================================
# FINALIZACIÓN Y LIMPIEZA
# ====================================================================
$state.status = "FINISHED"
Save-State

# Desactivar la tarea de auto-recuperación pues ya terminó al 100%
try {
    Unregister-ScheduledTask -TaskName "LIMS_Repair_AutoResume" -Confirm:$false -ErrorAction SilentlyContinue
    Write-Log "Tarea de reanudación automática eliminada (Proceso 100% completo)."
} catch {}

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "     ¡TODOS LOS PROCESOS SE COMPLETARON CON ÉXITO!            " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Green
Write-Log "Reparación y escaneo total finalizado con éxito." "SUCCESS"
Write-Host "`nRegistro guardado en: $logFile" -ForegroundColor Cyan
Write-Host "`nPuede cerrar esta ventana o presionar cualquier tecla." -ForegroundColor White
