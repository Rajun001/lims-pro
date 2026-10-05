$path = "C:\Users\HP LAB\.gemini\antigravity-ide\brain\83d9067b-e780-405b-ade9-0f858a5e82b3\.system_generated\logs\transcript.jsonl"
$lines = Get-Content $path
for ($i = 1150; $i -lt [Math]::Min($lines.Length, 1320); $i++) {
    $line = $lines[$i]
    if ($line -match 'qb_estimates_latest') {
        Write-Host "$i | $($line.Substring(0, [Math]::Min(150, $line.Length)))"
    }
}
