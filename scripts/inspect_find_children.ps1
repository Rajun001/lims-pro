[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class FindFormInspector {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumChildProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public delegate bool EnumChildProc(IntPtr hWnd, IntPtr lParam);

    public static void Inspect(IntPtr parent) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        EnumChildWindows(parent, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 512);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString().Trim();
            string cls = sc.ToString().Trim();
            bool vis = IsWindowVisible(hWnd);
            Console.WriteLine("HWND: " + hWnd + " | Vis: " + vis + " | Cls: " + cls + " | Title: '" + title + "'");
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[FindFormInspector]::Inspect([IntPtr]8458950)
