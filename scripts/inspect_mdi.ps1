Add-Type @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

public class MdiInspector {
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

    public static void InspectByPid() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        Process[] procs = Process.GetProcessesByName("QBW");
        if (procs.Length == 0) {
            Console.WriteLine("QBW not found");
            return;
        }

        IntPtr mainHwnd = procs[0].MainWindowHandle;
        StringBuilder sb = new StringBuilder(512);
        GetWindowText(mainHwnd, sb, 512);
        Console.WriteLine("QBW Main HWND=" + mainHwnd + " Title: " + sb.ToString());

        EnumChildWindows(mainHwnd, (cWnd, clParam) => {
            StringBuilder cb = new StringBuilder(512);
            StringBuilder cc = new StringBuilder(256);
            GetWindowText(cWnd, cb, 512);
            GetClassName(cWnd, cc, 256);
            string t = cb.ToString().Trim();
            string c = cc.ToString().Trim();
            if (t.Contains("Estimate") || t.Contains("Report") || t.Contains("Customize") || t.Contains("Dates") || t.Contains("Excel") || c.Contains("MDIClient")) {
                Console.WriteLine("   Sub: Class=" + c + " Text='" + t + "' HWND=" + cWnd);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[MdiInspector]::InspectByPid()
