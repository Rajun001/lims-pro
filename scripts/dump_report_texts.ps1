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

# Find all Text controls in the report
$condText = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Text)
$allTexts = $root.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condText)

Write-Host "Total elementos de texto en el reporte: $($allTexts.Count)"
foreach ($t in $allTexts) {
    $name = $t.Current.Name
    if (![string]::IsNullOrWhiteSpace($name) -and $name.Length -gt 1) {
        Write-Host "TEXT: $name"
    }
}
