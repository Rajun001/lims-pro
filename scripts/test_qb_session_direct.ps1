$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
$rp.OpenConnection2("MicrolabsLIMS", "Microlabs LIMS Integration", 1)
try {
    $ticket = $rp.BeginSession("", 2)
    Write-Host "TICKET_OK: $ticket"
    $rp.EndSession($ticket)
} catch {
    Write-Host "BEGIN_SESSION_ERR: $($_.Exception.Message)"
}
$rp.CloseConnection()
