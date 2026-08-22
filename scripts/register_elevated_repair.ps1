$workDir = "C:\lims-microlabs"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File `"$workDir\repair_engine.ps1`""
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "LIMS_Run_Repair_Elevated" -Action $action -Principal $principal -Force
Start-ScheduledTask -TaskName "LIMS_Run_Repair_Elevated"
Write-Host "Tarea de reparación elevada iniciada correctamente bajo SYSTEM."
