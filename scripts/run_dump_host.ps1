$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File C:\lims-microlabs\scripts\dump_host.ps1'
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date)
Register-ScheduledTask -TaskName 'DumpHostTask' -Action $action -Trigger $trigger -Force
schtasks /run /tn "DumpHostTask"
