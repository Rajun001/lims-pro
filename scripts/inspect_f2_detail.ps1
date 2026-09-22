Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class F2Reader {
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

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, int wParam, StringBuilder lParam);

    public const uint WM_GETTEXT = 0x000D;
    public const uint WM_GETTEXTLENGTH = 0x000E;

    public static void InspectF2() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            if (sb.ToString().Equals("Product Information", StringComparison.OrdinalIgnoreCase)) {
                Console.WriteLine("FOUND PRODUCT INFORMATION HWND: " + hWnd);

                EnumChildWindows(hWnd, (cWnd, clParam) => {
                    StringBuilder cls = new StringBuilder(256);
                    GetClassName(cWnd, cls, 256);

                    StringBuilder txt = new StringBuilder(1024);
                    SendMessage(cWnd, WM_GETTEXT, 1024, txt);

                    string s = txt.ToString().Trim();
                    if (!string.IsNullOrEmpty(s)) {
                        Console.WriteLine("Class: {0} | Text: {1}", cls.ToString(), s);
                    }
                    return true;
                }, IntPtr.Zero);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[F2Reader]::InspectF2()
