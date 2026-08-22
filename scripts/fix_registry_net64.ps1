# Usar .NET RegistryView::Registry64 y Registry32 para escribir en HKLM y HKCU
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
    Write-Error "No se encontró directorio de instalación de Chrome Remote Desktop."
    exit 1
}

$verPath = $latestVerDir.FullName
Write-Host "Vincular registros usando versión: $verPath"

$manifests = @(
    'com.google.chrome.remote_desktop',
    'com.google.chrome.remote_assistance',
    'com.google.chrome.remote_webauthn'
)

$reg64 = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry64)
$reg32 = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::LocalMachine, [Microsoft.Win32.RegistryView]::Registry32)
$regCu = [Microsoft.Win32.RegistryKey]::OpenBaseKey([Microsoft.Win32.RegistryHive]::CurrentUser, [Microsoft.Win32.RegistryView]::Registry64)

foreach ($m in $manifests) {
    $json = "$verPath\$m.json"
    if (Test-Path $json) {
        # Chrome HKLM 64-bit
        $k1 = $reg64.CreateSubKey("SOFTWARE\Google\Chrome\NativeMessagingHosts\$m")
        $k1.SetValue("", $json)
        $k1.Close()

        # Chrome HKLM 32-bit
        $k2 = $reg32.CreateSubKey("SOFTWARE\Google\Chrome\NativeMessagingHosts\$m")
        $k2.SetValue("", $json)
        $k2.Close()

        # Chrome HKCU
        $k3 = $regCu.CreateSubKey("SOFTWARE\Google\Chrome\NativeMessagingHosts\$m")
        $k3.SetValue("", $json)
        $k3.Close()

        # Edge HKLM 64-bit
        $k4 = $reg64.CreateSubKey("SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$m")
        $k4.SetValue("", $json)
        $k4.Close()

        # Edge HKLM 32-bit
        $k5 = $reg32.CreateSubKey("SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$m")
        $k5.SetValue("", $json)
        $k5.Close()

        # Edge HKCU
        $k6 = $regCu.CreateSubKey("SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$m")
        $k6.SetValue("", $json)
        $k6.Close()
    }
}

$reg64.Close()
$reg32.Close()
$regCu.Close()

Write-Host "Claves .NET Registry64/Registry32 aplicadas exitosamente."

