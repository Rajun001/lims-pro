Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class PrefAllInspector {
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
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public static void Inspect(IntPtr hwnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        EnumChildWindows(hwnd, (cWnd, clParam) => {
            StringBuilder cb = new StringBuilder(512);
            StringBuilder cc = new StringBuilder(256);
            GetWindowText(cWnd, cb, 512);
            GetClassName(cWnd, cc, 256);
            RECT r;
            GetWindowRect(cWnd, out r);
            string cls = cc.ToString().Trim();
            string txt = cb.ToString().Trim();
            if (r.Left < 250 && (r.Right - r.Left) > 50) {
                Console.WriteLine("LEFT CONTROL HWND=" + cWnd + " Class=" + cls + " Rect=[" + r.Left + "," + r.Top + " - " + (r.Right-r.Left) + "x" + (r.Bottom-r.Top) + "] Text='" + txt + "'");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[PrefAllInspector]::Inspect([IntPtr]6161784)
