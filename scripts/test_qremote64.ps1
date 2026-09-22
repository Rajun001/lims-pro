[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Probando conexion con QRemote 64-Bit..." -ForegroundColor Yellow

$connString = "DSN=QuickBooks Data 64-Bit QRemote;"
try {
    $conn = New-Object System.Data.Odbc.OdbcConnection($connString)
    Write-Host "Abriendo conexion ODBC con 'QuickBooks Data 64-Bit QRemote'..." -ForegroundColor Yellow
    $conn.Open()
    Write-Host "[EXITO] Conexion ODBC abierta con exito!" -ForegroundColor Green

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT TOP 5 ListID, Name, FullName, Balance FROM Customer"
    $adapter = New-Object System.Data.Odbc.OdbcDataAdapter($cmd)
    $dt = New-Object System.Data.DataTable
    $null = $adapter.Fill($dt)

    Write-Host "`nClientes recuperados:" -ForegroundColor Cyan
    foreach ($row in $dt.Rows) {
        Write-Host " - $($row['FullName']) | Saldo: $($row['Balance'])"
    }

    $conn.Close()
    Write-Host "`n[COMPLETO] QRemote 64-bit esta funcionando perfectamente." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
}
