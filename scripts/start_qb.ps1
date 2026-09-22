Start-Process -FilePath "C:\Program Files\Intuit\QuickBooks Enterprise Solutions 24.0\QBWEnterpriseAccountant.exe" -ArgumentList '"C:\quickbooks2010\alimentos10.QBW"'
Start-Sleep -Seconds 4
Get-Process QBW* -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, WorkingSet64
