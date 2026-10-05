[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class GoToClicker {
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

    public static void ClickGoTo(IntPtr gotoBtn, IntPtr qbMain) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        Console.WriteLine("Haciendo clic en '&Go To' (HWND " + gotoBtn + ")...");
        SendMessage(gotoBtn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        Thread.Sleep(1500);

        Console.WriteLine("Inspeccionando ventanas hijas de QuickBooks...");
        EnumChildWindows(qbMain, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 512);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString().Trim();
            string cls = sc.ToString().Trim();
            bool vis = IsWindowVisible(hWnd);

            if (cls == "MauiForm" || cls.Contains("Form") || title.Contains("Estimate") || title.Contains("Invoice") || title.Contains("131474")) {
                Console.WriteLine("FORM ENCONTRADO: HWND=" + hWnd + " | Cls=" + cls + " | Title='" + title + "'");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[GoToClicker]::ClickGoTo([IntPtr]4327178, [IntPtr]6228972)
