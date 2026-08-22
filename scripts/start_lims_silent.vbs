Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c ""C:\lims-microlabs\scripts\start_lims_background.bat""", 0, False
Set WshShell = Nothing
