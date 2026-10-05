$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class PrefInspector {
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

        EnumChildWindows(hWnd, (cWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(cWnd, sb, 512);
            GetClassName(cWnd, sc, 256);
            bool vis = IsWindowVisible(cWnd);
            string txt = sb.ToString();
            if (vis || !string.IsNullOrEmpty(txt)) {
                Console.WriteLine("Child HWND: " + cWnd + " | Vis: " + vis + " | Class: " + sc.ToString() + " | Text: '" + txt + "'");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
Write-Host "--- Inspecting 6099306 ---"
[PrefInspector]::Inspect([IntPtr]6099306)
Write-Host "--- Inspecting 1311772 ---"
[PrefInspector]::Inspect([IntPtr]1311772)
Write-Host "--- Inspecting 2098510 ---"
[PrefInspector]::Inspect([IntPtr]2098510)
