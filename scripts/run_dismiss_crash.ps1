[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\CrashDialogCloser.cs"
[CrashDialogCloser]::Dismiss()
