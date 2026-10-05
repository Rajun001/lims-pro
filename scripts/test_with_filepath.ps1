[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csPath = "c:\lims-microlabs\scripts\QBInteractiveAuthorizer.cs"
Add-Type -Path $csPath
[QBInteractiveAuthorizer]::StartWatcherThread()

try {
    Write-Host "Probando BeginSession con 'C:\quickbooks2010\alimentos10.QBW', 0..." -ForegroundColor Cyan
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    
    # 0 = qbFileOpenDoNotCare
    $ticket = $rp.BeginSession("C:\quickbooks2010\alimentos10.QBW", 0)
    Write-Host ">>> TICKET OBTENIDO: $ticket" -ForegroundColor Green

    [QBInteractiveAuthorizer]::StopWatcher()
    $rp.EndSession($ticket)
    $rp.CloseConnection()
} catch {
    [QBInteractiveAuthorizer]::StopWatcher()
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
