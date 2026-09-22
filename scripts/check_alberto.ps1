[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$logFile = "c:\lims-microlabs\scripts\check_alberto.log"
try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    $ticket = $rp.BeginSession("", 2)

    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <EntityFilter>
        <ListID>800013AF-1616875149</ListID>
      </EntityFilter>
      <IncludeLineItems>false</IncludeLineItems>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $resp = $rp.ProcessRequest($ticket, $query)
    $rp.EndSession($ticket)
    $rp.CloseConnection()
    
    [xml]$xml = $resp
    $nodes = $xml.SelectNodes("//EstimateRet")
    "Total estimaciones para Roldan Alberto: $($nodes.Count)" | Set-Content $logFile
} catch {
    "ERROR: $($_.Exception.ToString())" | Set-Content $logFile
}
