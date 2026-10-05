[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\QBWAllWindowDumper.cs"
$qbProc = Get-Process -Name QBW -ErrorAction SilentlyContinue
if ($qbProc) {
    [QBWAllWindowDumper]::DumpQBW([uint32]$qbProc.Id)
} else {
    Write-Host "QBW no encontrado"
}
