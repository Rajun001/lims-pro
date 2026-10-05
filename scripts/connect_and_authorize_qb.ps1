[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csContent = Get-Content -Raw "c:\lims-microlabs\scripts\QBAuthHelper.cs"
Add-Type -TypeDefinition $csContent -Language CSharp

[QBAuthHelper]::StartWatcher()
Start-Sleep -Seconds 1

Write-Host "Intentando conectar con QuickBooks SDK COM (QBXMLRP2.RequestProcessor)..."

$rp = $null
$ticket = $null
try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    Write-Host "Objeto QBXMLRP2 creado exitosamente."

    Write-Host "Llamando a OpenConnection2..."
    $rp.OpenConnection2("MicrolabsLIMS", "Microlabs LIMS Integration", 1)
    Write-Host "OpenConnection2 completado."

    Write-Host "Llamando a BeginSession (aquí QuickBooks solicitará permisos si no está autorizado)..."
    $ticket = $rp.BeginSession("C:\quickbooks2010\alimentos10.QBW", 2)
    Write-Host "¡¡¡SESION INICIADA EXITOSAMENTE EN QUICKBOOKS!!! Ticket: $ticket"

    # Query estimate 131474 with all custom fields (OwnerID 0)
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

    Write-Host "Consultando estimado 131474 en QuickBooks..."
    $response = $rp.ProcessRequest($ticket, $xmlReq)
    Write-Host "Respuesta recibida de QuickBooks:"
    $response | Out-File -FilePath "c:\lims-microlabs\scripts\estimate_131474_resp.xml" -Encoding UTF8
    Write-Host "XML guardado en c:\lims-microlabs\scripts\estimate_131474_resp.xml"
    Write-Host ($response.Substring(0, [Math]::Min(1000, $response.Length)))

    $rp.EndSession($ticket)
    $rp.CloseConnection()
    Write-Host "Sesión finalizada ordenadamente."
} catch {
    Write-Host "ERROR DURANTE LA CONEXION: $($_.Exception.Message)"
    Write-Host "Detalles: $($_.Exception.ToString())"
} finally {
    Start-Sleep -Seconds 3
    [QBAuthHelper]::StopWatcher()
}
