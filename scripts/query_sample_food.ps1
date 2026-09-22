[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$logFile = "c:\lims-microlabs\scripts\query_sample_food.log"
$xmlOut = "c:\lims-microlabs\scripts\sample_food_130650.xml"

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    $ticket = $rp.BeginSession("", 2)
    "Session OK: $ticket" | Set-Content $logFile

    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <RefNumberFilter>
        <MatchCriterion>StartsWith</MatchCriterion>
        <RefNumber>130650</RefNumber>
      </RefNumberFilter>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $resp = $rp.ProcessRequest($ticket, $query)
    $rp.EndSession($ticket)
    $rp.CloseConnection()

    [System.IO.File]::WriteAllText($xmlOut, $resp, [System.Text.Encoding]::UTF8)
    "OK: Guardado XML con longitud $($resp.Length)" | Add-Content $logFile
    Write-Host "EXITO! Longitud: $($resp.Length)"
} catch {
    "ERROR: $($_.Exception.ToString())" | Set-Content $logFile
    Write-Host "ERROR: $($_.Exception.Message)"
}
