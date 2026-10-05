[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$sh = New-Object -ComObject WScript.Shell
$lnkPath = "C:\Users\HP LAB\AppData\Roaming\Microsoft\Office\Recent\Cálculo - PERFIL DE LÍPIDOS - Correcto.xlsx.LNK"
if (Test-Path $lnkPath) {
    $target = $sh.CreateShortcut($lnkPath).TargetPath
    Write-Host "Target Path: $target"
    if (Test-Path $target) {
        Write-Host "Directorio del archivo: $(Split-Path $target)"
        Get-ChildItem -Path (Split-Path $target) | Sort-Object LastWriteTime -Descending | Select-Object -First 15 | ForEach-Object {
            Write-Host "  $($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm')) | $($_.Name)"
        }
    }
}
