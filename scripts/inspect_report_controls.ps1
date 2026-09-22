Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class ReportInspector {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumDesktopWindowsProc lpEnumFunc, IntPtr lParam);

    public static void Inspect() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Contains("QuickBooks Enterprise") && title.Contains("MICROLABS")) {
                Console.WriteLine("Inspecting Main Window: " + title);
                EnumChildWindows(hWnd, (cWnd, clParam) => {
                    StringBuilder cb = new StringBuilder(512);
                    StringBuilder cc = new StringBuilder(256);
                    GetWindowText(cWnd, cb, 512);
                    GetClassName(cWnd, cc, 256);
                    string txt = cb.ToString().Trim();
                    string cls = cc.ToString().Trim();
                    if (txt.Contains("Estimate") || txt.Contains("Excel") || txt.Contains("Customize") || txt.Contains("Dates") || txt.Contains("From") || txt.Contains("To") || txt.Contains("All")) {
                        Console.WriteLine("  Control HWND=" + cWnd + " Class=" + cls + " Text='" + txt + "'");
                    }
                    return true;
                }, IntPtr.Zero);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[ReportInspector]::Inspect()
