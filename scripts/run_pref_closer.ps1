[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\PrefCloser.cs"
[PrefCloser]::ClosePref([IntPtr]34211620)
