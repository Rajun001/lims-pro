[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csPath = "c:\lims-microlabs\scripts\QBInteractiveAuthorizer.cs"
Add-Type -Path $csPath
[QBInteractiveAuthorizer]::StartWatcherThread()

Write-Host "Probando conexion con QODBC y autorizador automatico..." -ForegroundColor Yellow

$connString = "DSN=QuickBooks Data;DFN=C:\quickbooks2010\alimentos10.QBW;OpenMode=F;"
try {
    $conn = New-Object System.Data.Odbc.OdbcConnection($connString)
    Write-Host "Abriendo conexion ODBC con 'QuickBooks Data'..." -ForegroundColor Yellow
    $conn.Open()
    Write-Host "[EXITO] Conexion ODBC abierta con exito!" -ForegroundColor Green

    [QBInteractiveAuthorizer]::StopWatcher()

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
    Write-Host "`n[COMPLETO] QODBC esta funcionando perfectamente." -ForegroundColor Green
} catch {
    [QBInteractiveAuthorizer]::StopWatcher()
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
}
