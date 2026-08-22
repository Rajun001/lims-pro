# Registrar Tarea Programada CRD_Watchdog_Service
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument '-ExecutionPolicy Bypass -WindowStyle Hidden -File C:\lims-microlabs\scripts\crd_watchdog.ps1'
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances Parallel
Register-ScheduledTask -TaskName 'CRD_Watchdog_Service' -Action $action -Trigger $trigger -Settings $settings -Force
Write-Host "Tarea CRD_Watchdog_Service registrada correctamente."
