[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$logFile = "c:\lims-microlabs\scripts\find_client.log"
"Iniciando..." | Set-Content $logFile

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    $ticket = $rp.BeginSession("", 2)
    "Session OK: $ticket" | Add-Content $logFile

    $query = @"
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
    $resp = $rp.ProcessRequest($ticket, $query)
    "Respuesta Roldan:" | Add-Content $logFile
    $resp | Add-Content $logFile

    $query2 = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="1.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <CustomerQueryRq requestID="2">
      <NameFilter>
        <MatchCriterion>Contains</MatchCriterion>
        <Name>Ajun</Name>
      </NameFilter>
    </CustomerQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $resp2 = $rp.ProcessRequest($ticket, $query2)
    "Respuesta Ajun:" | Add-Content $logFile
    $resp2 | Add-Content $logFile

    $rp.EndSession($ticket)
    $rp.CloseConnection()
    "FIN" | Add-Content $logFile
} catch {
    "ERROR: $($_.Exception.ToString())" | Add-Content $logFile
}
