[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\TableInspector.cs"
[TableInspector]::InspectHeader([IntPtr]6359762, [IntPtr]6882362, [IntPtr]4654362)
