# Script para Borrar la Memoria Caché de Chrome Remote Desktop en Google Chrome

Write-Host "Cerrando Google Chrome para liberar la memoria caché..."
Get-Process chrome -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

$userDataDir = "$env:LOCALAPPDATA\Google\Chrome\User Data"

# 1. Eliminar bases de datos IndexedDB de remotedesktop.google.com
$idbPaths = Get-ChildItem -Path "$userDataDir" -Recurse -Filter "*remotedesktop*" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like "*IndexedDB*" -or $_.FullName -like "*Service Worker*" }

foreach ($p in $idbPaths) {
    try {
        Write-Host "Eliminando caché: $($p.FullName)"
        Remove-Item $p.FullName -Recurse -Force -ErrorAction SilentlyContinue
    } catch {}
}

# 2. Limpiar registros en HKCU
Remove-Item -Path "HKCU:\SOFTWARE\Google\Chrome Remote Desktop" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Limpiar carpeta de AppData
$crdAppData = "$env:LOCALAPPDATA\Google\Chrome Remote Desktop"
if (Test-Path $crdAppData) {
    Remove-Item $crdAppData -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Memoria caché de Chrome eliminada exitosamente."
