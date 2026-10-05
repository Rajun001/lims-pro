[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$logFile = "c:\lims-microlabs\scripts\test_estimate_query.log"
$xmlOut = "c:\lims-microlabs\scripts\recent_estimates.xml"

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsLIMS", "Microlabs LIMS Pro", 1)
    $ticket = $rp.BeginSession("", 2)
    Write-Host "Sesion iniciada: $ticket"

    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <MaxReturned>10</MaxReturned>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $resp = $rp.ProcessRequest($ticket, $query)
    Write-Host "Respuesta recibida: $($resp.Length) caracteres"
    [System.IO.File]::WriteAllText($xmlOut, $resp, [System.Text.Encoding]::UTF8)

    $rp.EndSession($ticket)
    $rp.CloseConnection()
    Write-Host "SUCCESS"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
}
