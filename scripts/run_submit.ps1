[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\DialogSubmitter.cs"
[DialogSubmitter]::Submit([IntPtr]34211620)
