[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$sh = New-Object -ComObject WScript.Shell
$recentDir = "C:\Users\HP LAB\AppData\Roaming\Microsoft\Office\Recent"
Get-ChildItem -Path $recentDir -Filter "*.LNK" | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object {
    $target = ""
    try {
        $target = $sh.CreateShortcut($_.FullName).TargetPath
    } catch {}
    Write-Host "$($_.LastWriteTime.ToString('yyyy-MM-dd HH:mm')) | $($_.Name) --> $target"
}
