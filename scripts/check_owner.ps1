$qbw = Get-CimInstance Win32_Process -Filter "ProcessId = 20280"
$qOwner = Invoke-CimMethod -InputObject $qbw -MethodName GetOwner
Write-Host "QBW Owner: $($qOwner.Domain)\$($qOwner.User)"

$curr = Get-CimInstance Win32_Process -Filter "ProcessId = $([System.Diagnostics.Process]::GetCurrentProcess().Id)"
$cOwner = Invoke-CimMethod -InputObject $curr -MethodName GetOwner
Write-Host "Current Owner: $($cOwner.Domain)\$($cOwner.User)"
