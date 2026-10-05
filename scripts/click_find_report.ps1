[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class ReportClicker {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumChildProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumChildProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public const uint BM_CLICK = 0x00F5;

    public static void ClickReport(IntPtr repBtn, IntPtr qbMain) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        Console.WriteLine("Haciendo clic en 'Report' (HWND " + repBtn + ")...");
        SendMessage(repBtn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        Thread.Sleep(2000);

        Console.WriteLine("Buscando nuevas ventanas de Reporte en QuickBooks...");
        EnumChildWindows(qbMain, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 512);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString().Trim();
            string cls = sc.ToString().Trim();
            bool vis = IsWindowVisible(hWnd);

            if (title.Contains("Report") || cls.Contains("Form") || title.Contains("Find")) {
                Console.WriteLine("VENTANA: HWND=" + hWnd + " | Cls=" + cls + " | Title='" + title + "'");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[ReportClicker]::ClickReport([IntPtr]2295776, [IntPtr]6228972)
