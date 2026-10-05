$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class EstimateOpener {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public const uint WM_COMMAND = 0x0111;

    public static void OpenEstimate(IntPtr qbMain) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(qbMain);
        Thread.Sleep(300);

        Console.WriteLine("Enviando Customers -> Create Estimates (WM_COMMAND 791)...");
        PostMessage(qbMain, WM_COMMAND, (IntPtr)791, IntPtr.Zero);
        Thread.Sleep(2000);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[EstimateOpener]::OpenEstimate([IntPtr]6228972)
