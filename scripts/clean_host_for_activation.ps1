Stop-Service chromoting -Force -ErrorAction SilentlyContinue
Get-Process remoting_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process remoting_native_messaging_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

$pgDir = "C:\ProgramData\Google\Chrome Remote Desktop"
if (Test-Path $pgDir) {
    takeown /f "$pgDir" /r /d y 2>$null | Out-Null
    icacls "$pgDir" /reset /t /c 2>$null | Out-Null

    if (Test-Path "$pgDir\host.json") {
        attrib -r -h -s "$pgDir\host.json" 2>$null | Out-Null
        Remove-Item "$pgDir\host.json" -Force -ErrorAction SilentlyContinue
    }

    if (Test-Path "$pgDir\host_unprivileged.json") {
        attrib -r -h -s "$pgDir\host_unprivileged.json" 2>$null | Out-Null
        Remove-Item "$pgDir\host_unprivileged.json" -Force -ErrorAction SilentlyContinue
    }

    icacls "$pgDir" /grant "Administrators:(OI)(CI)F" /grant "SYSTEM:(OI)(CI)F" /grant "Users:(OI)(CI)F" /grant "Everyone:(OI)(CI)F" /t /c 2>$null | Out-Null
}

Start-Service chromoting -ErrorAction SilentlyContinue
Write-Host "Limpieza forzada finalizada exitosamente."

