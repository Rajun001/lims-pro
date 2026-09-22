[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    $ticket = $rp.BeginSession("", 2)
    Write-Host "Sesion OK: $ticket"

    $custQuery = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <CustomerQueryRq requestID="1">
      <NameFilter>
        <MatchCriterion>Contains</MatchCriterion>
        <Name>Roldan</Name>
      </NameFilter>
    </CustomerQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $resp = $rp.ProcessRequest($ticket, $custQuery)
    Write-Host "Respuesta:"
    Write-Host $resp

    $rp.EndSession($ticket)
    $rp.CloseConnection()
} catch {
    Write-Host "Error: $($_.Exception.ToString())"
}
