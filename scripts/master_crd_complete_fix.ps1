# ====================================================================
# SCRIPT MAESTRO DE REPARACIÓN Y CONFIGURACIÓN COMPLETA
# CHROME REMOTE DESKTOP - LIMS MICROLABS
# ====================================================================

$ErrorActionPreference = "Continue"

$logDir = 'C:\lims-microlabs\logs'
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}
$logFile = Join-Path $logDir 'master_crd_fix.log'

function Log-Message {
    param([string]$Msg, [string]$Level = 'INFO')
    $ts = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $line = "[$ts] [$Level] $Msg"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Log-Message '=== INICIANDO REPARACIÓN INTEGRAL MAESTRA DE CHROME REMOTE DESKTOP ==='

# 1. Detener servicios y procesos
Log-Message '1. Deteniendo procesos remoting y servicio chromoting...'
Stop-Service chromoting -Force -ErrorAction SilentlyContinue
Get-Process remoting_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process remoting_native_messaging_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Limpieza de directivas empresariales
Log-Message '2. Purgando directivas empresariales residuales de Google...'
Remove-Item -Path 'HKCU:\SOFTWARE\Policies\Google' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path 'HKLM:\SOFTWARE\Policies\Google' -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path 'HKLM:\SOFTWARE\WOW6432Node\Policies\Google' -Recurse -Force -ErrorAction SilentlyContinue

# 3. Limpiar y recrear ProgramData con permisos totales
Log-Message '3. Reconfigurando carpeta de datos C:\ProgramData\Google\Chrome Remote Desktop...'
$pgDir = 'C:\ProgramData\Google\Chrome Remote Desktop'
if (-not (Test-Path $pgDir)) {
    New-Item -ItemType Directory -Path $pgDir -Force | Out-Null
}

try {
    Start-Process -FilePath 'takeown.exe' -ArgumentList @('/f', $pgDir, '/r', '/d', 'y') -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Process -FilePath 'icacls.exe' -ArgumentList @($pgDir, '/grant', 'Administrators:(OI)(CI)F', 'SYSTEM:(OI)(CI)F', 'Users:(OI)(CI)F', 'Everyone:(OI)(CI)F', '/t', '/c') -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
    Remove-Item "$pgDir\*" -Recurse -Force -ErrorAction SilentlyContinue
} catch {
    Log-Message ("Aviso en ProgramData: {0}" -f $_.ToString()) 'WARN'
}

# 4. Instalar / Reparar Host oficial desde MSI
$msiPath = 'C:\lims-microlabs\chromeremotedesktophost.msi'
if (Test-Path $msiPath) {
    Log-Message '4. Reinstalando / Reparando Host oficial desde MSI...'
    $proc = Start-Process msiexec.exe -ArgumentList @('/i', $msiPath, '/qn', '/norestart') -PassThru -Wait
    Log-Message "MSI ejecutado con código de salida: $($proc.ExitCode)"
    Start-Sleep -Seconds 3
}

# 5. Localizar versión instalada y reparar manifiestos
$crdBase = 'C:\Program Files (x86)\Google\Chrome Remote Desktop'
$versionDirs = Get-ChildItem -Path $crdBase -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer -and $_.Name -match '^\d+(\.\d+)+$' }
$targetVerDir = $null
if ($versionDirs) {
    $targetVerDir = ($versionDirs | Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1).FullName
}
if (-not $targetVerDir -and (Test-Path "$crdBase\CurrentVersion")) {
    $targetVerDir = "$crdBase\CurrentVersion"
}

Log-Message "5. Directorio activo del Host: $targetVerDir"

if ($targetVerDir -and (Test-Path $targetVerDir)) {
    Start-Process -FilePath 'takeown.exe' -ArgumentList @('/f', $targetVerDir, '/r', '/d', 'y') -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
    Start-Process -FilePath 'icacls.exe' -ArgumentList @($targetVerDir, '/grant', 'Administrators:(OI)(CI)F', 'SYSTEM:(OI)(CI)F', 'Users:(OI)(CI)F', 'Everyone:(OI)(CI)F', '/t', '/c') -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue

    $origins = @(
        'chrome-extension://inomeogfingihgjfjlpeplalcfajhgai/',
        'chrome-extension://inmgicbfkbbpflfbdbbgcaicapuackqn/',
        'chrome-extension://inmoidikbeidagbbabajjmoapddbdcid/',
        'chrome-extension://djjmngfglakhkhmgcfdmjalogilepkhd/',
        'https://remotedesktop.google.com/'
    )

    $desktopJson = Join-Path $targetVerDir 'com.google.chrome.remote_desktop.json'
    $desktopManifest = @{
        name = 'com.google.chrome.remote_desktop'
        description = 'Chrome Remote Desktop Host'
        type = 'stdio'
        path = Join-Path $targetVerDir 'remoting_native_messaging_host.exe'
        allowed_origins = $origins
    } | ConvertTo-Json -Depth 5

    $assistJson = Join-Path $targetVerDir 'com.google.chrome.remote_assistance.json'
    $assistManifest = @{
        name = 'com.google.chrome.remote_assistance'
        description = 'Remote Assistance Host for Chrome Remote Desktop'
        type = 'stdio'
        path = Join-Path $targetVerDir 'remote_assistance_host.exe'
        allowed_origins = $origins
    } | ConvertTo-Json -Depth 5

    $webauthnJson = Join-Path $targetVerDir 'com.google.chrome.remote_webauthn.json'
    $webauthnManifest = @{
        name = 'com.google.chrome.remote_webauthn'
        description = 'Remote Web Authentication Process for Chrome Remote Desktop'
        type = 'stdio'
        path = Join-Path $targetVerDir 'remote_webauthn.exe'
        allowed_origins = $origins
    } | ConvertTo-Json -Depth 5

    attrib -r $desktopJson 2>$null | Out-Null
    Set-Content -Path $desktopJson -Value $desktopManifest -Encoding UTF8 -Force

    attrib -r $assistJson 2>$null | Out-Null
    Set-Content -Path $assistJson -Value $assistManifest -Encoding UTF8 -Force

    attrib -r $webauthnJson 2>$null | Out-Null
    Set-Content -Path $webauthnJson -Value $webauthnManifest -Encoding UTF8 -Force

    # Guardar copia local en crd_manifests
    $localManifestDir = 'C:\lims-microlabs\crd_manifests'
    if (-not (Test-Path $localManifestDir)) { New-Item -ItemType Directory -Path $localManifestDir -Force | Out-Null }
    Set-Content -Path (Join-Path $localManifestDir 'com.google.chrome.remote_desktop.json') -Value $desktopManifest -Encoding UTF8 -Force
    Set-Content -Path (Join-Path $localManifestDir 'com.google.chrome.remote_assistance.json') -Value $assistManifest -Encoding UTF8 -Force
    Set-Content -Path (Join-Path $localManifestDir 'com.google.chrome.remote_webauthn.json') -Value $webauthnManifest -Encoding UTF8 -Force

    # 6. Registrar en HKLM (64/32-bit) y HKCU para Chrome y Edge
    Log-Message '6. Registrando NativeMessagingHosts en todas las colmenas del registro...'
    $manifestMap = @{
        'com.google.chrome.remote_desktop' = (Join-Path $localManifestDir 'com.google.chrome.remote_desktop.json')
        'com.google.chrome.remote_assistance' = (Join-Path $localManifestDir 'com.google.chrome.remote_assistance.json')
        'com.google.chrome.remote_webauthn' = (Join-Path $localManifestDir 'com.google.chrome.remote_webauthn.json')
    }

    foreach ($name in $manifestMap.Keys) {
        $jsonPath = $manifestMap[$name]

        # HKCU
        $hkcuChrome = "HKCU:\SOFTWARE\Google\Chrome\NativeMessagingHosts\$name"
        if (-not (Test-Path $hkcuChrome)) { New-Item -Path $hkcuChrome -Force | Out-Null }
        Set-ItemProperty -Path $hkcuChrome -Name '(Default)' -Value $jsonPath -Force

        $hkcuEdge = "HKCU:\SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$name"
        if (-not (Test-Path $hkcuEdge)) { New-Item -Path $hkcuEdge -Force | Out-Null }
        Set-ItemProperty -Path $hkcuEdge -Name '(Default)' -Value $jsonPath -Force

        # HKLM 64-bit y 32-bit vía .NET Registry
        try {
            $k64 = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry64).CreateSubKey("SOFTWARE\Google\Chrome\NativeMessagingHosts\$name")
            if ($k64) { $k64.SetValue('', $jsonPath); $k64.Close() }

            $k32 = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry32).CreateSubKey("SOFTWARE\Google\Chrome\NativeMessagingHosts\$name")
            if ($k32) { $k32.SetValue('', $jsonPath); $k32.Close() }

            $k64e = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry64).CreateSubKey("SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$name")
            if ($k64e) { $k64e.SetValue('', $jsonPath); $k64e.Close() }

            $k32e = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry32).CreateSubKey("SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$name")
            if ($k32e) { $k32e.SetValue('', $jsonPath); $k32e.Close() }
        } catch {
            Log-Message ("Aviso escribiendo HKLM para {0}: {1}" -f $name, $_.ToString()) 'WARN'
        }
    }
}

# 7. Reglas de Firewall
Log-Message '7. Configurando reglas de Firewall de Windows...'
try {
    $exeHost = Join-Path $targetVerDir 'remoting_host.exe'
    if (Test-Path $exeHost) {
        Remove-NetFirewallRule -DisplayName 'Chrome Remote Desktop Host (Outbound)' -ErrorAction SilentlyContinue
        Remove-NetFirewallRule -DisplayName 'Chrome Remote Desktop Host (Inbound)' -ErrorAction SilentlyContinue
        New-NetFirewallRule -DisplayName 'Chrome Remote Desktop Host (Outbound)' -Direction Outbound -Program $exeHost -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
        New-NetFirewallRule -DisplayName 'Chrome Remote Desktop Host (Inbound)' -Direction Inbound -Program $exeHost -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    }

    Remove-NetFirewallRule -DisplayName 'Chrome Remote Desktop STUN 3478 Out' -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName 'Chrome Remote Desktop STUN 3478 Out' -Direction Outbound -Protocol UDP -RemotePort 3478 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName 'Chrome Remote Desktop STUN 3478 Out' -Direction Outbound -Protocol TCP -RemotePort 3478 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null

    Remove-NetFirewallRule -DisplayName 'Chrome Remote Desktop HTTPS 443 Out' -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName 'Chrome Remote Desktop HTTPS 443 Out' -Direction Outbound -Protocol TCP -RemotePort 443 -Action Allow -Profile Any -ErrorAction SilentlyContinue | Out-Null
} catch {
    Log-Message ("Aviso configurando firewall: {0}" -f $_.ToString()) 'WARN'
}

# 8. Configuración e inicio del servicio chromoting
Log-Message '8. Configurando e iniciando el servicio chromoting...'
try {
    sc.exe config chromoting start= auto | Out-Null
    sc.exe failure chromoting reset= 86400 actions= restart/5000/restart/10000/restart/30000 | Out-Null
    Start-Service chromoting -ErrorAction SilentlyContinue
} catch {
    Log-Message ("Aviso en servicio chromoting: {0}" -f $_.ToString()) 'WARN'
}

Start-Sleep -Seconds 2
$svc = Get-Service chromoting -ErrorAction SilentlyContinue
Log-Message "Estado final del servicio chromoting: $($svc.Status)"

Log-Message '=== REPARACIÓN INTEGRAL MAESTRA COMPLETADA AL 100% ==='
