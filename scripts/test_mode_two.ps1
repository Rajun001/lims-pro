[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csPath = "c:\lims-microlabs\scripts\QBInteractiveAuthorizer.cs"
Add-Type -Path $csPath
[QBInteractiveAuthorizer]::StartWatcherThread()

try {
    Write-Host "Iniciando conector 64-bit nativo con BeginSession('', 2) [MultiUser]..." -ForegroundColor Cyan
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    Write-Host "[OK] OpenConnection2 completado." -ForegroundColor Green
    
    $ticket = $rp.BeginSession("", 2)
    Write-Host "[EXITO TOTAL] Sesion iniciada! Ticket: $ticket" -ForegroundColor Green

    [QBInteractiveAuthorizer]::StopWatcher()

    $query = '<?xml version="1.0" encoding="utf-8"?><?qbxml version="13.0"?><QBXML><QBXMLMsgsRq onError="continueOnError"><CompanyQueryRq requestID="1" /></QBXMLMsgsRq></QBXML>'
    $res = $rp.ProcessRequest($ticket, $query)
    $rp.EndSession($ticket)
    $rp.CloseConnection()

    [xml]$xml = $res
    $compName = $xml.QBXML.QBXMLMsgsRs.CompanyQueryRs.CompanyRet.CompanyName
    Write-Host "`n>>> [CONEXION ACTIVA CON QUICKBOOKS]: Empresa '$compName'" -ForegroundColor Green
} catch {
    [QBInteractiveAuthorizer]::StopWatcher()
    Write-Host "`n[ERROR]: $($_.Exception.Message)" -ForegroundColor Red
}
