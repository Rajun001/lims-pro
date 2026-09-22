Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class MouseClicker {
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

    public const uint WM_LBUTTONDOWN = 0x0201;
    public const uint WM_LBUTTONUP = 0x0202;
    public const uint BM_GETCHECK = 0x00F0;
    public const uint WM_KEYDOWN = 0x0100;
    public const uint WM_KEYUP = 0x0101;
    public const uint VK_SPACE = 0x20;

    public static void ClickTest() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

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
            EnumChildWindows(exportHwnd, (cWnd, clParam) => {
                StringBuilder cb = new StringBuilder(512);
                GetWindowText(cWnd, cb, 512);
                string txt = cb.ToString().Trim();
                if (txt.Contains("Customer List")) {
                    IntPtr pos = (IntPtr)((5 << 16) | 5); // x=5, y=5
                    SendMessage(cWnd, WM_LBUTTONDOWN, (IntPtr)1, pos);
                    SendMessage(cWnd, WM_LBUTTONUP, IntPtr.Zero, pos);
                    int s1 = (int)SendMessage(cWnd, BM_GETCHECK, IntPtr.Zero, IntPtr.Zero);
                    Console.WriteLine("After LBUTTON: " + s1);

                    SendMessage(cWnd, WM_KEYDOWN, (IntPtr)VK_SPACE, IntPtr.Zero);
                    SendMessage(cWnd, WM_KEYUP, (IntPtr)VK_SPACE, IntPtr.Zero);
                    int s2 = (int)SendMessage(cWnd, BM_GETCHECK, IntPtr.Zero, IntPtr.Zero);
                    Console.WriteLine("After SPACE: " + s2);
                }
                return true;
            }, IntPtr.Zero);
        }
    }
}
"@

[MouseClicker]::ClickTest()
