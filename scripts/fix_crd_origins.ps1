# Script to resolve Chrome Remote Desktop allowed_origins mismatch
# Creates custom manifests pointing to the installed executables with updated allowed_origins
# and registers them in HKEY_CURRENT_USER (HKCU) which does not require Admin privileges.

$workDir = "C:\lims-microlabs"
$manifestDir = "$workDir\crd_manifests"

if (-not (Test-Path $manifestDir)) {
    New-Item -ItemType Directory -Path $manifestDir -Force | Out-Null
}

# 1. Detect latest installed Chrome Remote Desktop directory
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
    Write-Error "Chrome Remote Desktop is not installed or installation folder not found."
    exit 1
}

$verPath = $latestVerDir.FullName
Write-Host "Detected Chrome Remote Desktop version path: $verPath"

# 2. Define manifests and their target executables
$manifests = @(
    @{
        Name = "com.google.chrome.remote_desktop"
        Desc = "Chrome Remote Desktop Host"
        Exe  = "remoting_native_messaging_host.exe"
        Origins = @(
            "chrome-extension://inomeogfingihgjfjlpeplalcfajhgai/",
            "chrome-extension://inmgicbfkbbpflfbdbbgcaicapuackqn/"
        )
    },
    @{
        Name = "com.google.chrome.remote_assistance"
        Desc = "Remote Assistance Host for Chrome Remote Desktop"
        Exe  = "remote_assistance_host.exe"
        Origins = @(
            "chrome-extension://inomeogfingihgjfjlpeplalcfajhgai/",
            "chrome-extension://inmgicbfkbbpflfbdbbgcaicapuackqn/"
        )
    },
    @{
        Name = "com.google.chrome.remote_webauthn"
        Desc = "Remote Web Authentication Process for Chrome Remote Desktop"
        Exe  = "remote_webauthn.exe"
        Origins = @(
            "chrome-extension://inomeogfingihgjfjlpeplalcfajhgai/",
            "chrome-extension://inmgicbfkbbpflfbdbbgcaicapuackqn/",
            "chrome-extension://djjmngfglakhkhmgcfdmjalogilepkhd/"
        )
    }
)

# 3. Create custom JSON manifests with absolute paths
foreach ($m in $manifests) {
    $exePath = Join-Path $verPath $m.Exe
    if (-not (Test-Path $exePath)) {
        Write-Warning "Executable not found: $exePath"
        continue
    }

    # Format JSON structure
    $jsonObj = @{
        name = $m.Name
        description = $m.Desc
        type = "stdio"
        path = $exePath
        allowed_origins = $m.Origins
    }

    $jsonContent = $jsonObj | ConvertTo-Json -Depth 4
    $destFile = Join-Path $manifestDir "$($m.Name).json"
    Set-Content -Path $destFile -Value $jsonContent -Encoding UTF8
    Write-Host "Created custom manifest: $destFile"
}

# 4. Register custom manifests in HKCU (Google Chrome & Microsoft Edge)
foreach ($m in $manifests) {
    $destFile = Join-Path $manifestDir "$($m.Name).json"
    if (Test-Path $destFile) {
        $chromeRegPath = "HKCU:\SOFTWARE\Google\Chrome\NativeMessagingHosts\$($m.Name)"
        $edgeRegPath = "HKCU:\SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$($m.Name)"

        # Register for Chrome
        if (-not (Test-Path $chromeRegPath)) {
            New-Item -Path $chromeRegPath -Force | Out-Null
        }
        # In PowerShell, Set-ItemProperty on a key (default) is set with Name "(default)"
        # But wait, registry default value is written using -Name "" or -Name "(default)". Let's use -Name "(default)" or -Value.
        # Actually, in registry PSDrive, the default value is named "(default)". Let's use Set-ItemProperty -Path $chromeRegPath -Name "(default)" -Value $destFile
        Set-ItemProperty -Path $chromeRegPath -Name "(default)" -Value $destFile -Force
        Write-Host "Registered in HKCU Chrome: $($m.Name)"

        # Register for Edge
        if (-not (Test-Path $edgeRegPath)) {
            New-Item -Path $edgeRegPath -Force | Out-Null
        }
        Set-ItemProperty -Path $edgeRegPath -Name "(default)" -Value $destFile -Force
        Write-Host "Registered in HKCU Edge: $($m.Name)"
    }
}

Write-Host "Origins fix applied successfully."
