[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csPath = "c:\lims-microlabs\scripts\QBInteractiveAuthorizer.cs"
if (Test-Path $csPath) {
    Add-Type -Path $csPath -ErrorAction SilentlyContinue
    [QBInteractiveAuthorizer]::StartWatcherThread()
}

try {
    Write-Host "Conectando con QBXMLRP2..."
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    $companyFile = "C:\quickbooks2010\alimentos10.QBW"
    
    $ticket = $null
    try {
        $ticket = $rp.BeginSession($companyFile, 2)
    } catch {
        try {
            $ticket = $rp.BeginSession("", 2)
        } catch {
            $ticket = $rp.BeginSession($companyFile, 0)
        }
    }
    
    [QBInteractiveAuthorizer]::StopWatcher()
    Write-Host "Sesion iniciada con exito en QuickBooks."

    # Consultar estimados modificados o fechados hoy
    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <MaxReturned>20</MaxReturned>
      <FromTxnDate>2026-09-23</FromTxnDate>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@

    $res = $rp.ProcessRequest($ticket, $query)
    $rp.EndSession($ticket)
    $rp.CloseConnection()

    [xml]$xml = $res
    $retList = $xml.QBXML.QBXMLMsgsRs.EstimateQueryRs.EstimateRet
    if ($retList) {
        Write-Host "ESTIMADOS DE HOY ENCONTRADOS EN QUICKBOOKS: $($retList.Count)"
        foreach ($e in $retList) {
            Write-Host "- Ref: $($e.RefNumber) | Fecha: $($e.TxnDate) | Cliente: $($e.CustomerRef.FullName) | Total: $($e.TotalAmount)"
        }
    } else {
        Write-Host "No se encontraron Estimados con TxnDate >= 2026-09-23 en QuickBooks."
    }

} catch {
    Write-Host "Error al consultar QuickBooks: $($_.Exception.Message)"
} finally {
    if ($ticket) {
        try { $rp.EndSession($ticket) } catch {}
        try { $rp.CloseConnection() } catch {}
    }
    [QBInteractiveAuthorizer]::StopWatcher()
}
