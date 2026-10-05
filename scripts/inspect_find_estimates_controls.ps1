$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class FindInspector {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumChildProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumChildProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static void Inspect(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        EnumChildWindows(hWnd, (cWnd, clp) => {
            StringBuilder cb = new StringBuilder(512);
            StringBuilder cc = new StringBuilder(256);
            GetWindowText(cWnd, cb, 512);
            GetClassName(cWnd, cc, 256);
            bool vis = IsWindowVisible(cWnd);
            Console.WriteLine("Child HWND: " + cWnd + " | Vis: " + vis + " | Class: " + cc.ToString() + " | Text: '" + cb.ToString() + "'");
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[FindInspector]::Inspect([IntPtr]7606410)
