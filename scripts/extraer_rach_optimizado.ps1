[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "Iniciando conector optimizado con QuickBooks..." -ForegroundColor Cyan

$companyFile = "C:\quickbooks2010\alimentos10.QBW"
$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
$rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)

try {
    Write-Host "Llamando BeginSession con $companyFile..."
    $ticket = $rp.BeginSession($companyFile, 2)
    Write-Host "[EXITO] Sesion iniciada. Ticket: $ticket" -ForegroundColor Green
    
    # 1. Buscar clientes con nombre similar a Roldan / Ajun / Chaverri
    Write-Host "Buscando cliente 'Roldan'..." -ForegroundColor Yellow
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
    Write-Host "Clientes encontrados con 'Roldan': $($customers.Count)"
    
    $targetCustomerList = @()
    foreach ($c in $customers) {
        Write-Host " - ListID: $($c.ListID) | Nombre: $($c.FullName)"
        $targetCustomerList += $c.ListID
    }
    
    if ($customers.Count -eq 0) {
        Write-Host "Buscando por 'Ajun'..."
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
            Write-Host " - ListID: $($c.ListID) | Nombre: $($c.FullName)"
            $targetCustomerList += $c.ListID
        }
    }

    # 2. Consultar estimaciones para estos clientes específicos
    Write-Host "`nConsultando estimaciones para el cliente..." -ForegroundColor Yellow
    $allEstimates = @()
    
    foreach ($custId in $targetCustomerList) {
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

    Write-Host "Total estimaciones encontradas para Roldan Ajun Chaverri: $($allEstimates.Count)" -ForegroundColor Green

    # Comparar con rach
    $rachDir = "C:\Users\HP LAB\Desktop\rach"
    $existing = Get-ChildItem -Path $rachDir -Filter "*.pdf" | Select-Object -ExpandProperty BaseName

    $missing = @()
    $present = @()

    foreach ($est in $allEstimates) {
        $ref = $est.RefNumber
        if ($existing -contains $ref) {
            $present += $ref
        } else {
            $missing += $est
        }
    }

    Write-Host "Ya en PDF: $($present.Count)" -ForegroundColor Cyan
    Write-Host "Faltantes: $($missing.Count)" -ForegroundColor Yellow

    # Guardar en JSON
    $export = @()
    foreach ($est in $allEstimates) {
        $lines = @()
        foreach ($l in $est.SelectNodes("EstimateLineRet")) {
            $lines += @{
                Item = $l.ItemRef.FullName
                Desc = $l.Desc
                Quantity = $l.Quantity
                Rate = $l.Rate
                Amount = $l.Amount
                CustomFields = @{}
            }
            foreach ($le in $l.SelectNodes("DataExtRet")) {
                $lines[-1].CustomFields[$le.DataExtName] = $le.DataExtValue
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
    Write-Host "Detalles guardados en: $jsonOut" -ForegroundColor Green

} catch {
    Write-Host "ERROR: $($_.Exception.ToString())" -ForegroundColor Red
}
