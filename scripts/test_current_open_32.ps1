[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "Probando conexion 32-bit con archivo actualmente abierto (cadena vacia)..." -ForegroundColor Cyan

$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
$rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
Write-Host "[OK] OpenConnection2 completado."

try {
    Write-Host "Llamando BeginSession('', 2)..."
    $ticket = $rp.BeginSession("", 2)
    Write-Host ">>> EXITO TOTAL! Ticket obtenido: $ticket" -ForegroundColor Green

    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <CompanyQueryRq requestID="1" />
  </QBXMLMsgsRq>
</QBXML>
"@
    $res = $rp.ProcessRequest($ticket, $query)
    $rp.EndSession($ticket)
    $rp.CloseConnection()

    [xml]$xml = $res
    $comp = $xml.QBXML.QBXMLMsgsRs.CompanyQueryRs.CompanyRet.CompanyName
    Write-Host "`n=======================================================" -ForegroundColor Green
    Write-Host "¡CONECTADO CON EXITO A LA BASE DE DATOS DE QUICKBOOKS!" -ForegroundColor Green
    Write-Host "Empresa activa: '$comp'" -ForegroundColor Green
    Write-Host "=======================================================" -ForegroundColor Green
} catch {
    Write-Host "`nError: $($_.Exception.Message)" -ForegroundColor Red
    $rp.CloseConnection()
}
