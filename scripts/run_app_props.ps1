[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\AppPropertiesClicker.cs"
[AppPropertiesClicker]::ClickProperties([IntPtr]4654362)
