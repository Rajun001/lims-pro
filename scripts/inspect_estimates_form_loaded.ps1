$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class FormDetailInspector {
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

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, StringBuilder lParam);

    public const uint WM_GETTEXT = 0x000D;
    public const uint WM_GETTEXTLENGTH = 0x000E;

    public static void InspectForm(IntPtr formHwnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        EnumChildWindows(formHwnd, (cWnd, clp) => {
            StringBuilder sc = new StringBuilder(256);
            GetClassName(cWnd, sc, 256);
            string cls = sc.ToString();

            StringBuilder sb = new StringBuilder(1024);
            GetWindowText(cWnd, sb, 1024);
            string txt = sb.ToString().Trim();

            if (string.IsNullOrEmpty(txt)) {
                int len = (int)SendMessage(cWnd, WM_GETTEXTLENGTH, IntPtr.Zero, null);
                if (len > 0) {
                    StringBuilder sbText = new StringBuilder(len + 2);
                    SendMessage(cWnd, WM_GETTEXT, (IntPtr)(len + 1), sbText);
                    txt = sbText.ToString().Trim();
                }
            }

            bool vis = IsWindowVisible(cWnd);
            if (!string.IsNullOrEmpty(txt) || cls.Contains("Edit") || cls.Contains("List") || cls.Contains("Header")) {
                Console.WriteLine("HWND: " + cWnd + " | Vis: " + vis + " | Class: " + cls + " | Text: '" + txt + "'");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[FormDetailInspector]::InspectForm([IntPtr]7407552)
