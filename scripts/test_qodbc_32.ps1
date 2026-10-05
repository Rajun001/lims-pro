[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Probando conexión ODBC 32-bit con 'QuickBooks Data'..."
try {
    $conn = New-Object System.Data.Odbc.OdbcConnection
    $conn.ConnectionString = "DSN=QuickBooks Data;"
    $conn.Open()
    Write-Host ">>> CONEXION ODBC 32-BIT ABIERTA CON EXITO! <<<" -ForegroundColor Green

    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT TOP 3 TxnDate, RefNumber, CustomerRefFullName FROM Estimate WHERE TxnDate >= {d'2024-01-01'} ORDER BY TxnDate DESC"
    $reader = $cmd.ExecuteReader()

    while ($reader.Read()) {
        Write-Host "Estimate: $($reader['RefNumber']) | Fecha: $($reader['TxnDate']) | Cliente: $($reader['CustomerRefFullName'])"
    }
    $reader.Close()
    $conn.Close()
    Write-Host "Prueba ODBC 32-bit finalizada con éxito."
} catch {
    Write-Host "ERROR ODBC 32-bit: $($_.Exception.Message)"
}
