# ====================================================================
# Guardian de Montaje Automatico de Unidad NAS / Nube (Z:)
# ====================================================================
param(
    [string]$Drive = "Z:",
    [string]$RemotePath = "\\microlabshp.webdav.hidrive.ionos.com@SSL\DavWWWRoot"
)

$logFile = "C:\lims-microlabs\logs\nas_watchdog.log"
$logDir = [System.IO.Path]::GetDirectoryName($logFile)
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

function Log-Msg($msg) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $entry = "[$timestamp] $msg"
    Add-Content -Path $logFile -Value $entry
    Write-Host $entry
}

try {
    $driveReady = $false
    if (Test-Path "$Drive\") {
        try {
            $null = Get-ChildItem "$Drive\" -ErrorAction Stop | Select-Object -First 1
            $driveReady = $true
        } catch {
            $driveReady = $false
        }
    }

    if ($driveReady) {
        # Unidad montada y respondiendo correctamente
        exit 0
    }

    Log-Msg "[WARN] Unidad $Drive no disponible o desconectada. Intentando reconectar a $RemotePath..."
    
    # Desmontar si estaba en estado zombie
    try {
        & net use "$Drive" /delete /yes 2>$null
    } catch {}

    Start-Sleep -Seconds 2

    # Intentar volver a conectar
    $res = & net use "$Drive" "$RemotePath" /persistent:yes 2>&1
    if (Test-Path "$Drive\") {
        Log-Msg "[OK] Unidad $Drive reconectada y verificada exitosamente."
        
        # Asegurar existencia de la carpeta de respaldos
        $backupDir = "$Drive\public\Respaldos_LIMS"
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            Log-Msg "[OK] Carpeta $backupDir verificada/creada."
        }
    } else {
        Log-Msg "[ERROR] No se pudo reconectar $Drive. Salida: $res"
    }
} catch {
    Log-Msg "[ERROR] Error fatal en watchdog: $($_.Exception.Message)"
}
