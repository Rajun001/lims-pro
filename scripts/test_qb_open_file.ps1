[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csPath = "c:\lims-microlabs\scripts\QBInteractiveAuthorizer.cs"
if (Test-Path $csPath) {
    Add-Type -Path $csPath -ErrorAction SilentlyContinue
    [QBInteractiveAuthorizer]::StartWatcherThread()
}

try {
    Write-Host "Iniciando RequestProcessor..."
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    Write-Host "OpenConnection2 OK. Probando BeginSession con cadena vacia..."
    
    $ticket = ""
    try {
        $ticket = $rp.BeginSession("", 2)
        Write-Host "BeginSession('', 2) EXITO! Ticket: $ticket"
    } catch {
        Write-Host "Fallo ('', 2): $($_.Exception.Message). Probando ('', 0)..."
        try {
            $ticket = $rp.BeginSession("", 0)
            Write-Host "BeginSession('', 0) EXITO! Ticket: $ticket"
        } catch {
            Write-Host "Fallo ('', 0): $($_.Exception.Message). Probando con archivo exacto..."
            $ticket = $rp.BeginSession("C:\quickbooks2010\alimentos10.QBW", 0)
            Write-Host "BeginSession(alimentos10, 0) EXITO! Ticket: $ticket"
        }
    }

    [QBInteractiveAuthorizer]::StopWatcher()

    if ($ticket) {
        $query = @"
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
        Write-Host "Ejecutando EstimateQueryRq para 131474..."
        $resp = $rp.ProcessRequest($ticket, $query)
        Write-Host "Respuesta recibida! Longitud: $($resp.Length)"
        [System.IO.File]::WriteAllText("c:\lims-microlabs\scripts\qb_131474_result.xml", $resp, [System.Text.Encoding]::UTF8)
        
        $rp.EndSession($ticket)
        $rp.CloseConnection()
        Write-Host "FINALIZADO CON EXITO!"
    }
} catch {
    [QBInteractiveAuthorizer]::StopWatcher()
    Write-Host "ERROR GENERAL: $($_.Exception.ToString())"
}
