$cs = @"
using System;
using System.Runtime.InteropServices;

public class WinStateChecker {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsZoomed(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public const int SW_RESTORE = 9;
    public const int SW_SHOWMAXIMIZED = 3;

    public static void CheckAndRestore(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        bool iconic = IsIconic(hWnd);
        bool zoomed = IsZoomed(hWnd);
        Console.WriteLine("HWND " + hWnd + " isIconic (minimized): " + iconic + " | isZoomed (maximized): " + zoomed);

        if (iconic) {
            Console.WriteLine("Restoring window...");
            ShowWindow(hWnd, SW_RESTORE);
            SetForegroundWindow(hWnd);
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[WinStateChecker]::CheckAndRestore([IntPtr]6030814)
