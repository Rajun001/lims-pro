$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class MdiInspector {
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

    public static void InspectMdi(IntPtr qbMain) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        EnumChildWindows(qbMain, (cWnd, clp) => {
            StringBuilder sc = new StringBuilder(256);
            GetClassName(cWnd, sc, 256);
            string cls = sc.ToString();

            if (cls == "MDIClient" || cls.Contains("Form") || cls.Contains("View") || cls.Contains("Report") || cls == "#32770") {
                StringBuilder sb = new StringBuilder(512);
                GetWindowText(cWnd, sb, 512);
                bool vis = IsWindowVisible(cWnd);
                Console.WriteLine("HWND: " + cWnd + " | Vis: " + vis + " | Class: " + cls + " | Title: '" + sb.ToString() + "'");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[MdiInspector]::InspectMdi([IntPtr]6228972)
