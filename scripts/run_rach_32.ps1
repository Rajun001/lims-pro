[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "Iniciando conector 32-bit para Roldan Ajun Chaverri..." -ForegroundColor Cyan

$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
$rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)

try {
    Write-Host "Iniciando sesion en QB..."
    $ticket = $rp.BeginSession("", 2)
    Write-Host "[OK] Ticket obtenido: $ticket" -ForegroundColor Green

    # 1. Buscar el cliente
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
    Write-Host "Clientes encontrados con 'Roldan': $($customers.Count)"

    $targetList = @()
    foreach ($c in $customers) {
        Write-Host " - $($c.FullName) (ListID: $($c.ListID))"
        $targetList += $c.ListID
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
            Write-Host " - $($c.FullName) (ListID: $($c.ListID))"
            $targetList += $c.ListID
        }
    }

    # 2. Consultar estimaciones para este cliente
    $allEstimates = @()
    foreach ($custId in $targetList) {
        Write-Host "Consultando estimaciones para cliente ID: $custId..."
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
            Write-Host "Estimaciones obtenidas: $($nodes.Count)"
            $allEstimates += $nodes
        }
    }

    $rp.EndSession($ticket)
    $rp.CloseConnection()
    Write-Host "[OK] Sesion cerrada."

    Write-Host "TOTAL estimaciones encontradas: $($allEstimates.Count)" -ForegroundColor Green

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
    Write-Host "Guardado exitoso en: $jsonOut" -ForegroundColor Green

    $faltan = ($export | Where-Object { -not $_.AlreadyInPDF }).Count
    Write-Host "Ya existen en PDF: $($export.Count - $faltan)" -ForegroundColor Cyan
    Write-Host "FALTANTES por exportar: $faltan" -ForegroundColor Yellow

} catch {
    Write-Host "ERROR: $($_.Exception.ToString())" -ForegroundColor Red
}
