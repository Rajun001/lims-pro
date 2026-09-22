Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class CheckTester {
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
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_COMMAND = 0x0111;
    public const uint BM_CLICK = 0x00F5;
    public const uint BM_GETCHECK = 0x00F0;
    public const uint BM_SETCHECK = 0x00F1;
    public const uint BST_CHECKED = 1;

    public static void Test() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        IntPtr qbHwnd = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            if (sb.ToString().Contains("QuickBooks Enterprise") && sb.ToString().Contains("MICROLABS")) {
                qbHwnd = hWnd;
            }
            return true;
        }, IntPtr.Zero);

        Console.WriteLine("Opening Export dialog...");
        PostMessage(qbHwnd, WM_COMMAND, (IntPtr)115, IntPtr.Zero);
        Thread.Sleep(1000);

        IntPtr exportHwnd = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            if (sb.ToString().Equals("Export", StringComparison.OrdinalIgnoreCase)) {
                exportHwnd = hWnd;
            }
            return true;
        }, IntPtr.Zero);

        if (exportHwnd != IntPtr.Zero) {
            Console.WriteLine("Export dialog found HWND=" + exportHwnd);
            EnumChildWindows(exportHwnd, (cWnd, clParam) => {
                StringBuilder cb = new StringBuilder(512);
                GetWindowText(cWnd, cb, 512);
                string txt = cb.ToString().Trim();
                if (txt.Contains("Customer List") || txt.Contains("Item List")) {
                    int stateBefore = (int)SendMessage(cWnd, BM_GETCHECK, IntPtr.Zero, IntPtr.Zero);
                    Console.WriteLine("Control '" + txt + "' check state before: " + stateBefore);
                    SendMessage(cWnd, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
                    int stateAfter = (int)SendMessage(cWnd, BM_GETCHECK, IntPtr.Zero, IntPtr.Zero);
                    Console.WriteLine("Control '" + txt + "' check state after BM_CLICK: " + stateAfter);
                }
                return true;
            }, IntPtr.Zero);
        }
    }
}
"@

[CheckTester]::Test()
