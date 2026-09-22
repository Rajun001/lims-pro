[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "Probando conexion con el nombre previamente autorizado 'MicrolabsExport'..." -ForegroundColor Cyan

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    Write-Host "[OK] OpenConnection2 completado con MicrolabsExport." -ForegroundColor Green

    Write-Host "Iniciando sesion con archivo abierto..." -ForegroundColor Yellow
    $ticket = $rp.BeginSession("", 2)
    Write-Host "[EXITO TOTAL] Sesion iniciada sin pedir autorizacion! Ticket: $ticket" -ForegroundColor Green

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
    $compName = $xml.QBXML.QBXMLMsgsRs.CompanyQueryRs.CompanyRet.CompanyName
    Write-Host "`n[CONECTADO A QUICKBOOKS]: '$compName'" -ForegroundColor Green
} catch {
    Write-Host "`n[ERROR DETECTADO]: $($_.Exception.Message)" -ForegroundColor Red
}
