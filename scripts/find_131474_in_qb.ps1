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

    # 1. Buscar en Estimates por RefNumber 131474
    $queryEst = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <RefNumberFilter>
        <MatchCriterion>Contains</MatchCriterion>
        <RefNumber>131474</RefNumber>
      </RefNumberFilter>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@

    Write-Host "Consultando Estimate 131474 en QuickBooks..."
    $resEst = $rp.ProcessRequest($ticket, $queryEst)
    [System.IO.File]::WriteAllText("c:\lims-microlabs\scripts\qb_131474_est.xml", $resEst, [System.Text.Encoding]::UTF8)

    # 2. Buscar en Invoices por RefNumber 131474 si no es un estimate
    $queryInv = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <InvoiceQueryRq requestID="2">
      <RefNumberFilter>
        <MatchCriterion>Contains</MatchCriterion>
        <RefNumber>131474</RefNumber>
      </RefNumberFilter>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </InvoiceQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    Write-Host "Consultando Invoice 131474 en QuickBooks..."
    $resInv = $rp.ProcessRequest($ticket, $queryInv)
    [System.IO.File]::WriteAllText("c:\lims-microlabs\scripts\qb_131474_inv.xml", $resInv, [System.Text.Encoding]::UTF8)

    $rp.EndSession($ticket)
    $rp.CloseConnection()
    Write-Host "BUSQUEDA EN QB COMPLETADA"
} catch {
    [QBInteractiveAuthorizer]::StopWatcher()
    Write-Host "ERROR: $($_.Exception.Message)"
}
