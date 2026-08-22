# Script de Reinstalación Limpia de Chrome Remote Desktop Host
# LIMS Microlabs

$logDir = "C:\lims-microlabs\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$logFile = Join-Path $logDir "crd_reinstall.log"

function Write-ReinstallLog {
    param([string]$Message)
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $Message"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Write-ReinstallLog "--- Iniciando Reinstalación Limpia de Chrome Remote Desktop ---"

# 1. Detener servicios y procesos
Write-ReinstallLog "1/5. Deteniendo servicio y procesos remoting..."
Stop-Service chromoting -Force -ErrorAction SilentlyContinue
Get-Process remoting_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process remoting_native_messaging_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Desinstalar MSI anterior si existe
$msiPath = "C:\lims-microlabs\chromeremotedesktophost.msi"
if (Test-Path $msiPath) {
    Write-ReinstallLog "2/5. Desinstalando versión anterior de Chrome Remote Desktop Host..."
    Start-Process msiexec.exe -ArgumentList "/x `"$msiPath`" /qn /norestart" -Wait -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# 3. Eliminar directorios de instalación obsoletos y ProgramData
Write-ReinstallLog "3/5. Eliminando carpetas y configuraciones antiguas..."
$purgeDirs = @(
    "C:\Program Files (x86)\Google\Chrome Remote Desktop",
    "C:\Program Files\Google\Chrome Remote Desktop",
    "C:\ProgramData\Google\Chrome Remote Desktop"
)

foreach ($dir in $purgeDirs) {
    if (Test-Path $dir) {
        try {
            takeown /f "$dir" /r /d y 2>$null | Out-Null
            icacls "$dir" /grant "Administrators:(OI)(CI)F" "SYSTEM:(OI)(CI)F" /t /c 2>$null | Out-Null
            Remove-Item $dir -Recurse -Force -ErrorAction SilentlyContinue
            Write-ReinstallLog "Carpeta eliminada: $dir"
        } catch {
            Write-ReinstallLog "Aviso limpiando carpeta ${dir}: $($_.ToString())"
        }
    }
}

# 4. Reinstalar MSI oficial
if (Test-Path $msiPath) {
    Write-ReinstallLog "4/5. Instalando Host oficial desde $msiPath..."
    Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /qn /norestart" -Wait -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    Write-ReinstallLog "Instalación MSI finalizada."
} else {
    Write-ReinstallLog "ERROR: No se encontró el instalador $msiPath."
}

# 5. Ejecutar fijación de registros y permisos
Write-ReinstallLog "5/5. Configurando permisos y registro nativo..."
if (Test-Path "C:\lims-microlabs\scripts\fix_crd.ps1") {
    & "C:\lims-microlabs\scripts\fix_crd.ps1"
}

Write-ReinstallLog "--- Reinstalación Limpia Finalizada Con Éxito ---"
