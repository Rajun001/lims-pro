[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class FindPerformer {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, string lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumChildProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumChildProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public const uint WM_SETTEXT = 0x000C;
    public const uint BM_CLICK = 0x00F5;

    public static void Search(IntPtr editHwnd, IntPtr findBtnHwnd, IntPtr formHwnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        Console.WriteLine("1. Escribiendo '131474' en Edit (HWND " + editHwnd + ")...");
        SendMessage(editHwnd, WM_SETTEXT, IntPtr.Zero, "131474");
        Thread.Sleep(300);

        Console.WriteLine("2. Haciendo clic en boton Fin&d (HWND " + findBtnHwnd + ")...");
        SendMessage(findBtnHwnd, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        Thread.Sleep(1500);

        Console.WriteLine("3. Inspeccionando controles y resultados en Find form...");
        EnumChildWindows(formHwnd, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 512);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString().Trim();
            string cls = sc.ToString().Trim();
            bool vis = IsWindowVisible(hWnd);
            if (!string.IsNullOrEmpty(title) || cls.Contains("List") || cls.Contains("Table") || cls.Contains("Maui") || cls.Contains("Sys")) {
                Console.WriteLine("HWND: " + hWnd + " | Vis: " + vis + " | Cls: " + cls + " | Title: '" + title + "'");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[FindPerformer]::Search([IntPtr]3932876, [IntPtr]5506386, [IntPtr]8458950)
