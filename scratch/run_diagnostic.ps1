$samples = 30
$tempFile = "c:\lims-microlabs\scratch\simulated_write.txt"
if (!(Test-Path "c:\lims-microlabs\scratch")) { New-Item -ItemType Directory -Path "c:\lims-microlabs\scratch" | Out-Null }

Write-Host "======================================================================"
Write-Host "                DIAGNOSTICO Y SIMULACION EN TIEMPO REAL               "
Write-Host "======================================================================"
Write-Host "Instrucciones:"
Write-Host "1. Apenas inicie, ponte a escribir/digitar en la PC para probar tu conexion."
Write-Host "2. En el segundo 10, iniciaremos una Simulacion de Escritura en Disco (simulando logs/DB)."
Write-Host "3. Observa si la PC se congela durante esta simulacion."
Write-Host ""
Write-Host ("{0,-10} {1,-10} {2,-15} {3,-15} {4,-15} {5,-15}" -f "Segundo", "CPU (%)", "RAM Libre (MB)", "Disco Activo (%)", "Ping (ms)", "Actividad")
Write-Host ("{0,-10} {1,-10} {2,-15} {3,-15} {4,-15} {5,-15}" -f "-------", "-------", "--------------", "----------------", "---------", "---------")

for ($i = 1; $i -le $samples; $i++) {
    $activity = "Monitoreando"
    
    # Si estamos en el bloque de simulacion de escritura (segundos 11 a 20)
    if ($i -gt 10 -and $i -le 20) {
        $activity = "ESCRITURA ACTIVA"
        # Escribimos datos de forma repetitiva para simular carga de SQLite/Logs
        for ($j = 0; $j -lt 600; $j++) {
            $logMsg = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff') - SIMULACION LOG - Guardando registro de prueba numero $j en la base de datos`r`n"
            [System.IO.File]::AppendAllText($tempFile, $logMsg)
        }
    }
    
    # Limpiamos el archivo temporal al final de la simulacion
    if ($i -eq 21) {
        if (Test-Path $tempFile) { Remove-Item $tempFile -Force }
        $activity = "Limpiando temporal"
    }

    # Recopilar metricas
    $cpuObj = Get-Counter '\Processor(_Total)\% Processor Time' -ErrorAction SilentlyContinue
    $cpu = 0
    if ($cpuObj) { $cpu = $cpuObj.CounterSamples[0].CookedValue }
    
    $ram = (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1024
    
    $diskObj = Get-Counter '\PhysicalDisk(_Total)\% Disk Time' -ErrorAction SilentlyContinue
    $disk = 0
    if ($diskObj) { $disk = $diskObj.CounterSamples[0].CookedValue }
    
    # Medimos ping a Google DNS (8.8.8.8)
    $pingTime = 0
    try {
        $p = Test-Connection -ComputerName 8.8.8.8 -Count 1 -TimeoutMilliSeconds 500 -ErrorAction SilentlyContinue
        if ($p) { $pingTime = $p.ResponseTime } else { $pingTime = -1 }
    } catch {
        $pingTime = -1
    }
    
    Write-Host ("{0,-10} {1,-10:N1} {2,-15:N0} {3,-15:N1} {4,-15} {5,-15}" -f $i, $cpu, $ram, $disk, $pingTime, $activity)
    Start-Sleep -Seconds 1
}

if (Test-Path $tempFile) { Remove-Item $tempFile -Force }
Write-Host "======================================================================"
Write-Host "Diagnostico finalizado."
