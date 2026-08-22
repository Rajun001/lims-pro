# Fix permissions on ProgramData Chrome Remote Desktop directory
$pgDir = "C:\ProgramData\Google\Chrome Remote Desktop"

Write-Host "Granting full permissions on $pgDir..."
takeown /f "$pgDir" /r /d y 2>$null
icacls "$pgDir" /reset /t /c 2>$null
icacls "$pgDir" /grant "Administrators:(OI)(CI)F" /grant "SYSTEM:(OI)(CI)F" /grant "Users:(OI)(CI)F" /grant "Everyone:(OI)(CI)F" /t /c 2>$null

Get-ChildItem -Path "$pgDir" -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    attrib -r -h -s $_.FullName 2>$null
    icacls $_.FullName /grant "Administrators:F" /grant "SYSTEM:F" /grant "Users:F" /grant "Everyone:F" /c 2>$null
}

Write-Host "Permissions granted successfully."
