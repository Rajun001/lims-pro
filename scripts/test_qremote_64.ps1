[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csPath = "c:\lims-microlabs\scripts\QBInteractiveAuthorizer.cs"
Add-Type -Path $csPath
[QBInteractiveAuthorizer]::StartWatcherThread()

$connString = "DSN=QuickBooks Data 64-Bit QRemote;"
try {
    $conn = New-Object System.Data.Odbc.OdbcConnection($connString)
    Write-Host "Abriendo QRemote 64-bit..."
    $conn.Open()
    Write-Host "[EXITO] Conectado via QRemote 64-bit!" -ForegroundColor Green

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
} catch {
    Write-Host "[ERROR]: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    [QBInteractiveAuthorizer]::StopWatcher()
}
