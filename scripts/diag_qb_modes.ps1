[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "--- DIAGNOSTICO INTEGRAL DE ACCESO A QUICKBOOKS ---" -ForegroundColor Cyan

$procs = Get-Process qbw* -ErrorAction SilentlyContinue
if ($procs) {
    foreach ($p in $procs) {
        Write-Host "Proceso detectado: $($p.Name) (PID: $($p.Id), Mem: $([math]::Round($p.WorkingSet64/1MB,1)) MB)"
    }
} else {
    Write-Host "ERROR: No hay ningun proceso de QuickBooks en ejecucion." -ForegroundColor Red
    exit 1
}

$appId = "MicrolabsExport"
$appName = "Microlabs Export Tool"

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    Write-Host "1. Instanciacion COM exitosa." -ForegroundColor Green
    
    $rp.OpenConnection2($appId, $appName, 1)
    Write-Host "2. OpenConnection2 exitoso con $appId." -ForegroundColor Green

    # Modo A: Archivo abierto actual ("") con modo 2
    Write-Host "3. Intentando BeginSession('', 2)..."
    try {
        $ticket = $rp.BeginSession("", 2)
        Write-Host "EXITO en Modo A! Ticket: $ticket" -ForegroundColor Green
        $rp.EndSession($ticket)
        $rp.CloseConnection()
        exit 0
    } catch {
        Write-Host "Fallo Modo A: $($_.Exception.Message)" -ForegroundColor Yellow
    }

    # Modo B: Archivo especifico con modo 2
    $qbwPath = "C:\quickbooks2010\alimentos10.QBW"
    Write-Host "4. Intentando BeginSession('$qbwPath', 2)..."
    try {
        $ticket = $rp.BeginSession($qbwPath, 2)
        Write-Host "EXITO en Modo B! Ticket: $ticket" -ForegroundColor Green
        $rp.EndSession($ticket)
        $rp.CloseConnection()
        exit 0
    } catch {
        Write-Host "Fallo Modo B: $($_.Exception.Message)" -ForegroundColor Yellow
    }

    # Modo C: Archivo especifico con modo 1
    Write-Host "5. Intentando BeginSession('$qbwPath', 1)..."
    try {
        $ticket = $rp.BeginSession($qbwPath, 1)
        Write-Host "EXITO en Modo C! Ticket: $ticket" -ForegroundColor Green
        $rp.EndSession($ticket)
        $rp.CloseConnection()
        exit 0
    } catch {
        Write-Host "Fallo Modo C: $($_.Exception.Message)" -ForegroundColor Yellow
    }

    $rp.CloseConnection()

} catch {
    Write-Host "ERROR GENERAL COM: $($_.Exception.Message)" -ForegroundColor Red
}
