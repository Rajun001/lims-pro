$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class PrefNavigator {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

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
    public const uint WM_KEYDOWN = 0x0100;
    public const uint WM_KEYUP = 0x0101;
    public const int VK_DOWN = 0x28;
    public const int VK_I = 0x49;

    public static void OpenAndInspect(IntPtr qbMain) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(qbMain);
        Thread.Sleep(300);

        Console.WriteLine("Abriendo Preferences (WM_COMMAND 511)...");
        PostMessage(qbMain, WM_COMMAND, (IntPtr)511, IntPtr.Zero);
        Thread.Sleep(1500);

        IntPtr prefHwnd = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            if (sb.ToString().Contains("Preferences")) {
                prefHwnd = hWnd;
                return false;
            }
            return true;
        }, IntPtr.Zero);

        if (prefHwnd == IntPtr.Zero) {
            Console.WriteLine("No se encontró ventana de Preferences.");
            return;
        }

        Console.WriteLine("Ventana Preferences encontrada: HWND " + prefHwnd);
        SetForegroundWindow(prefHwnd);
        Thread.Sleep(300);

        // List all child controls
        EnumChildWindows(prefHwnd, (cWnd, clp) => {
            StringBuilder cb = new StringBuilder(512);
            StringBuilder cc = new StringBuilder(256);
            GetWindowText(cWnd, cb, 512);
            GetClassName(cWnd, cc, 256);
            bool vis = IsWindowVisible(cWnd);
            Console.WriteLine("  Child HWND: " + cWnd + " | Vis: " + vis + " | Class: " + cc.ToString() + " | Text: '" + cb.ToString() + "'");
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[PrefNavigator]::OpenAndInspect([IntPtr]6228972)
