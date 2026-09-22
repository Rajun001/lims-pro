[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Iniciando prueba con conector nativo oficial Intuit SDK..." -ForegroundColor Yellow

$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
Write-Host "Llamando OpenConnection2..." -ForegroundColor Yellow
$rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
Write-Host "[OK] OpenConnection2 exitoso." -ForegroundColor Green

Write-Host "Llamando BeginSession con archivo actualmente abierto (cadena vacia)..." -ForegroundColor Yellow
try {
    # 0 = qbFileOpenDoNotCare
    $ticket = $rp.BeginSession("C:\quickbooks2010\alimentos10.QBW", 0)
    Write-Host "[EXITO TOTAL] Sesion obtenida! Ticket: $ticket" -ForegroundColor Green

    Write-Host "`nConsultando primeros 5 clientes de la base de datos logica..." -ForegroundColor Yellow
    $xmlQuery = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <CustomerQueryRq requestID="1">
      <MaxReturned>5</MaxReturned>
    </CustomerQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $resp = $rp.ProcessRequest($ticket, $xmlQuery)
    $rp.EndSession($ticket)
    $rp.CloseConnection()

    [xml]$xml = $resp
    $customers = $xml.SelectNodes("//CustomerRet")
    Write-Host "`n[DATOS OBTENIDOS DE QUICKBOOKS]:" -ForegroundColor Green
    foreach ($c in $customers) {
        Write-Host " - ListID: $($c.ListID) | Nombre: $($c.FullName) | Saldo: $($c.TotalBalance)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    try { $rp.CloseConnection() } catch {}
}
