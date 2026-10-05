$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class ReportOpenerReal {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public const uint WM_COMMAND = 0x0111;

    public static void OpenReport(IntPtr qbMain, int cmdId) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(qbMain);
        Thread.Sleep(300);

        Console.WriteLine("Enviando WM_COMMAND " + cmdId + " a QuickBooks...");
        PostMessage(qbMain, WM_COMMAND, (IntPtr)cmdId, IntPtr.Zero);
        Thread.Sleep(2000);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
# 17327 = Estimates by Job
[ReportOpenerReal]::OpenReport([IntPtr]6228972, 17327)
