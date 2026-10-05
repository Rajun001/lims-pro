' ====================================================================
' Silent PowerShell Runner for LIMS-PRO Background Services
' Executes PowerShell scripts with SW_HIDE (0) so NO black window or
' console flash ever appears on the user's desktop.
' ====================================================================
Dim objArgs, cmd, i, arg, shell, exitCode
Set objArgs = WScript.Arguments
If objArgs.Count = 0 Then
    WScript.Quit 1
End If

cmd = "powershell.exe"
For i = 0 To objArgs.Count - 1
    arg = objArgs(i)
    If InStr(arg, " ") > 0 Or InStr(arg, """") > 0 Then
        cmd = cmd & " """ & Replace(arg, """", """""") & """"
    Else
        cmd = cmd & " " & arg
    End If
Next

Set shell = CreateObject("WScript.Shell")
exitCode = shell.Run(cmd, 0, True)
WScript.Quit exitCode
