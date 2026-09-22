Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinInspector {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);
    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumDesktopWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static void InspectHwnd(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);
        Console.WriteLine("Inspecting HWND: " + hWnd + " Visible: " + IsWindowVisible(hWnd));
        EnumChildWindows(hWnd, (cWnd, clParam) => {
            StringBuilder sb = new StringBuilder(512);
            StringBuilder cb = new StringBuilder(256);
            GetWindowText(cWnd, sb, 512);
            GetClassName(cWnd, cb, 256);
            Console.WriteLine("  Child HWND: " + cWnd + " Visible: " + IsWindowVisible(cWnd) + " Class: " + cb.ToString() + " Text: '" + sb.ToString() + "'");
            return true;
        }, IntPtr.Zero);
    }
}
"@

[WinInspector]::InspectHwnd([IntPtr]5638350)
