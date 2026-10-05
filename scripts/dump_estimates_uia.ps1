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

$formHwnd = [IntPtr]11078374
$root = [System.Windows.Automation.AutomationElement]::FromHandle($formHwnd)

if ($null -eq $root) {
    Write-Host "No se pudo obtener AutomationElement para HWND $formHwnd"
    exit
}

Write-Host "Root: $($root.Current.Name) | Class: $($root.Current.ClassName) | ControlType: $($root.Current.ControlType.ProgrammaticName)"

function Walk-Element($element, $indent) {
    $name = $element.Current.Name
    $val = ""
    try {
        $valPattern = $element.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
        if ($valPattern) {
            $val = " [Value: '$($valPattern.Current.Value)']"
        }
    } catch {}

    $cls = $element.Current.ClassName
    $ct = $element.Current.ControlType.ProgrammaticName
    $id = $element.Current.AutomationId

    if (![string]::IsNullOrEmpty($name) -or ![string]::IsNullOrEmpty($val) -or ![string]::IsNullOrEmpty($id)) {
        Write-Host "$indent$ct | ID: '$id' | Name: '$name'$val | Class: '$cls'"
    }

    $children = $element.FindAll([System.Windows.Automation.TreeScope]::Children, [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($child in $children) {
        Walk-Element $child ($indent + "  ")
    }
}

Walk-Element $root ""
