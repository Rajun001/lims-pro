$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class EstimateFinder {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

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

    public static void SearchEstimate(IntPtr findHwnd, IntPtr editHwnd, IntPtr findBtnHwnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(findHwnd);
        Thread.Sleep(200);

        Console.WriteLine("Escribiendo '131474' en Edit (HWND " + editHwnd + ")...");
        SendMessage(editHwnd, WM_SETTEXT, IntPtr.Zero, "131474");
        Thread.Sleep(300);

        Console.WriteLine("Haciendo clic en 'Find' (HWND " + findBtnHwnd + ")...");
        SendMessage(findBtnHwnd, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        PostMessage(findBtnHwnd, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        Thread.Sleep(2000);

        Console.WriteLine("Inspeccionando controles tras la búsqueda...");
        EnumChildWindows(findHwnd, (cWnd, clp) => {
            StringBuilder cb = new StringBuilder(512);
            StringBuilder cc = new StringBuilder(256);
            GetWindowText(cWnd, cb, 512);
            GetClassName(cWnd, cc, 256);
            bool vis = IsWindowVisible(cWnd);
            Console.WriteLine("  Control HWND: " + cWnd + " | Vis: " + vis + " | Class: " + cc.ToString() + " | Text: '" + cb.ToString() + "'");
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[EstimateFinder]::SearchEstimate([IntPtr]7606410, [IntPtr]11601572, [IntPtr]2623434)
