[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class EstimateFormInspector {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

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

    public const uint WM_COMMAND = 0x0111;
    public const uint BM_CLICK = 0x00F5;

    public static void OpenAndInspect(IntPtr qbMain) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        Console.WriteLine("1. Cerrando ventanas previas (WM_COMMAND 331)...");
        PostMessage(qbMain, WM_COMMAND, (IntPtr)331, IntPtr.Zero);
        Thread.Sleep(800);

        Console.WriteLine("2. Abriendo Create Estimates (WM_COMMAND 791)...");
        PostMessage(qbMain, WM_COMMAND, (IntPtr)791, IntPtr.Zero);
        Thread.Sleep(1500);

        Console.WriteLine("3. Buscando formulario Create Estimates...");
        IntPtr formHwnd = IntPtr.Zero;
        EnumChildWindows(qbMain, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Contains("Estimate") || title.Contains("Estimación") || title.Contains("Presupuesto")) {
                formHwnd = hWnd;
                Console.WriteLine("FORM ENCONTRADO: HWND=" + hWnd + " | Title='" + title + "'");
            }
            return true;
        }, IntPtr.Zero);

        if (formHwnd != IntPtr.Zero) {
            Console.WriteLine("Inspeccionando todos los controles de Create Estimates:");
            EnumChildWindows(formHwnd, (cWnd, clParam) => {
                StringBuilder cb = new StringBuilder(512);
                StringBuilder cc = new StringBuilder(256);
                GetWindowText(cWnd, cb, 512);
                GetClassName(cWnd, cc, 256);
                string text = cb.ToString().Trim();
                string cls = cc.ToString().Trim();
                bool vis = IsWindowVisible(cWnd);
                if (vis && (!string.IsNullOrEmpty(text) || cls.Contains("Edit") || cls.Contains("Combo") || cls.Contains("Button"))) {
                    Console.WriteLine("   CONTROL: HWND=" + cWnd + " | Cls=" + cls + " | Text='" + text + "'");
                }
                return true;
            }, IntPtr.Zero);
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[EstimateFormInspector]::OpenAndInspect([IntPtr]6228972)
