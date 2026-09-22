Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class ReportOpener {
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
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_COMMAND = 0x0111;

    public static void OpenEstimatesReport() {
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

        if (qbHwnd == IntPtr.Zero) return;

        Console.WriteLine("Opening Estimates by Job report (WM_COMMAND 18671)...");
        PostMessage(qbHwnd, WM_COMMAND, (IntPtr)18671, IntPtr.Zero);

        Thread.Sleep(2000);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Contains("Estimates") || title.Contains("Report")) {
                Console.WriteLine("Found Report Window: " + title + " (HWND=" + hWnd + ")");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[ReportOpener]::OpenEstimatesReport()
