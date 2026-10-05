[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\AllWinRectScanner.cs"
[AllWinRectScanner]::Scan()
