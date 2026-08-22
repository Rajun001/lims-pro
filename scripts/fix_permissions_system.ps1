# Script de Reparación Ejecutado como SYSTEM para Chrome Remote Desktop
$logFile = "C:\lims-microlabs\logs\crd_system_fix.log"
$logDir = [System.IO.Path]::GetDirectoryName($logFile)
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }

function Write-FixLog($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logFile -Value "[$ts] $msg" -Encoding UTF8
}

Write-FixLog "--- Iniciando reparación SYSTEM de permisos CRD ---"

# 1. Detener Servicio chromoting y matar procesos host
Stop-Service chromoting -Force -ErrorAction SilentlyContinue
Get-Process remoting_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process remoting_native_messaging_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

# 2. Tomar propiedad y reparar permisos NTFS en ProgramData
$pgDir = "C:\ProgramData\Google\Chrome Remote Desktop"
if (Test-Path $pgDir) {
    takeown /f "$pgDir" /r /d y 2>&1 | Out-Null
    icacls "$pgDir" /reset /t /c 2>&1 | Out-Null
    icacls "$pgDir" /grant "Administrators:(OI)(CI)F" /grant "SYSTEM:(OI)(CI)F" /grant "Users:(OI)(CI)F" /grant "Everyone:(OI)(CI)F" /t /c 2>&1 | Out-Null

    # Eliminar host.json si está corrupto o bloqueado para forzar re-activación limpia
    $hostJson = Join-Path $pgDir "host.json"
    if (Test-Path $hostJson) {
        attrib -r -h -s $hostJson 2>&1 | Out-Null
        icacls $hostJson /grant "Everyone:F" 2>&1 | Out-Null
        Remove-Item $hostJson -Force -ErrorAction SilentlyContinue
        Write-FixLog "Archivo host.json corrupto/bloqueado eliminado."
    }

    $hostUnpriv = Join-Path $pgDir "host_unprivileged.json"
    if (Test-Path $hostUnpriv) {
        Remove-Item $hostUnpriv -Force -ErrorAction SilentlyContinue
    }
} else {
    New-Item -ItemType Directory -Path $pgDir -Force | Out-Null
    icacls "$pgDir" /grant "Administrators:(OI)(CI)F" /grant "SYSTEM:(OI)(CI)F" /grant "Users:(OI)(CI)F" /grant "Everyone:(OI)(CI)F" /t /c 2>&1 | Out-Null
}

Write-FixLog "Permisos NTFS en ProgramData restablecidos con éxito."

# 3. Iniciar Servicio chromoting
Start-Service chromoting -ErrorAction SilentlyContinue
Write-FixLog "Servicio chromoting iniciado."
