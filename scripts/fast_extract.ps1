[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$logFile = "c:\lims-microlabs\scripts\fast_extract.log"
"Iniciando..." | Set-Content $logFile

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    "OpenConnection2 OK" | Add-Content $logFile

    $ticket = $rp.BeginSession("", 2)
    "Session OK: $ticket" | Add-Content $logFile

    # Consultar directamente estimaciones de Roldan Ajun Chaverri
    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <EntityFilter>
        <FullNameWithChildren>Roldan Ajún Chaverri</FullNameWithChildren>
      </EntityFilter>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    "Enviando consulta de Roldan Ajun Chaverri..." | Add-Content $logFile
    $resp = $rp.ProcessRequest($ticket, $query)
    "Respuesta recibida!" | Add-Content $logFile

    $rp.EndSession($ticket)
    $rp.CloseConnection()
    "Sesion cerrada." | Add-Content $logFile

    # Guardar respuesta
    $resp | Set-Content "C:\Users\HP LAB\Desktop\rach\estimaciones_roldan_raw.xml" -Encoding UTF8

    [xml]$xml = $resp
    $nodes = $xml.SelectNodes("//EstimateRet")
    "Total estimaciones encontradas: $($nodes.Count)" | Add-Content $logFile

    # Guardar estructurado
    $existing = Get-ChildItem -Path "C:\Users\HP LAB\Desktop\rach" -Filter "*.pdf" | Select-Object -ExpandProperty BaseName

    $results = @()
    foreach ($est in $nodes) {
        $lines = @()
        foreach ($l in $est.SelectNodes("EstimateLineRet")) {
            $lines += @{
                Item = $l.ItemRef.FullName
                Desc = $l.Desc
                Quantity = $l.Quantity
                Rate = $l.Rate
                Amount = $l.Amount
            }
        }
        $headerCustom = @{}
        foreach ($de in $est.SelectNodes("DataExtRet")) {
            $headerCustom[$de.DataExtName] = $de.DataExtValue
        }

        $results += @{
            TxnID = $est.TxnID
            RefNumber = $est.RefNumber
            TxnDate = $est.TxnDate
            Customer = $est.CustomerRef.FullName
            Template = $est.TemplateRef.FullName
            HeaderCustom = $headerCustom
            Lines = $lines
            AlreadyInPDF = ($existing -contains $est.RefNumber)
        }
    }

    $results | ConvertTo-Json -Depth 6 | Set-Content "C:\Users\HP LAB\Desktop\rach\reportes_roldan.json" -Encoding UTF8

    $faltan = ($results | Where-Object { -not $_.AlreadyInPDF }).Count
    "Ya en PDF: $($results.Count - $faltan)" | Add-Content $logFile
    "FALTAN: $faltan" | Add-Content $logFile

} catch {
    "ERROR: $($_.Exception.ToString())" | Add-Content $logFile
}
