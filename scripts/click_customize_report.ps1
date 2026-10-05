$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class CustomizeClicker {
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

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public const uint BM_CLICK = 0x00F5;

    public static void Click(IntPtr btn) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        Console.WriteLine("Haciendo clic en Customize Report (HWND " + btn + ")...");
        PostMessage(btn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        Thread.Sleep(1500);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 512);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString();
            string cls = sc.ToString();
            if (cls == "#32770" || cls == "MauiForm" || title.Contains("Modify") || title.Contains("Report") || title.Contains("Custom")) {
                Console.WriteLine("Ventana detectada: HWND " + hWnd + " | Cls: " + cls + " | Title: '" + title + "'");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[CustomizeClicker]::Click([IntPtr]5443790)
