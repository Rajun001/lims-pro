[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== ODBC DRIVERS ==="
Get-OdbcDriver | Select-Object Name, Platform | Format-Table -AutoSize

Write-Host "=== SYSTEM DSNs ==="
Get-OdbcDsn -DsnType "System" | Select-Object Name, DriverName, Platform | Format-Table -AutoSize

Write-Host "=== USER DSNs ==="
Get-OdbcDsn -DsnType "User" | Select-Object Name, DriverName, Platform | Format-Table -AutoSize
