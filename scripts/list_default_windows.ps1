$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinLister {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumProc lpfn, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);

    public static void List() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;
            StringBuilder sb = new StringBuilder(256);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 256);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString();
            string cls = sc.ToString();
            if (!string.IsNullOrEmpty(title) || cls == "#32770") {
                Console.WriteLine("HWND: " + hWnd + " | Cls: " + cls + " | Title: " + title);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[WinLister]::List()
