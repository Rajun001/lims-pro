# Desinstalacion y limpieza total de Nitro Pro 9
Stop-Process -Name NitroPDF, Nitro_UpdateService, NitroPDFDriverService9x64 -Force -ErrorAction SilentlyContinue

# Detener y eliminar servicios
Get-Service Nitro* -ErrorAction SilentlyContinue | Stop-Service -Force -ErrorAction SilentlyContinue
& sc.exe delete NitroUpdateService | Out-Null
& sc.exe delete NitroDriverReadSpool9 | Out-Null

# Desinstalacion oficial via MSI
$proc = Start-Process -FilePath "msiexec.exe" -ArgumentList "/x", "{96DB185A-51FB-43D7-AA98-900D91C682DC}", "/qn", "/norestart" -PassThru -Wait
$exitCode = $proc.ExitCode

# Limpieza forzada de archivos y carpetas residuales
Remove-Item -Path "C:\Program Files\Nitro" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\ProgramData\Nitro" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Users\Public\Desktop\Nitro Pro 9.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Nitro Pro 9.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\Nitro" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:LOCALAPPDATA\Nitro" -Recurse -Force -ErrorAction SilentlyContinue

# Limpieza de claves de registro
Remove-Item -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\{96DB185A-51FB-43D7-AA98-900D91C682DC}" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKLM:\Software\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\{96DB185A-51FB-43D7-AA98-900D91C682DC}" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKLM:\Software\Nitro" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "HKCU:\Software\Nitro" -Recurse -Force -ErrorAction SilentlyContinue

# Registrar y asegurar SumatraPDF como lector predeterminado
if (Test-Path "C:\Users\HP LAB\AppData\Local\SumatraPDF\SumatraPDF.exe") {
    & "C:\Users\HP LAB\AppData\Local\SumatraPDF\SumatraPDF.exe" -register-for-pdf | Out-Null
}

"DESINSTALACION_COMPLETADA" | Out-File "C:\lims-microlabs\scratch\nitro_uninstalled.flag" -Encoding utf8
