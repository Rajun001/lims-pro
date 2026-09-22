Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinChildInspector {
    public delegate bool EnumWindowProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumWindowProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public static void Inspect(IntPtr parent) {
        EnumChildWindows(parent, (hWnd, lParam) => {
            StringBuilder title = new StringBuilder(256);
            GetWindowText(hWnd, title, 256);
            StringBuilder cls = new StringBuilder(256);
            GetClassName(hWnd, cls, 256);
            Console.WriteLine("Child: {0}, Class: {1}, Text: '{2}'", hWnd, cls.ToString(), title.ToString());
            return true;
        }, IntPtr.Zero);
    }
}
"@

[WinChildInspector]::Inspect([IntPtr]919390)
