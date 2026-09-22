[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
    Write-Host "Iniciando conector 64-bit nativo con 'MicrolabsExport'..." -ForegroundColor Cyan
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    Write-Host "[OK] Objeto COM 64-bit instanciado." -ForegroundColor Green
    
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    Write-Host "[OK] OpenConnection2 completado." -ForegroundColor Green
    
    $ticket = $rp.BeginSession("", 2)
    Write-Host "[EXITO TOTAL] Sesion 64-bit iniciada! Ticket: $ticket" -ForegroundColor Green

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
    Write-Host "`n[CONEXION ACTIVA CON QUICKBOOKS]: Empresa '$compName'" -ForegroundColor Green
} catch {
    Write-Host "`n[ERROR]: $($_.Exception.Message)" -ForegroundColor Red
}
