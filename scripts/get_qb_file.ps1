$proc = Get-Process -Name QBW -ErrorAction SilentlyContinue
if (-not $proc) {
    Write-Host "QBW not running"
    exit
}

Write-Host "QBW Process Id: $($proc.Id)"
Write-Host "Main Window Title: $($proc.MainWindowTitle)"
Write-Host "Main Window Handle: $($proc.MainWindowHandle)"

# Let's check command line
$wmi = Get-CimInstance Win32_Process -Filter "ProcessId = $($proc.Id)"
Write-Host "CommandLine: $($wmi.CommandLine)"

# Check recently opened .qbw files in registry
$mru = Get-ItemProperty -Path "HKCU:\Software\Intuit\QuickBooks\Recent File List\Default" -ErrorAction SilentlyContinue
if ($mru) {
    Write-Host "Recent Files from HKCU:"
    $mru.PSObject.Properties | Where-Object { $_.Name -match "File\d" } | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Value)"
    }
}
