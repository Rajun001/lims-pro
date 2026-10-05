[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

foreach ($f in @("C:\quickbooks2010\alimentos10.QBW.DSN", "C:\quickbooks2010\alimentos10.QBW.ND")) {
    if (Test-Path $f) {
        Write-Host "=== $f ==="
        Get-Content $f
    }
}
