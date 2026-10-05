[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\MauiButtonClicker.cs"
# Parent is subform 6882362, button is 4654362, ctrlId is 22652
[MauiButtonClicker]::ClickMauiBtn([IntPtr]6882362, [IntPtr]4654362, 22652)
