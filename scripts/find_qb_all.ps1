$csharp = @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class WinFinderAll {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static void FindAll() {
        EnumWindows((hWnd, lParam) => {
            uint procId;
            GetWindowThreadProcessId(hWnd, out procId);
            StringBuilder title = new StringBuilder(512);
            GetWindowText(hWnd, title, 512);
            string t = title.ToString();
            if (!string.IsNullOrEmpty(t) && (t.IndexOf("QuickBooks", StringComparison.OrdinalIgnoreCase) >= 0 || t.IndexOf("MICROLABS", StringComparison.OrdinalIgnoreCase) >= 0 || t.IndexOf("Preferences", StringComparison.OrdinalIgnoreCase) >= 0)) {
                StringBuilder cls = new StringBuilder(512);
                GetClassName(hWnd, cls, 512);
                bool vis = IsWindowVisible(hWnd);
                Console.WriteLine("PID: " + procId + " | HWND: " + hWnd + " | Visible: " + vis + " | Class: " + cls.ToString() + " | Title: " + t);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $csharp
[WinFinderAll]::FindAll()
