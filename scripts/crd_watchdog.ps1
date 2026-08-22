# ====================================================================
# Centinela Auto-Reparador (Watchdog) para Chrome Remote Desktop
# Se ejecuta como SYSTEM cada 15 minutos en segundo plano.
# ====================================================================

$logDir = "C:\lims-microlabs\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$logFile = Join-Path $logDir "crd_watchdog.log"

function Write-WatchdogLog {
    param([string]$Message, [string]$Level = "INFO")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] [$Level] $Message"
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Write-WatchdogLog "--- Ejecutando verificación del Centinela CRD ---"

# 1. Asegurar permisos de lectura y modificación en ProgramData
$pgDir = "C:\ProgramData\Google\Chrome Remote Desktop"
if (Test-Path $pgDir) {
    try {
        takeown /f "$pgDir" /r /d y 2>$null | Out-Null
        icacls "$pgDir" /reset /t /c 2>$null | Out-Null
        icacls "$pgDir" /grant "Administrators:(OI)(CI)F" /grant "SYSTEM:(OI)(CI)F" /grant "Users:(OI)(CI)F" /grant "Everyone:(OI)(CI)F" /t /c 2>$null | Out-Null
        Get-ChildItem -Path $pgDir -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            attrib -r -h -s $_.FullName 2>$null | Out-Null
            icacls $_.FullName /grant "Administrators:F" /grant "SYSTEM:F" /grant "Users:F" /grant "Everyone:F" /c 2>$null | Out-Null
            Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue
        }
        Write-WatchdogLog "Permisos asegurados en $pgDir." "OK"
    } catch {}
}

# 2. Verificar e iniciar servicio chromoting (SOLO SI ESTÁ DETENIDO)
$svc = Get-Service chromoting -ErrorAction SilentlyContinue
if (-not $svc) {
    Write-WatchdogLog "El servicio chromoting no existe en el sistema." "ERROR"
} elseif ($svc.Status -ne "Running") {
    Write-WatchdogLog "Servicio chromoting detenido. Iniciando servicio..." "WARN"
    try {
        Start-Service chromoting -ErrorAction Stop
        Write-WatchdogLog "Servicio chromoting iniciado exitosamente." "OK"
    } catch {
        Write-WatchdogLog "Error al iniciar chromoting: $_" "ERROR"
    }
} else {
    Write-WatchdogLog "Servicio chromoting activo y saludable (Running)." "OK"
}

# 3. Detectar directorio de la versión instalada y reparar registro Native Messaging Hosts
$basePaths = @(
    "C:\Program Files (x86)\Google\Chrome Remote Desktop",
    "C:\Program Files\Google\Chrome Remote Desktop"
)

$latestVerDir = $null
$versionDirs = Get-ChildItem $basePaths -ErrorAction SilentlyContinue |
    Where-Object { $_.PSIsContainer -and $_.Name -match '^\d+(\.\d+)+$' }
if ($versionDirs) {
    $latestVerDir = $versionDirs | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
}

if ($latestVerDir) {
    $manifests = @(
        'com.google.chrome.remote_desktop',
        'com.google.chrome.remote_assistance',
        'com.google.chrome.remote_webauthn'
    )

    foreach ($m in $manifests) {
        $jsonFile = Join-Path $latestVerDir.FullName "$m.json"
        if (Test-Path $jsonFile) {
            # Asegurar que los manifiestos oficiales contengan el ID de la nueva extension
            try {
                $jsonObj = Get-Content -Path $jsonFile -Raw | ConvertFrom-Json
                $newOrigin = "chrome-extension://inmgicbfkbbpflfbdbbgcaicapuackqn/"
                if ($jsonObj.allowed_origins -notcontains $newOrigin) {
                    $jsonObj.allowed_origins += $newOrigin
                    $newJson = ConvertTo-Json $jsonObj -Depth 4
                    attrib -r $jsonFile 2>$null | Out-Null
                    Set-Content -Path $jsonFile -Value $newJson -Encoding UTF8 -Force
                    Write-WatchdogLog "Actualizado manifest $jsonFile con la nueva extension ID." "OK"
                }
            } catch {
                Write-WatchdogLog "Aviso actualizando manifest en Program Files: $_" "WARN"
            }

            $subPathChrome = "SOFTWARE\Google\Chrome\NativeMessagingHosts\$m"
            $subPathEdge = "SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$m"

            $targets = @(
                @{ Hive = [Microsoft.Win32.RegistryHive]::LocalMachine; View = [Microsoft.Win32.RegistryView]::Registry64; Path = $subPathChrome },
                @{ Hive = [Microsoft.Win32.RegistryHive]::LocalMachine; View = [Microsoft.Win32.RegistryView]::Registry32; Path = $subPathChrome },
                @{ Hive = [Microsoft.Win32.RegistryHive]::CurrentUser; View = [Microsoft.Win32.RegistryView]::Registry64; Path = $subPathChrome },
                @{ Hive = [Microsoft.Win32.RegistryHive]::LocalMachine; View = [Microsoft.Win32.RegistryView]::Registry64; Path = $subPathEdge },
                @{ Hive = [Microsoft.Win32.RegistryHive]::LocalMachine; View = [Microsoft.Win32.RegistryView]::Registry32; Path = $subPathEdge },
                @{ Hive = [Microsoft.Win32.RegistryHive]::CurrentUser; View = [Microsoft.Win32.RegistryView]::Registry64; Path = $subPathEdge }
            )

            foreach ($t in $targets) {
                try {
                    $baseKey = [Microsoft.Win32.RegistryKey]::OpenBaseKey($t.Hive, $t.View)
                    $subKey = $baseKey.CreateSubKey($t.Path)
                    if ($subKey) {
                        $curVal = $subKey.GetValue("")
                        if ($curVal -ne $jsonFile) {
                            $subKey.SetValue("", $jsonFile)
                        }
                        $subKey.Close()
                    }
                    $baseKey.Close()
                } catch {}
            }
        }
    }
    Write-WatchdogLog "Claves de registro verificadas e intactas." "OK"
}

# 4. Asegurar reglas de Firewall de Windows (STUN 3478, HTTPS 443 y remoting_host)
try {
    if (-not (Get-NetFirewallRule -DisplayName "Chrome Remote Desktop STUN 3478 Out" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName "Chrome Remote Desktop STUN 3478 Out" -Direction Outbound -Protocol UDP -RemotePort 3478 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
        New-NetFirewallRule -DisplayName "Chrome Remote Desktop STUN 3478 Out" -Direction Outbound -Protocol TCP -RemotePort 3478 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    }

    if (-not (Get-NetFirewallRule -DisplayName "Chrome Remote Desktop HTTPS 443 Out" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName "Chrome Remote Desktop HTTPS 443 Out" -Direction Outbound -Protocol TCP -RemotePort 443 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    }

Write-WatchdogLog "--- Verificación del Centinela completada ---"



















