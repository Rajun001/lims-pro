[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Buscando '131474' en todo el disco C:..."

$searchRoots = @(
    "C:\Users\HP LAB\Desktop",
    "C:\Users\HP LAB\Documents",
    "C:\Users\HP LAB\Downloads",
    "C:\Users\HP LAB\AppData\Roaming\Microsoft\Word",
    "C:\Users\HP LAB\AppData\Roaming\Microsoft\Excel",
    "C:\Users\HP LAB\AppData\Roaming\Microsoft\Office\Recent"
)

foreach ($r in $searchRoots) {
    if (Test-Path $r) {
        Get-ChildItem -Path $r -Filter "*131474*" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            Write-Host "ARCHIVO: $($_.FullName) ($($_.Length) bytes, $($_.LastWriteTime))"
        }
    }
}

Write-Host "`nBuscando en Office Recent files de hoy..."
$recentDir = "C:\Users\HP LAB\AppData\Roaming\Microsoft\Office\Recent"
if (Test-Path $recentDir) {
    Get-ChildItem -Path $recentDir | Where-Object { $_.LastWriteTime -ge (Get-Date).Date } | ForEach-Object {
        Write-Host "RECENT OFFICE: $($_.Name) ($($_.LastWriteTime))"
    }
}

Write-Host "`nBuscando en Word MRU en Registry..."
$wordMru = "HKCU:\Software\Microsoft\Office\16.0\Word\User MRU"
if (Test-Path $wordMru) {
    Get-ChildItem -Path $wordMru -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        Get-ItemProperty -Path $_.PSPath -ErrorAction SilentlyContinue | ForEach-Object {
            $_.PSObject.Properties | Where-Object { $_.Name -match "Item" -and $_.Value -match "1314" } | ForEach-Object {
                Write-Host "WORD MRU: $($_.Value)"
            }
        }
    }
}
