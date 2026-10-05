$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class WindowShower {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public const int SW_RESTORE = 9;
    public const int SW_SHOW = 5;
    public const int SW_MAXIMIZE = 3;

    public static void RestoreAndShow(IntPtr qbMain, IntPtr formHwnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(qbMain);
        ShowWindow(formHwnd, SW_RESTORE);
        ShowWindow(formHwnd, SW_SHOW);
        SetForegroundWindow(formHwnd);
        Thread.Sleep(500);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[WindowShower]::RestoreAndShow([IntPtr]6228972, [IntPtr]7407552)
