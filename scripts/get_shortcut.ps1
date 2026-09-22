$w = New-Object -ComObject WScript.Shell
$s = $w.CreateShortcut("C:\Users\Public\Desktop\Intuit QuickBooks Enterprise Solutions - Accountant 24.0.lnk")
Write-Output "Target: $($s.TargetPath)"
Write-Output "Arguments: $($s.Arguments)"
Write-Output "WorkDir: $($s.WorkingDirectory)"
