$p = Get-Process -Name QBW -ErrorAction SilentlyContinue
if ($p) {
    Write-Host "QBW Process ID: $($p.Id)"
    Write-Host "Responding: $($p.Responding)"
    Write-Host "Main Window Title: '$($p.MainWindowTitle)'"
    Write-Host "Session ID: $($p.SessionId)"
    Write-Host "Working Set (Memory): $([math]::Round($p.WorkingSet64 / 1MB, 2)) MB"
} else {
    Write-Host "QBW is NOT running."
}
