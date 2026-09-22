Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class DirectInspector {
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
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);

    public static void InspectDirect() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        IntPtr qbHwnd = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString();
            if (title.StartsWith("MICROLABS") && title.Contains("QuickBooks")) {
                qbHwnd = hWnd;
                Console.WriteLine("Found QB HWND: " + hWnd + " Title: " + title);
            }
            return true;
        }, IntPtr.Zero);

        if (qbHwnd == IntPtr.Zero) return;

        EnumChildWindows(qbHwnd, (cWnd, clParam) => {
            StringBuilder cb = new StringBuilder(512);
            StringBuilder cc = new StringBuilder(256);
            GetWindowText(cWnd, cb, 512);
            GetClassName(cWnd, cc, 256);
            string t = cb.ToString().Trim();
            string c = cc.ToString().Trim();
            if (t.Contains("Estimate") || t.Contains("Report") || t.Contains("Excel") || t.Contains("Customize") || t.Contains("Dates") || t.Contains("All") || c.Contains("MDIClient")) {
                Console.WriteLine("   Sub: Class=" + c + " Text='" + t + "' HWND=" + cWnd);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[DirectInspector]::InspectDirect()
