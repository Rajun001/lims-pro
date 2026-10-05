$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class QBCleaner {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public const uint WM_COMMAND = 0x0111;

    public static void CloseAll(IntPtr qbMain) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(qbMain);
        Thread.Sleep(300);

        Console.WriteLine("Enviando Window -> Close All (WM_COMMAND 331)...");
        PostMessage(qbMain, WM_COMMAND, (IntPtr)331, IntPtr.Zero);
        Thread.Sleep(1000);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[QBCleaner]::CloseAll([IntPtr]6228972)
