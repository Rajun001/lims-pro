Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class DesktopAttacher {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool CloseDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumDesktopWindowsProc lpEnumFunc, IntPtr lParam);

    public static void ReadDesktop() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) {
            Console.WriteLine("No se pudo abrir Desktop Default: " + Marshal.GetLastWin32Error());
            return;
        }

        SetThreadDesktop(hDesk);
        Console.WriteLine("Conectado a Desktop Default con éxito.");

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 512);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString().Trim();
            if (!string.IsNullOrEmpty(title) && (title.Contains("Preferences") || title.Contains("QuickBooks") || title.Contains("Product") || title.Contains("alimentos") || title.Contains("MICROLABS") || title.Contains("Export") || title.Contains("Save"))) {
                Console.WriteLine(">>> VENTANA ENCONTRADA: " + title);
                EnumChildWindows(hWnd, (cWnd, clParam) => {
                    StringBuilder cb = new StringBuilder(512);
                    GetWindowText(cWnd, cb, 512);
                    string ct = cb.ToString().Trim();
                    if (!string.IsNullOrEmpty(ct)) {
                        Console.WriteLine("    [Control] " + ct);
                    }
                    return true;
                }, IntPtr.Zero);
            }
            return true;
        }, IntPtr.Zero);

        CloseDesktop(hDesk);
    }
}
"@

[DesktopAttacher]::ReadDesktop()
