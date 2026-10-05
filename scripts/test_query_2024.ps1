[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csPath = "c:\lims-microlabs\scripts\QBInteractiveAuthorizer.cs"
if (Test-Path $csPath) {
    Add-Type -Path $csPath -ErrorAction SilentlyContinue
    [QBInteractiveAuthorizer]::StartWatcherThread()
}

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    $companyFile = "C:\quickbooks2010\alimentos10.QBW"
    $ticket = $rp.BeginSession($companyFile, 2)
    [QBInteractiveAuthorizer]::StopWatcher()

    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <MaxReturned>10</MaxReturned>
      <FromTxnDate>2024-01-01</FromTxnDate>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@

    Write-Host "Enviando EstimateQueryRq con FromTxnDate 2024-01-01..."
    $res = $rp.ProcessRequest($ticket, $query)
    $rp.EndSession($ticket)
    $rp.CloseConnection()

    [System.IO.File]::WriteAllText("c:\lims-microlabs\scripts\qb_sample_2024.xml", $res, [System.Text.Encoding]::UTF8)
    Write-Host "Respuesta guardada con exito en c:\lims-microlabs\scripts\qb_sample_2024.xml"
} catch {
    [QBInteractiveAuthorizer]::StopWatcher()
    Write-Host "ERROR: $($_.Exception.Message)"
}
