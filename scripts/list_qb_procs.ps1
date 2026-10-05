Get-CimInstance Win32_Process | Where-Object { 
    $_.ExecutablePath -like '*intuit*' -or 
    $_.ExecutablePath -like '*quickbooks*' -or 
    $_.Name -like '*qb*' 
} | Select-Object ProcessId, Name, ExecutablePath | Format-Table -AutoSize
