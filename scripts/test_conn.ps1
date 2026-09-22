[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$logFile = "c:\lims-microlabs\scripts\test_conn.log"
$companyFile = "C:\quickbooks2010\alimentos10.QBW"

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    $ticket = $rp.BeginSession($companyFile, 2)
    "Conexion exitosa con $companyFile! Ticket: $ticket" | Set-Content $logFile
    Write-Host "Conexion exitosa con $companyFile! Ticket: $ticket"

    # Query 5 estimates
    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <MaxReturned>5</MaxReturned>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $resp = $rp.ProcessRequest($ticket, $query)
    $rp.EndSession($ticket)
    $rp.CloseConnection()

    [System.IO.File]::WriteAllText("c:\lims-microlabs\scripts\test_conn_out.xml", $resp, [System.Text.Encoding]::UTF8)
    Write-Host "Estimaciones obtenidas! Longitud: $($resp.Length)"
} catch {
    Write-Host "ERROR: $($_.Exception.ToString())"
    "ERROR: $($_.Exception.ToString())" | Set-Content $logFile
}
