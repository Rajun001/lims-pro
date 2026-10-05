[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -Path "c:\lims-microlabs\scripts\TabListFinder.cs"

Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class PrefFinder9 {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);
    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public static IntPtr Find() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);
        IntPtr found = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            if (sb.ToString().Equals("Preferences", StringComparison.OrdinalIgnoreCase)) {
                found = hWnd;
            }
            return true;
        }, IntPtr.Zero);
        return found;
    }
}
"@

$prefHwnd = [PrefFinder9]::Find()
Write-Host "Preferences HWND: $prefHwnd"
if ($prefHwnd -ne [IntPtr]::Zero) {
    [TabListFinder]::FindLists($prefHwnd)
}
