Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class ChildDumper {
    public delegate bool EnumWindowProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumWindowProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static void DumpChildren(IntPtr parent) {
        EnumChildWindows(parent, (hWnd, lParam) => {
            StringBuilder title = new StringBuilder(256);
            GetWindowText(hWnd, title, 256);
            StringBuilder cls = new StringBuilder(256);
            GetClassName(hWnd, cls, 256);
            string t = title.ToString();
            if (IsWindowVisible(hWnd) && !string.IsNullOrEmpty(t)) {
                Console.WriteLine("Child HWND: {0}, Class: {1}, Title: '{2}'", hWnd, cls.ToString(), t);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[ChildDumper]::DumpChildren([IntPtr]723338)
