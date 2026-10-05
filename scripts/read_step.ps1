$path = "C:\Users\HP LAB\.gemini\antigravity-ide\brain\83d9067b-e780-405b-ade9-0f858a5e82b3\.system_generated\logs\transcript.jsonl"
$lines = Get-Content $path
for ($i = 1040; $i -lt [Math]::Min($lines.Length, 1070); $i++) {
    $line = $lines[$i]
    if ($line -match '"step_index":(\d+).*?"type":"(.*?)"') {
        $idx = $Matches[1]
        $type = $Matches[2]
        $preview = if ($line.Length -gt 120) { $line.Substring(0, 120) } else { $line }
        Write-Host "$idx | $type | $preview"
    }
}
