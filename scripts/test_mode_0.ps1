[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
$rp.OpenConnection2("MicrolabsLIMS", "Microlabs LIMS Integration", 1)
try {
    Write-Host "Intentando BeginSession('', 0)..."
    $ticket = $rp.BeginSession("", 0)
    Write-Host ">>> TICKET OBTENIDO CON EXITO: $ticket <<<"

    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <MaxReturned>5</MaxReturned>
      <FromTxnDate>2024-01-01</FromTxnDate>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $res = $rp.ProcessRequest($ticket, $query)
    Write-Host "Procesamiento exitoso. Longitud respuesta: $($res.Length) caracteres"
    [System.IO.File]::WriteAllText("c:\lims-microlabs\scripts\qb_test_2024.xml", $res, [System.Text.Encoding]::UTF8)
    $rp.EndSession($ticket)
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
$rp.CloseConnection()
