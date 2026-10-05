' ====================================================================
' Silent Runner for fetch_qb_estimates.ps1
' Runs PowerShell completely hidden (SW_HIDE = 0) with zero console flash
' ====================================================================
Set WshShell = CreateObject("WScript.Shell")
Set args = WScript.Arguments

maxReturned = "30"
fromTxnDate = ""
refNumber = ""
outputFile = "C:\lims-microlabs\scripts\qb_estimates_latest.json"

If args.Count >= 1 Then maxReturned = args(0)
If args.Count >= 2 Then fromTxnDate = args(1)
If args.Count >= 3 Then refNumber = args(2)
If args.Count >= 4 Then outputFile = args(3)

cmd = "powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""C:\lims-microlabs\scripts\fetch_qb_estimates.ps1"" -MaxReturned " & maxReturned & " -OutputFile """ & outputFile & """"

If fromTxnDate <> "" Then
    cmd = cmd & " -FromTxnDate """ & fromTxnDate & """"
End If
If refNumber <> "" Then
    cmd = cmd & " -RefNumber """ & refNumber & """"
End If

exitCode = WshShell.Run(cmd, 0, True)
WScript.Quit exitCode
