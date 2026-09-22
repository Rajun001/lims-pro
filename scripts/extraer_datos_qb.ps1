[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  MICROLABS - EXTRACCION DE REPORTES DE QUICKBOOKS" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Conectando con QuickBooks Desktop..." -ForegroundColor Yellow

$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
$rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)

$ticket = $null
$maxAttempts = 30
$attempt = 1

while ($attempt -le $maxAttempts -and [string]::IsNullOrEmpty($ticket)) {
    try {
        Write-Host "Intentando iniciar sesión con QuickBooks (intento $attempt de $maxAttempts)..." -ForegroundColor Yellow
        $ticket = $rp.BeginSession("", 2)
        Write-Host "[EXITO] Conexión establecida con QuickBooks! Ticket: $ticket" -ForegroundColor Green
        break
    } catch {
        $msg = $_.Exception.Message
        if ($msg -like "*modal dialog*") {
            Write-Host "Esperando: Hay un cuadro de diálogo abierto en QuickBooks. Por favor cierre cualquier ventana o haga clic en Window -> Close All... ($attempt/$maxAttempts)" -ForegroundColor Magenta
        } else {
            Write-Host "Aviso: $msg ($attempt/$maxAttempts)" -ForegroundColor Gray
        }
        Start-Sleep -Seconds 2
        $attempt++
    }
}

if ([string]::IsNullOrEmpty($ticket)) {
    Write-Host "`n[ERROR FINAL]: No se pudo conectar tras $maxAttempts intentos." -ForegroundColor Red
    $rp.CloseConnection()
    exit 1
}

# Consultar todas las estimaciones
Write-Host "`nBuscando todas las estimaciones en la base de datos..." -ForegroundColor Yellow
$estQuery = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@

$response = $rp.ProcessRequest($ticket, $estQuery)
$rp.EndSession($ticket)
$rp.CloseConnection()

Write-Host "[OK] Datos recibidos de QuickBooks. Procesando..." -ForegroundColor Green

[xml]$xml = $response
$allEstimates = $xml.SelectNodes("//EstimateRet")
Write-Host "Total de estimaciones encontradas en QuickBooks: $($allEstimates.Count)" -ForegroundColor Cyan

# Guardar XML crudo para respaldo
$xmlPath = "C:\Users\HP LAB\Desktop\rach\quickbooks_estimates_dump.xml"
$xml.Save($xmlPath)
Write-Host "Copia de respaldo guardada en: $xmlPath" -ForegroundColor Gray

# Filtrar estimaciones de Roldan Ajún Chaverri
$rachList = @()
foreach ($est in $allEstimates) {
    $customer = $est.CustomerRef.FullName
    if ($customer -like "*Roldan*" -or $customer -like "*Ajun*" -or $customer -like "*Ajún*" -or $customer -like "*Chaverri*") {
        $rachList += $est
    }
}

Write-Host "`nTotal de reportes/estimaciones de Roldan Ajun Chaverri: $($rachList.Count)" -ForegroundColor Green

# Revisar cuáles ya existen en la carpeta rach
$rachDir = "C:\Users\HP LAB\Desktop\rach"
$existingFiles = Get-ChildItem -Path $rachDir -Filter "*.pdf" | Select-Object -ExpandProperty BaseName

$missingList = @()
$foundList = @()

foreach ($item in $rachList) {
    $code = $item.RefNumber
    if ($existingFiles -contains $code) {
        $foundList += $code
    } else {
        $missingList += $item
    }
}

Write-Host "Reportes ya guardados en PDF: $($foundList.Count)" -ForegroundColor Cyan
Write-Host "Reportes FALTANTES por recopilar: $($missingList.Count)" -ForegroundColor Yellow

if ($missingList.Count -gt 0) {
    Write-Host "`nListado de reportes faltantes:" -ForegroundColor Yellow
    foreach ($m in $missingList) {
        Write-Host " - Codigo: $($m.RefNumber) | Fecha: $($m.TxnDate) | Plantilla: $($m.TemplateRef.FullName)"
    }
} else {
    Write-Host "`n¡Todos los reportes de Roldan Ajun Chaverri ya están recopilados en rach!" -ForegroundColor Green
}

# Guardar lista estructurada en JSON
$exportData = @()
foreach ($est in $rachList) {
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
    $dataExt = @{}
    foreach ($d in $est.SelectNodes("DataExtRet")) {
        $dataExt[$d.DataExtName] = $d.DataExtValue
    }
    $exportData += @{
        TxnID = $est.TxnID
        RefNumber = $est.RefNumber
        TxnDate = $est.TxnDate
        Customer = $est.CustomerRef.FullName
        Template = $est.TemplateRef.FullName
        DataExt = $dataExt
        Lines = $lines
        AlreadyInPDF = ($existingFiles -contains $est.RefNumber)
    }
}

$jsonPath = "C:\Users\HP LAB\Desktop\rach\reportes_rach_datos.json"
$exportData | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Host "`n[OK] Base de datos de reportes exportada a: $jsonPath" -ForegroundColor Green
