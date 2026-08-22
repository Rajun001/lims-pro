# Script de Diagnóstico y Reparación de Chrome Remote Desktop
# Diseñado para LIMS Microlabs

# Auto-elevación a Administrador si se ejecuta directamente en PowerShell
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[AVISO] El script no se está ejecutando como Administrador. Solicitando elevación..." -ForegroundColor Yellow
    try {
        Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs -Wait -ErrorAction Stop
        exit
    } catch {
        Write-Host "[AVISO] No se pudo elevar permisos automáticamente (entorno no interactivo). Continuando..." -ForegroundColor Yellow
    }
}

$logDir = "C:\lims-microlabs\logs"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$logFile = Join-Path $logDir "crd_repair.log"

function Write-CrdLog {
    param([string]$Message, [string]$Level = "INFO")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] [$Level] $Message"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Write-CrdLog "--- Iniciando reparación completa de Chrome Remote Desktop ---"

# 1. Detener servicio y procesos remoting
Write-CrdLog "Deteniendo servicio chromoting y procesos remoting..."
Stop-Service chromoting -Force -ErrorAction SilentlyContinue
Get-Process remoting_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process remoting_native_messaging_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Corregir permisos en ProgramData (Acceso total para Users, Everyone, SYSTEM, Administrators)
$pgDir = "C:\ProgramData\Google\Chrome Remote Desktop"
if (-not (Test-Path $pgDir)) {
    New-Item -ItemType Directory -Path $pgDir -Force | Out-Null
}

Write-CrdLog "Asegurando permisos y propiedad en $pgDir..."
try {
    takeown /f "$pgDir" /r /d y 2>$null | Out-Null
    icacls "$pgDir" /reset /t /c 2>$null | Out-Null
    icacls "$pgDir" /grant "Administrators:(OI)(CI)F" /grant "SYSTEM:(OI)(CI)F" /grant "Users:(OI)(CI)F" /grant "Everyone:(OI)(CI)F" /t /c 2>$null | Out-Null
    
    # Desbloquear y asegurar archivos internos si existen
    Get-ChildItem -Path $pgDir -File -ErrorAction SilentlyContinue | ForEach-Object {
        attrib -r -h -s $_.FullName 2>$null | Out-Null
        icacls $_.FullName /grant "Administrators:F" /grant "SYSTEM:F" /grant "Users:F" /grant "Everyone:F" /c 2>$null | Out-Null
        Unblock-File -Path $_.FullName -ErrorAction SilentlyContinue
    }
    Write-CrdLog "Permisos aplicados correctamente en $pgDir."
} catch {
    Write-CrdLog "Aviso aplicando permisos: $_" "WARN"
}

# 3. Detectar directorio de la versión más reciente instalada y eliminar versiones obsoletas (2019-2021)
$basePaths = @(
    "C:\Program Files (x86)\Google\Chrome Remote Desktop",
    "C:\Program Files\Google\Chrome Remote Desktop"
)

foreach ($bp in $basePaths) {
    if (Test-Path $bp) {
        $oldDirs = Get-ChildItem $bp -ErrorAction SilentlyContinue |
            Where-Object { $_.PSIsContainer -and $_.Name -match '^\d+(\.\d+)+$' -and [version]$_.Name -lt [version]"150.0.0.0" }
        foreach ($od in $oldDirs) {
            Write-CrdLog "Eliminando carpeta de versión obsoleta: $($od.FullName)"
            Remove-Item $od.FullName -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

$latestVerDir = $null
$versionDirs = Get-ChildItem $basePaths -ErrorAction SilentlyContinue |
    Where-Object { $_.PSIsContainer -and $_.Name -match '^\d+(\.\d+)+$' }
if ($versionDirs) {
    $latestVerDir = $versionDirs | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
}


if (-not $latestVerDir) {
    foreach ($bp in $basePaths) {
        $curVerPath = Join-Path $bp "CurrentVersion"
        if (Test-Path $curVerPath) {
            $latestVerDir = Get-Item $curVerPath
            break
        }
    }
}

if (-not $latestVerDir) {
    Write-CrdLog "No se encontró ningún directorio de instalación de Chrome Remote Desktop." "ERROR"
} else {
    Write-CrdLog "Versión de Chrome Remote Desktop detectada: $($latestVerDir.FullName) ($($latestVerDir.Name))"

    # 4. Registrar Native Messaging Hosts en Google Chrome y Microsoft Edge usando .NET Registry API (64-bit y 32-bit HKLM y HKCU)
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
                    Write-CrdLog "Actualizado manifest $jsonFile con la nueva extension ID."
                }
            } catch {
                Write-CrdLog "Aviso actualizando manifest en Program Files: $_. Se usara redireccion de registro." "WARN"
            }

            $subPathChrome = "SOFTWARE\Google\Chrome\NativeMessagingHosts\$m"
            $subPathEdge = "SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$m"

            $targets = @(
                @{ Hive = [Microsoft.Win32.RegistryHive]::LocalMachine; View = [Microsoft.Win32.RegistryView]::Registry64; Path = $subPathChrome; Desc = "HKLM 64-bit Chrome" },
                @{ Hive = [Microsoft.Win32.RegistryHive]::LocalMachine; View = [Microsoft.Win32.RegistryView]::Registry32; Path = $subPathChrome; Desc = "HKLM 32-bit Chrome" },
                @{ Hive = [Microsoft.Win32.RegistryHive]::CurrentUser; View = [Microsoft.Win32.RegistryView]::Registry64; Path = $subPathChrome; Desc = "HKCU Chrome" },
                @{ Hive = [Microsoft.Win32.RegistryHive]::LocalMachine; View = [Microsoft.Win32.RegistryView]::Registry64; Path = $subPathEdge; Desc = "HKLM 64-bit Edge" },
                @{ Hive = [Microsoft.Win32.RegistryHive]::LocalMachine; View = [Microsoft.Win32.RegistryView]::Registry32; Path = $subPathEdge; Desc = "HKLM 32-bit Edge" },
                @{ Hive = [Microsoft.Win32.RegistryHive]::CurrentUser; View = [Microsoft.Win32.RegistryView]::Registry64; Path = $subPathEdge; Desc = "HKCU Edge" }
            )

            foreach ($t in $targets) {
                try {
                    $baseKey = [Microsoft.Win32.RegistryKey]::OpenBaseKey($t.Hive, $t.View)
                    $subKey = $baseKey.CreateSubKey($t.Path)
                    if ($subKey) {
                        $subKey.SetValue("", $jsonFile)
                        $subKey.Close()
                        Write-CrdLog "Registro [$($t.Desc)]: $($t.Path) -> $jsonFile"
                    }
                    $baseKey.Close()
                } catch {
                    Write-CrdLog "Error al escribir en el registro [$($t.Desc)]: $_" "WARN"
                }
            }
        } else {
            Write-CrdLog "No se encontró manifiesto $jsonFile" "WARN"
        }
    }
}

# 5. Configurar Reglas de Firewall de Windows (STUN 3478, HTTPS 443 y remoting_host)
Write-CrdLog "Configurando reglas de Firewall de Windows..."
try {
    $exePaths = @(
        "C:\Program Files (x86)\Google\Chrome Remote Desktop\CurrentVersion\remoting_host.exe",
        "$($latestVerDir.FullName)\remoting_host.exe"
    )

    foreach ($exe in $exePaths) {
        if (Test-Path $exe) {
            Remove-NetFirewallRule -DisplayName "Chrome Remote Desktop Host (Outbound)" -ErrorAction SilentlyContinue
            Remove-NetFirewallRule -DisplayName "Chrome Remote Desktop Host (Inbound)" -ErrorAction SilentlyContinue
            
            New-NetFirewallRule -DisplayName "Chrome Remote Desktop Host (Outbound)" -Direction Outbound -Program $exe -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
            New-NetFirewallRule -DisplayName "Chrome Remote Desktop Host (Inbound)" -Direction Inbound -Program $exe -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
        }
    }

    Remove-NetFirewallRule -DisplayName "Chrome Remote Desktop STUN 3478 Out" -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Chrome Remote Desktop STUN 3478 Out" -Direction Outbound -Protocol UDP -RemotePort 3478 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName "Chrome Remote Desktop STUN 3478 Out" -Direction Outbound -Protocol TCP -RemotePort 3478 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null

    Remove-NetFirewallRule -DisplayName "Chrome Remote Desktop HTTPS 443 Out" -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Chrome Remote Desktop HTTPS 443 Out" -Direction Outbound -Protocol TCP -RemotePort 443 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null

    Write-CrdLog "Reglas de Firewall configuradas exitosamente."
} catch {
    Write-CrdLog "Aviso al configurar reglas de Firewall: $_" "WARN"
}

# 6. Configurar Inicio en Diferido y Recuperación Automática del Servicio chromoting
Write-CrdLog "Configurando políticas de recuperación automática del servicio chromoting..."
try {
    sc.exe config chromoting start= delayed-auto | Out-Null
    sc.exe failure chromoting reset= 86400 actions= restart/5000/restart/10000/restart/30000 | Out-Null
    Write-CrdLog "Servicio chromoting configurado con inicio en diferido y reinicio automático."
} catch {
    Write-CrdLog "Aviso al configurar recuperación del servicio: $_" "WARN"
}

# 7. Iniciar el servicio chromoting
Write-CrdLog "Iniciando servicio chromoting..."
try {
    Start-Service chromoting -ErrorAction Stop
} catch {
    Write-CrdLog "Aviso al iniciar servicio chromoting: $_" "WARN"
}
Start-Sleep -Seconds 2


$svc = Get-Service chromoting -ErrorAction SilentlyContinue
if ($svc) {
    Write-CrdLog "Estado final del servicio chromoting: $($svc.Status)"
} else {
    Write-CrdLog "El servicio chromoting no existe en el sistema." "ERROR"
}

Write-CrdLog "--- Reparación finalizada con éxito ---"

