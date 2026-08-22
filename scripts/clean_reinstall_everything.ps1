# Script de Limpieza Absoluta y Reinstalación de Chrome Remote Desktop
# LIMS Microlabs - Host: Reportes | PIN: 123456

$logDir = "C:\lims-microlabs\logs"
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
$logFile = Join-Path $logDir "crd_total_clean.log"

function Write-CleanLog($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Write-CleanLog "--- INICIANDO LIMPIEZA ABSOLUTA Y REINSTALACIÓN ---"

# 1. Detener Servicios y Procesos
Write-CleanLog "[1/7] Deteniendo servicio chromoting y cerrando navegadores..."
Stop-Service chromoting -Force -ErrorAction SilentlyContinue
Get-Process remoting_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process remoting_native_messaging_host -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# 2. Borrar Caché de Chrome, IndexedDB, Service Workers e Historial de CRD
Write-CleanLog "[2/7] Borrando caché, IndexedDB e historial de Chrome Remote Desktop..."
$userDataDir = "$env:LOCALAPPDATA\Google\Chrome\User Data"
if (Test-Path $userDataDir) {
    $crdCaches = Get-ChildItem -Path "$userDataDir" -Recurse -Filter "*remotedesktop*" -ErrorAction SilentlyContinue
    foreach ($item in $crdCaches) {
        try {
            Remove-Item $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
            Write-CleanLog "Caché removida: $($item.FullName)"
        } catch {}
    }
}

# 3. Eliminar Claves de Registro HKCU antiguas
Write-CleanLog "[3/7] Limpiando claves de registro en HKCU..."
Remove-Item -Path "HKCU:\SOFTWARE\Google\Chrome Remote Desktop" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKCU:\SOFTWARE\Google\Chrome\NativeMessagingHosts\com.google.chrome.remote_desktop" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKCU:\SOFTWARE\Microsoft\Edge\NativeMessagingHosts\com.google.chrome.remote_desktop" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Eliminar Carpeta ProgramData y Host Config
Write-CleanLog "[4/7] Purgando carpeta C:\ProgramData\Google\Chrome Remote Desktop..."
$pgDir = "C:\ProgramData\Google\Chrome Remote Desktop"
if (Test-Path $pgDir) {
    takeown /f "$pgDir" /r /d y 2>&1 | Out-Null
    icacls --% "C:\ProgramData\Google\Chrome Remote Desktop" /grant Administrators:(OI)(CI)F /grant SYSTEM:(OI)(CI)F /grant Users:(OI)(CI)F /grant Everyone:(OI)(CI)F /t /c 2>&1 | Out-Null
    Remove-Item $pgDir -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Path $pgDir -Force | Out-Null
icacls --% "C:\ProgramData\Google\Chrome Remote Desktop" /grant Administrators:(OI)(CI)F /grant SYSTEM:(OI)(CI)F /grant Users:(OI)(CI)F /grant Everyone:(OI)(CI)F /t /c 2>&1 | Out-Null

# 5. Ejecutar Reinstalación MSI de Chrome Remote Desktop Host
$msiPath = "C:\lims-microlabs\chromeremotedesktophost.msi"
if (Test-Path $msiPath) {
    Write-CleanLog "[5/7] Reinstalando Host desde MSI oficial ($msiPath)..."
    Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /qn /norestart" -Wait -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 4
    Write-CleanLog "Instalación MSI ejecutada."
} else {
    Write-CleanLog "[AVISO] No se encontró $msiPath, omitiendo MSI."
}

# 6. Registrar Manifiestos Native Messaging Hosts en HKCU/HKLM
Write-CleanLog "[6/7] Registrando Native Messaging Hosts para Chrome y Edge..."
if (Test-Path "C:\lims-microlabs\scripts\fix_crd_origins.ps1") {
    & "C:\lims-microlabs\scripts\fix_crd_origins.ps1"
}

# 7. Reiniciar Servicio chromoting y Abrir Navegador
Write-CleanLog "[7/7] Iniciando servicio chromoting de forma limpia..."
Start-Service chromoting -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-CleanLog "--- LIMPIEZA Y REINSTALACIÓN COMPLETADA EXITOSAMENTE ---"
