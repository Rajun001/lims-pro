[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$logFile = "c:\lims-microlabs\scripts\roldan_estimates.log"
$xmlOut = "c:\lims-microlabs\scripts\roldan_estimates_raw.xml"

"Iniciando consulta de estimates para Roldan Ajun Chaverri..." | Set-Content $logFile

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    $ticket = $rp.BeginSession("", 2)
    "Session iniciada: $ticket" | Add-Content $logFile

    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <EntityFilter>
        <ListID>32E0001-1211213258</ListID>
      </EntityFilter>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    "Enviando consulta..." | Add-Content $logFile
    $resp = $rp.ProcessRequest($ticket, $query)
    "Respuesta recibida (longitud: $($resp.Length))" | Add-Content $logFile
    
    [System.IO.File]::WriteAllText($xmlOut, $resp, [System.Text.Encoding]::UTF8)
    "XML guardado en $xmlOut" | Add-Content $logFile

    $rp.EndSession($ticket)
    $rp.CloseConnection()
    "FIN EXITOSO" | Add-Content $logFile
} catch {
    "ERROR: $($_.Exception.ToString())" | Add-Content $logFile
}
