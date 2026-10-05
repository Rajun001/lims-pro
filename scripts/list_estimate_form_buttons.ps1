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

if ($null -eq $root) {
    Write-Host "No se encontró AutomationElement para HWND $formHwnd"
    exit
}

Write-Host "Formulario: $($root.Current.Name)"

# Find all buttons in the form
$condBtn = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)
$allBtns = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condBtn)
Write-Host "Botones encontrados: $($allBtns.Count)"
foreach ($b in $allBtns) {
    $name = $b.Current.Name
    if (![string]::IsNullOrEmpty($name)) {
        Write-Host "  -> Botón: '$name' (ID: '$($b.Current.AutomationId)')"
    }
}
