[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csPath = "c:\lims-microlabs\scripts\QBInteractiveAuthorizer.cs"
Add-Type -Path $csPath

Write-Host "Iniciando proceso de autorizacion automatica y conexion..." -ForegroundColor Cyan
[QBInteractiveAuthorizer]::StartWatcherThread()

Start-Sleep -Milliseconds 500

try {
    Write-Host "Conectando mediante QBXMLRP2 (64-bit nativo)..."
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    Write-Host "[OK] OpenConnection2 completado." -ForegroundColor Green

    $companyFile = "C:\quickbooks2010\alimentos10.QBW"
    Write-Host "Llamando BeginSession con $companyFile..."
    $ticket = $rp.BeginSession($companyFile, 2)
    Write-Host "SESION INICIADA: $ticket" -ForegroundColor Green

    [QBInteractiveAuthorizer]::StopWatcher()

    Write-Host "Consultando informacion de la empresa..." -ForegroundColor Yellow
    $query = '<?xml version="1.0" encoding="utf-8"?><?qbxml version="13.0"?><QBXML><QBXMLMsgsRq onError="continueOnError"><CompanyQueryRq requestID="1" /></QBXMLMsgsRq></QBXML>'

    $res = $rp.ProcessRequest($ticket, $query)
    $rp.EndSession($ticket)
    $rp.CloseConnection()

    [xml]$xml = $res
    $comp = $xml.QBXML.QBXMLMsgsRs.CompanyQueryRs.CompanyRet.CompanyName
    Write-Host "EMPRESA ENLACE CONFIRMADO: $comp" -ForegroundColor Green
} catch {
    [QBInteractiveAuthorizer]::StopWatcher()
    $err = $_.Exception.Message
    Write-Host "ERROR EN CONEXION: $err" -ForegroundColor Red
}
