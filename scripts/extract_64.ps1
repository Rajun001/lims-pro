[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try {
    Write-Host "Iniciando conector 64-bit nativo..."
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    Write-Host "[OK] COM 64-bit creado."
    
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    Write-Host "[OK] OpenConnection2 completado."
    
    $ticket = $rp.BeginSession("", 2)
    Write-Host "[EXITO TOTAL] Sesion 64-bit iniciada! Ticket: $ticket" -ForegroundColor Green

    # Buscar cliente Roldan
    Write-Host "Buscando cliente 'Roldan'..."
    $custQuery = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <CustomerQueryRq requestID="1">
      <NameFilter>
        <MatchCriterion>Contains</MatchCriterion>
        <Name>Roldan</Name>
      </NameFilter>
    </CustomerQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $custResp = $rp.ProcessRequest($ticket, $custQuery)
    [xml]$custXml = $custResp
    $customers = $custXml.SelectNodes("//CustomerRet")
    Write-Host "Clientes encontrados: $($customers.Count)"

    $targetList = @()
    foreach ($c in $customers) {
        Write-Host " - $($c.FullName) (ListID: $($c.ListID))"
        $targetList += $c.ListID
    }

    # Si no encuentra con Roldan, buscar con Ajun
    if ($customers.Count -eq 0) {
        Write-Host "Buscando cliente 'Ajun'..."
        $custQuery2 = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <CustomerQueryRq requestID="2">
      <NameFilter>
        <MatchCriterion>Contains</MatchCriterion>
        <Name>Ajun</Name>
      </NameFilter>
    </CustomerQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
        $custResp2 = $rp.ProcessRequest($ticket, $custQuery2)
        [xml]$custXml2 = $custResp2
        $customers2 = $custXml2.SelectNodes("//CustomerRet")
        foreach ($c in $customers2) {
            Write-Host " - $($c.FullName) (ListID: $($c.ListID))"
            $targetList += $c.ListID
        }
    }

    # Consultar estimaciones
    $allEstimates = @()
    foreach ($custId in $targetList) {
        Write-Host "Consultando estimaciones para ListID $custId..."
        $estQuery = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="10">
      <EntityFilter>
        <ListID>$custId</ListID>
      </EntityFilter>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
        $estResp = $rp.ProcessRequest($ticket, $estQuery)
        [xml]$estXml = $estResp
        $nodes = $estXml.SelectNodes("//EstimateRet")
        if ($nodes) {
            Write-Host "Encontradas $($nodes.Count) estimaciones para este cliente."
            $allEstimates += $nodes
        }
    }

    $rp.EndSession($ticket)
    $rp.CloseConnection()
    Write-Host "[OK] Sesion cerrada."

    # Guardar en archivo JSON
    $export = @()
    $rachDir = "C:\Users\HP LAB\Desktop\rach"
    $existing = Get-ChildItem -Path $rachDir -Filter "*.pdf" | Select-Object -ExpandProperty BaseName

    foreach ($est in $allEstimates) {
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

        $export += @{
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

    $jsonOut = "C:\Users\HP LAB\Desktop\rach\estimaciones_rach_detalles.json"
    $export | ConvertTo-Json -Depth 6 | Set-Content -Path $jsonOut -Encoding UTF8
    Write-Host "LISTO: Guardados $($export.Count) reportes en: $jsonOut"

    $faltan = ($export | Where-Object { -not $_.AlreadyInPDF }).Count
    Write-Host "Reportes que ya estaban en rach: $($export.Count - $faltan)"
    Write-Host "Reportes NUEVOS que faltan por exportar: $faltan"

} catch {
    Write-Host "ERROR: $($_.Exception.ToString())"
}
