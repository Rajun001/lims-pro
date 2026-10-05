[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Buscando '131474' en C:\IONOS HiDrive..."
Get-ChildItem -Path "C:\IONOS HiDrive" -Filter "*131474*" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "ENCONTRADO 131474: $($_.FullName) ($($_.Length) bytes, $($_.LastWriteTime))"
}

Write-Host "`nBuscando archivos modificados hoy (09/21/2026) en C:\IONOS HiDrive..."
$today = (Get-Date).Date
Get-ChildItem -Path "C:\IONOS HiDrive" -Recurse -ErrorAction SilentlyContinue | Where-Object {
    $_.LastWriteTime -ge $today -and -not $_.PSIsContainer
} | Sort-Object LastWriteTime -Descending | Select-Object -First 20 | ForEach-Object {
    Write-Host "$($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')) | $($_.Length) bytes | $($_.FullName)"
}
