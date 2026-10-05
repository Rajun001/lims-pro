[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Probando conexión ODBC con 'QuickBooks Data 64-Bit QRemote'..."
try {
    $conn = New-Object System.Data.Odbc.OdbcConnection
    $conn.ConnectionString = "DSN=QuickBooks Data 64-Bit QRemote;"
    $conn.Open()
    Write-Host ">>> CONEXION ODBC 64-BIT ABIERTA CON EXITO! <<<" -ForegroundColor Green

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT TOP 3 TxnDate, RefNumber, CustomerRefFullName FROM Estimate WHERE TxnDate >= {d'2024-01-01'} ORDER BY TxnDate DESC"
    $reader = $cmd.ExecuteReader()

    while ($reader.Read()) {
        Write-Host "Estimate: $($reader['RefNumber']) | Fecha: $($reader['TxnDate']) | Cliente: $($reader['CustomerRefFullName'])"
    }
    $reader.Close()
    $conn.Close()
    Write-Host "Prueba ODBC finalizada con éxito."
} catch {
    Write-Host "ERROR ODBC 64-bit: $($_.Exception.Message)"
}
