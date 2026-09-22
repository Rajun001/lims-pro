Get-Process -Name qbw* | Select-Object Id, ProcessName, Path, StartTime, Responding, MainWindowTitle | Format-List
