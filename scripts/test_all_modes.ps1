[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
$rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)

$modes = @(
    @{ Name = "Cadena vacia, Modo 0 (DoNotCare)"; File = ""; Mode = 0 },
    @{ Name = "Cadena vacia, Modo 1 (SingleUser)"; File = ""; Mode = 1 },
    @{ Name = "Cadena vacia, Modo 2 (MultiUser)"; File = ""; Mode = 2 },
    @{ Name = "Archivo exacto, Modo 0 (DoNotCare)"; File = "C:\quickbooks2010\alimentos10.QBW"; Mode = 0 },
    @{ Name = "Archivo exacto, Modo 1 (SingleUser)"; File = "C:\quickbooks2010\alimentos10.QBW"; Mode = 1 },
    @{ Name = "Archivo exacto, Modo 2 (MultiUser)"; File = "C:\quickbooks2010\alimentos10.QBW"; Mode = 2 }
)

foreach ($m in $modes) {
    Write-Host "Probando $($m.Name)..."
    try {
        $ticket = $rp.BeginSession($m.File, $m.Mode)
        Write-Host ">>> EXITO TOTAL! Ticket: $ticket" -ForegroundColor Green
        $rp.EndSession($ticket)
        break
    } catch {
        Write-Host "    Fallo: $($_.Exception.Message)" -ForegroundColor Red
    }
}

$rp.CloseConnection()
