Unregister-ScheduledTask -TaskName 'CleanHostTask' -Confirm:$false -ErrorAction SilentlyContinue
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File C:\lims-microlabs\scripts\clean_host_for_activation.ps1'
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date)
$principal = New-ScheduledTaskPrincipal -UserId 'NT AUTHORITY\SYSTEM' -RunLevel Highest
Register-ScheduledTask -TaskName 'CleanHostTask' -Action $action -Trigger $trigger -Principal $principal -Force
schtasks /run /tn "CleanHostTask"
