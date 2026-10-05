Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinInspectorClean {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);
    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumDesktopWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static void Run() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 512);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString();
            string cls = sc.ToString();
            if (title.Contains("QuickBooks") || title.Contains("Application") || title.Contains("Certificate") || title.Contains("MICROLABS")) {
                Console.WriteLine("TOP HWND: " + hWnd + " | Class: " + cls + " | Title: '" + title + "' | Vis: " + IsWindowVisible(hWnd));
                EnumChildWindows(hWnd, (cWnd, clParam) => {
                    StringBuilder cb = new StringBuilder(512);
                    StringBuilder cc = new StringBuilder(256);
                    GetWindowText(cWnd, cb, 512);
                    GetClassName(cWnd, cc, 256);
                    string t = cb.ToString().Trim();
                    if (!string.IsNullOrEmpty(t)) {
                        Console.WriteLine("   -> Child HWND: " + cWnd + " | Class: " + cc.ToString() + " | Text: '" + t + "' | Vis: " + IsWindowVisible(cWnd));
                    }
                    return true;
                }, IntPtr.Zero);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[WinInspectorClean]::Run()
