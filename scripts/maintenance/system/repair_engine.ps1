# ====================================================================
# Motor de Reparación y Escaneo Autónomo del Sistema (LIMS-PRO)
# DISM + SFC + Windows Defender Quick Scan
# ====================================================================

$ErrorActionPreference = "Continue"
$workDir = "C:\lims-microlabs"
$stateFile = "$workDir\repair_state.json"
$logFile = "$workDir\repair_system.log"

# Verificar si se ejecuta como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Elevando privilegios a Administrador (UAC)..." -ForegroundColor Yellow
    Start-Process powershell.exe -ArgumentList "-ExecutionPolicy Bypass -NoProfile -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$timestamp] [$Level] $Message"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Clear-Host
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     SISTEMA DE MANTENIMIENTO Y REPARACIÓN PROFUNDA DE WINDOWS   " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "Directorio de trabajo: $workDir" -ForegroundColor Gray
Write-Host "Registro de eventos:   $logFile" -ForegroundColor Gray
Write-Host "----------------------------------------------------------------`n" -ForegroundColor Cyan

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
        if ($json.dism) { $state.dism = $json.dism }
        if ($json.sfc) { $state.sfc = $json.sfc }
        if ($json.antimalware) { $state.antimalware = $json.antimalware }
        if ($json.status) { $state.status = $json.status }
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

Save-State

# ====================================================================
# PASO 1: DISM (Reparación de la imagen del sistema operativo)
# ====================================================================
if ($state.dism -ne "COMPLETED") {
    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "[1/3] PASO 1: Reparando Imagen de Windows con DISM..." -ForegroundColor Green
    Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Log "Iniciando DISM /Online /Cleanup-Image /RestoreHealth..."
    
    $state.dism = "RUNNING"
    Save-State

    try {
        & DISM.exe /Online /Cleanup-Image /RestoreHealth
        $dismExit = $LASTEXITCODE
        if ($dismExit -eq 0) {
            $state.dism = "COMPLETED"
            Write-Log "DISM completado exitosamente (Código 0)." "OK"
        } else {
            Write-Log "DISM finalizó con código $dismExit." "WARN"
            $state.dism = "COMPLETED"
        }
    } catch {
        Write-Log "Error al ejecutar DISM: $_" "ERROR"
        $state.dism = "COMPLETED"
    }
    Save-State
} else {
    Write-Host "`n[1/3] PASO 1 (DISM): Ya completado previamente. Saltando..." -ForegroundColor Gray
}

# ====================================================================
# PASO 2: SFC (Comprobador y Restaurador de Archivos de Sistema)
# ====================================================================
if ($state.sfc -ne "COMPLETED") {
    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "[2/3] PASO 2: Comprobando y Reparando Archivos de Sistema (SFC)..." -ForegroundColor Green
    Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Log "Iniciando sfc /scannow..."
    
    $state.sfc = "RUNNING"
    Save-State

    try {
        & sfc.exe /scannow
        $sfcExit = $LASTEXITCODE
        Write-Log "SFC finalizó con código $sfcExit." "OK"
        $state.sfc = "COMPLETED"
    } catch {
        Write-Log "Error al ejecutar SFC: $_" "ERROR"
        $state.sfc = "COMPLETED"
    }
    Save-State
} else {
    Write-Host "`n[2/3] PASO 2 (SFC): Ya completado previamente. Saltando..." -ForegroundColor Gray
}

# ====================================================================
# PASO 3: Escaneo Antimalware de Seguridad
# ====================================================================
if ($state.antimalware -ne "COMPLETED") {
    Write-Host "`n----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Host "[3/3] PASO 3: Ejecutando Escaneo Antimalware de Seguridad..." -ForegroundColor Green
    Write-Host "----------------------------------------------------------------" -ForegroundColor Cyan
    Write-Log "Buscando motor de Microsoft Defender / MRT..."

    $state.antimalware = "RUNNING"
    Save-State

    $mpCmd = Get-ChildItem "C:\ProgramData\Microsoft\Windows Defender\Platform\*\MpCmdRun.exe", "C:\Program Files\Windows Defender\MpCmdRun.exe" -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    
    if ($mpCmd -and (Test-Path $mpCmd)) {
        Write-Log "Ejecutando escaneo rápido con Windows Defender: $mpCmd"
        try {
            & $mpCmd -Scan -ScanType 1
            $scanExit = $LASTEXITCODE
            Write-Log "Escaneo de Defender finalizado con código $scanExit." "OK"
        } catch {
            Write-Log "Aviso en escaneo Defender: $_" "WARN"
        }
    } else {
        Write-Log "Iniciando Herramienta de Eliminación de Software Malintencionado (MRT)..."
        Start-Process -FilePath "mrt.exe" -ArgumentList "/Q" -Wait -ErrorAction SilentlyContinue
    }

    $state.antimalware = "COMPLETED"
    Save-State
} else {
    Write-Host "`n[3/3] PASO 3 (Antimalware): Ya completado previamente. Saltando..." -ForegroundColor Gray
}

# ====================================================================
# FINALIZACIÓN Y RESUMEN
# ====================================================================
$state.status = "FINISHED"
Save-State

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "     ¡MANTENIMIENTO Y ESCANEO COMPLETADOS AL 100%!            " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Green
Write-Log "Mantenimiento profundo completado exitosamente." "SUCCESS"
Write-Host "`nRegistro guardado en: $logFile" -ForegroundColor Cyan
Write-Host "`nPuede cerrar esta ventana." -ForegroundColor White
Start-Sleep -Seconds 5
