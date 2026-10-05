[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$today = (Get-Date).Date
Write-Host "Buscando archivos modificados hoy ($today) en Desktop, Documents y carpetas clave..."

$paths = @(
    "C:\Users\HP LAB\Desktop",
    "C:\Users\HP LAB\Documents",
    "C:\quickbooks2010"
)

foreach ($p in $paths) {
    if (Test-Path $p) {
        Get-ChildItem -Path $p -Recurse -ErrorAction SilentlyContinue | Where-Object {
            $_.LastWriteTime -ge $today -and -not $_.PSIsContainer
        } | Select-Object LastWriteTime, Length, FullName | Sort-Object LastWriteTime -Descending | ForEach-Object {
            Write-Host "$($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')) | $($_.Length) bytes | $($_.FullName)"
        }
    }
}
