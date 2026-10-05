[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csPath = "c:\lims-microlabs\scripts\QBInteractiveAuthorizer.cs"
Add-Type -Path $csPath
[QBInteractiveAuthorizer]::StartWatcherThread()

Start-Sleep -Milliseconds 300

try {
    Write-Host "Probando con conexion OpenConnection2 y BeginSession('', 0)..." -ForegroundColor Cyan
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    Write-Host "[OK] OpenConnection2 completado." -ForegroundColor Green

    # Probar modos de apertura: 0 = qbFileOpenDoNotCare
    Write-Host "Llamando BeginSession('', 0)..."
    $ticket = $rp.BeginSession("", 0)
    Write-Host "`n>>> [EXITO ROTUNDO EN MODO 0] TICKET OBTENIDO: $ticket" -ForegroundColor Green

    [QBInteractiveAuthorizer]::StopWatcher()

    $query = '<?xml version="1.0" encoding="utf-8"?><?qbxml version="13.0"?><QBXML><QBXMLMsgsRq onError="continueOnError"><CompanyQueryRq requestID="1" /></QBXMLMsgsRq></QBXML>'
    $res = $rp.ProcessRequest($ticket, $query)
    $rp.EndSession($ticket)
    $rp.CloseConnection()

    [xml]$xml = $res
    $comp = $xml.QBXML.QBXMLMsgsRs.CompanyQueryRs.CompanyRet.CompanyName
    Write-Host "`n>>> [EMPRESA VINCULADA EXITOSAMENTE]: '$comp'" -ForegroundColor Green
} catch {
    [QBInteractiveAuthorizer]::StopWatcher()
    Write-Host "Error con Modo 0: $($_.Exception.Message)" -ForegroundColor Red
}
