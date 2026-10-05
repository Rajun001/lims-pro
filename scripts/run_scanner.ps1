[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\DesktopScanner.cs"
[DesktopScanner]::ScanAll()
