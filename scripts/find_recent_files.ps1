[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$targets = @(
    "C:\Users\HP LAB\Desktop",
    "C:\Users\HP LAB\Documents",
    "C:\Users\HP LAB\Downloads",
    "C:\quickbooks2010"
)

Write-Host "Buscando archivos con 131474..."
foreach ($t in $targets) {
    if (Test-Path $t) {
        Get-ChildItem -Path $t -Filter "*131474*" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "ENCONTRADO POR NOMBRE: $($_.FullName) ($($_.Length) bytes, $($_.LastWriteTime))"
        }
    }
}

Write-Host "`nBuscando archivos modificados en las ultimas 24 horas..."
$cutoff = (Get-Date).AddDays(-1)
foreach ($t in $targets) {
    if (Test-Path $t) {
        Get-ChildItem -Path $t -File -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -ge $cutoff } | ForEach-Object {
            Write-Host "MODIFICADO RECIENTE: $($_.FullName) ($($_.LastWriteTime))"
        }
    }
}
