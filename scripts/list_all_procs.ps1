Get-Process | ForEach-Object {
    if ($_.ProcessName -match "qb|quick|intuit|maui") {
        Write-Host "PID: $($_.Id) | Name: $($_.ProcessName) | Title: $($_.MainWindowTitle) | Session: $($_.SessionId)"
    }
}
