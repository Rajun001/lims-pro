$sh = New-Object -ComObject WScript.Shell
$sc = $sh.CreateShortcut("C:\Users\Public\Desktop\Intuit QuickBooks Enterprise Solutions - Accountant 24.0.lnk")
Write-Host "Target: $($sc.TargetPath)"
Write-Host "Args: $($sc.Arguments)"
Write-Host "WorkDir: $($sc.WorkingDirectory)"
