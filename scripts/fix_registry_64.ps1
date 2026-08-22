# Forzar la creación de claves en el Registro de 64 bits y 32 bits para Chrome y Edge
$verPath = "C:\Program Files (x86)\Google\Chrome Remote Desktop\152.0.7977.9"

# Crear claves padre en HKLM 64-bit y 32-bit
cmd.exe /c "reg add `"HKLM\SOFTWARE\Google\Chrome\NativeMessagingHosts`" /f /reg:64" 2>$null
cmd.exe /c "reg add `"HKLM\SOFTWARE\WOW6432Node\Google\Chrome\NativeMessagingHosts`" /f /reg:32" 2>$null
cmd.exe /c "reg add `"HKLM\SOFTWARE\Microsoft\Edge\NativeMessagingHosts`" /f /reg:64" 2>$null
cmd.exe /c "reg add `"HKLM\SOFTWARE\WOW6432Node\Microsoft\Edge\NativeMessagingHosts`" /f /reg:32" 2>$null

$manifests = @(
    'com.google.chrome.remote_desktop',
    'com.google.chrome.remote_assistance',
    'com.google.chrome.remote_webauthn'
)

foreach ($m in $manifests) {
    $json = "$verPath\$m.json"
    if (Test-Path $json) {
        # Reg 64-bit HKLM
        cmd.exe /c "reg add `"HKLM\SOFTWARE\Google\Chrome\NativeMessagingHosts\$m`" /ve /t REG_SZ /d `"$json`" /f /reg:64" 2>$null
        # Reg 32-bit HKLM (WOW6432Node)
        cmd.exe /c "reg add `"HKLM\SOFTWARE\WOW6432Node\Google\Chrome\NativeMessagingHosts\$m`" /ve /t REG_SZ /d `"$json`" /f /reg:32" 2>$null
        # Reg HKCU
        cmd.exe /c "reg add `"HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\$m`" /ve /t REG_SZ /d `"$json`" /f" 2>$null

        # Edge 64-bit HKLM
        cmd.exe /c "reg add `"HKLM\SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$m`" /ve /t REG_SZ /d `"$json`" /f /reg:64" 2>$null
        # Edge 32-bit HKLM
        cmd.exe /c "reg add `"HKLM\SOFTWARE\WOW6432Node\Microsoft\Edge\NativeMessagingHosts\$m`" /ve /t REG_SZ /d `"$json`" /f /reg:32" 2>$null
        # Edge HKCU
        cmd.exe /c "reg add `"HKCU\SOFTWARE\Microsoft\Edge\NativeMessagingHosts\$m`" /ve /t REG_SZ /d `"$json`" /f" 2>$null
    }
}
Write-Host "Claves de registro 64-bit y 32-bit insertadas exitosamente."
