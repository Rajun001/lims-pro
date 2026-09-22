# ====================================================================
# Comparador de Chrome Remote Desktop: Sistema Actual vs Respaldo Montado
# ====================================================================
param(
    [string]$DriveLetter = "F:"
)

if (-not (Test-Path "$DriveLetter\")) {
    Write-Host "[ERROR] La unidad virtual $DriveLetter no existe o no esta montada aun." -ForegroundColor Red
    Write-Host "Monte el respaldo en AOMEI Backupper asignandole la letra $DriveLetter (o indique la letra correcta)." -ForegroundColor Yellow
    exit 1
}

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "     COMPARANDO CHROME REMOTE DESKTOP (C: vs $DriveLetter)     " -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Cyan

# 1. Comparar ProgramData\Google\Chrome Remote Desktop
Write-Host "`n[1] Verificando ProgramData\Google\Chrome Remote Desktop..." -ForegroundColor Green
$bkData = "$DriveLetter\ProgramData\Google\Chrome Remote Desktop"
if (Test-Path $bkData) {
    Get-ChildItem -Path $bkData | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
    if (Test-Path "$bkData\host_unprivileged.json") {
        Write-Host "-> Respaldo host_unprivileged.json:" -ForegroundColor Cyan
        Get-Content "$bkData\host_unprivileged.json" -Raw
    }
} else {
    Write-Host "No se encontro carpeta Chrome Remote Desktop en ProgramData del respaldo." -ForegroundColor Yellow
}

# 2. Comparar extensiones y perfiles en Chrome User Data
Write-Host "`n[2] Verificando Extensiones de Chrome en Respaldo..." -ForegroundColor Green
$bkChromeExt = "$DriveLetter\Users\HP LAB\AppData\Local\Google\Chrome\User Data\Default\Extensions"
if (Test-Path $bkChromeExt) {
    Get-ChildItem -Path $bkChromeExt | Select-Object Name, LastWriteTime | Format-Table -AutoSize
} else {
    Write-Host "Buscando perfiles de usuario en $DriveLetter\Users..." -ForegroundColor Yellow
    Get-ChildItem "$DriveLetter\Users" -Directory | Select-Object Name
}

Write-Host "`nComparacion preliminar finalizada." -ForegroundColor Cyan
