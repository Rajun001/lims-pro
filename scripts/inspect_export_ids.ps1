Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class DlgInspector {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumDesktopWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern int GetDlgCtrlID(IntPtr hWnd);

    public static void InspectExport() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Equals("Export", StringComparison.OrdinalIgnoreCase)) {
                Console.WriteLine("Export Window HWND=" + hWnd);
                EnumChildWindows(hWnd, (cWnd, clParam) => {
                    StringBuilder cb = new StringBuilder(512);
                    GetWindowText(cWnd, cb, 512);
                    string txt = cb.ToString().Trim();
                    int id = GetDlgCtrlID(cWnd);
                    Console.WriteLine("   Control ID=" + id + " HWND=" + cWnd + " Text='" + txt + "'");
                    return true;
                }, IntPtr.Zero);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[DlgInspector]::InspectExport()
