Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class AutoClicker {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public const uint BM_CLICK = 0x00F5;
    public const uint WM_LBUTTONDOWN = 0x0201;
    public const uint WM_LBUTTONUP = 0x0202;
    public const uint WM_KEYDOWN = 0x0100;
    public const uint WM_KEYUP = 0x0101;
    public const uint VK_RETURN = 0x0D;

    public static void Click(IntPtr btn) {
        SendMessage(btn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        PostMessage(btn, WM_LBUTTONDOWN, (IntPtr)1, IntPtr.Zero);
        PostMessage(btn, WM_LBUTTONUP, IntPtr.Zero, IntPtr.Zero);
    }
}
"@

Write-Host "Buscando ventanas activas en el sistema..."
[AutoClicker]::EnumWindows({
    param($hWnd, $lParam)
    $sbText = New-Object System.Text.StringBuilder 256
    $sbClass = New-Object System.Text.StringBuilder 256
    [AutoClicker]::GetWindowText($hWnd, $sbText, 256) | Out-Null
    [AutoClicker]::GetClassName($hWnd, $sbClass, 256) | Out-Null
    $t = $sbText.ToString()
    $c = $sbClass.ToString()

    if ($t -like "*QuickBooks*" -or $t -like "*Permission*" -or $t -like "*Certificate*" -or $t -like "*Microlabs*") {
        Write-Host "Ventana detectada: HWND=$hWnd | Class=$c | Title='$t'" -ForegroundColor Cyan
        
        # Inspeccionar controles hijos
        [AutoClicker]::EnumChildWindows($hWnd, {
            param($cWnd, $clParam)
            $cText = New-Object System.Text.StringBuilder 256
            $cCls = New-Object System.Text.StringBuilder 256
            [AutoClicker]::GetWindowText($cWnd, $cText, 256) | Out-Null
            [AutoClicker]::GetClassName($cWnd, $cCls, 256) | Out-Null
            $ct = $cText.ToString()
            $cc = $cCls.ToString()
            
            if (![string]::IsNullOrEmpty($ct)) {
                Write-Host "   -> Child: HWND=$cWnd | Class=$cc | Text='$ct'" -ForegroundColor Gray
            }

            # Si es opción 'Yes, whenever...'
            if ($ct -like "*whenever this*" -or $ct -like "*Yes, always*") {
                Write-Host "   >>> Haciendo clic en radio: '$ct'" -ForegroundColor Green
                [AutoClicker]::Click($cWnd)
            }
            # Si es botón Continue / Done / Yes
            if ($ct -like "*Continue*" -or $ct -like "*Done*" -or $ct -eq "Yes" -or $ct -eq "OK") {
                Write-Host "   >>> Haciendo clic en botón: '$ct'" -ForegroundColor Green
                [AutoClicker]::Click($cWnd)
            }
            return $true
        }, [IntPtr]::Zero) | Out-Null
    }
    return $true
}, [IntPtr]::Zero) | Out-Null
