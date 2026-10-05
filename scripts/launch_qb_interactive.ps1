$action = New-ScheduledTaskAction -Execute "C:\Program Files\Intuit\QuickBooks Enterprise Solutions 24.0\qbw.exe" -Argument '"C:\quickbooks2010\alimentos10.QBW"'
$principal = New-ScheduledTaskPrincipal -UserId "hp\hp" -LogonType Interactive
Register-ScheduledTask -TaskName "LaunchQB_Temp" -Action $action -Principal $principal -Force
Start-ScheduledTask -TaskName "LaunchQB_Temp"
Start-Sleep -Seconds 4
Unregister-ScheduledTask -TaskName "LaunchQB_Temp" -Confirm:$false
Get-Process -Name qbw* -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, WorkingSet64
