Copy-Item 'C:\ProgramData\Google\Chrome Remote Desktop\host.json' 'C:\lims-microlabs\logs\host_copy.json' -Force
icacls 'C:\lims-microlabs\logs\host_copy.json' /grant "Everyone:F" /grant "Users:F" /c
