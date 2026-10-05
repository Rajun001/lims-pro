$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class FindTester {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumDesktopWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public const uint WM_COMMAND = 0x0111;

    public static void OpenFind(IntPtr qbMain) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(qbMain);
        Thread.Sleep(300);

        Console.WriteLine("Enviando Edit -> Find (WM_COMMAND 311)...");
        PostMessage(qbMain, WM_COMMAND, (IntPtr)311, IntPtr.Zero);
        Thread.Sleep(1500);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 512);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString();
            string cls = sc.ToString();

            if (title.Contains("Find") || title.Contains("Buscar") || cls == "MauiForm") {
                Console.WriteLine("VENTANA DETECTADA: HWND=" + hWnd + " | Cls=" + cls + " | Title='" + title + "'");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[FindTester]::OpenFind([IntPtr]6228972)
