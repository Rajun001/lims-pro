Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class ExportTrigger {
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

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_COMMAND = 0x0111;

    public static void Trigger() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        IntPtr qbHwnd = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Contains("QuickBooks Enterprise") && title.Contains("MICROLABS")) {
                qbHwnd = hWnd;
            }
            return true;
        }, IntPtr.Zero);

        if (qbHwnd == IntPtr.Zero) {
            Console.WriteLine("No se encontro ventana de QuickBooks");
            return;
        }

        Console.WriteLine("Enviando WM_COMMAND 115 (Export Lists to IIF) a HWND: " + qbHwnd);
        PostMessage(qbHwnd, WM_COMMAND, (IntPtr)115, IntPtr.Zero);

        Thread.Sleep(1500);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Contains("Export") || title.Contains("IIF") || title.Contains("Lists")) {
                Console.WriteLine("Ventana de Export abierta: " + title + " (HWND=" + hWnd + ")");
                EnumChildWindows(hWnd, (cWnd, clParam) => {
                    StringBuilder cb = new StringBuilder(512);
                    StringBuilder cc = new StringBuilder(256);
                    GetWindowText(cWnd, cb, 512);
                    GetClassName(cWnd, cc, 256);
                    string ct = cb.ToString().Trim();
                    if (!string.IsNullOrEmpty(ct)) {
                        Console.WriteLine("   Control Class=" + cc.ToString() + " Text='" + ct + "' HWND=" + cWnd);
                    }
                    return true;
                }, IntPtr.Zero);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[ExportTrigger]::Trigger()
