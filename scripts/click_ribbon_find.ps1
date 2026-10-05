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

$formHwnd = [IntPtr]7407552
$root = [System.Windows.Automation.AutomationElement]::FromHandle($formHwnd)

$condBtn = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, "Find")
$findBtn = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condBtn)

if ($findBtn) {
    Write-Host "Botón Find encontrado en Ribbon!"
    $invoke = $findBtn.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
    $invoke.Invoke()
    Write-Host "Clic en Find ejecutado exitosamente!"
} else {
    Write-Host "No se encontró el botón Find."
}
