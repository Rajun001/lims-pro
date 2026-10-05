Get-CimInstance Win32_Process | Where-Object { 
    $_.Name -like '*axl*' -or $_.Name -like '*webcon*'
} | Select-Object ProcessId, Name, CommandLine | Format-List
