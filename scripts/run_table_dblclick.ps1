[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\TableDblClicker.cs"
[TableDblClicker]::DblClickRow([IntPtr]6882362)
