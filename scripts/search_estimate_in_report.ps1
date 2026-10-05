$cs = @"
using System;
using System.Runtime.InteropServices;

public class DeskSetter {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    public static void Attach() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);
    }
}
"@
Add-Type -TypeDefinition $cs -Language CSharp
[DeskSetter]::Attach()

Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

$rptHwnd = [IntPtr]8195866
$root = [System.Windows.Automation.AutomationElement]::FromHandle($rptHwnd)

if ($null -eq $root) {
    Write-Host "No se encontró la ventana del reporte $rptHwnd"
    exit
}

Write-Host "Ventana encontrada: $($root.Current.Name)"

# Find searchTxtBox
$condId = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::AutomationIdProperty, "searchTxtBox")
$searchBox = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condId)

if ($searchBox) {
    Write-Host "Caja de búsqueda encontrada!"
    $valPattern = $searchBox.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    $valPattern.SetValue("131474")
    Write-Host "Valor '131474' establecido en la caja de búsqueda."
    Start-Sleep -Milliseconds 500

    # Find Search button
    $condBtn = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Search")
    $searchBtn = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condBtn)
    if ($searchBtn) {
        Write-Host "Botón 'Search' encontrado, ejecutando clic..."
        $invokePattern = $searchBtn.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
        $invokePattern.Invoke()
        Write-Host "Búsqueda ejecutada!"
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "No se encontró searchTxtBox."
}
