[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csContent = Get-Content -Raw "c:\lims-microlabs\scripts\QBAuthHelper.cs"
Add-Type -TypeDefinition $csContent -Language CSharp

[QBAuthHelper]::StartWatcher()
Start-Sleep -Seconds 1

Write-Host "Iniciando prueba con BeginSession(C:\quickbooks2010\alimentos10.QBW, 2)..."

$rp = $null
$ticket = $null
try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    Write-Host "OpenConnection2 OK. Llamando a BeginSession..."
    
    $ticket = $rp.BeginSession("C:\quickbooks2010\alimentos10.QBW", 2)
    Write-Host ">>> EXITO TOTAL! TICKET OBTENIDO: $ticket <<<"

    $xmlReq = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <RefNumberFilter>
        <MatchCriterion>StartsWith</MatchCriterion>
        <RefNumber>131474</RefNumber>
      </RefNumberFilter>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@

    Write-Host "Enviando consulta de Estimado 131474..."
    $response = $rp.ProcessRequest($ticket, $xmlReq)
    $response | Out-File -FilePath "c:\lims-microlabs\scripts\estimate_131474_resp.xml" -Encoding UTF8
    Write-Host "Respuesta guardada con exito!"
    Write-Host $response

    $rp.EndSession($ticket)
    $rp.CloseConnection()
    Write-Host "Sesion finalizada correctamente."
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
} finally {
    Start-Sleep -Seconds 2
    [QBAuthHelper]::StopWatcher()
}
