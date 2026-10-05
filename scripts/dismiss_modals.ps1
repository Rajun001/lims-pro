$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class ModalCloser {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public const uint WM_COMMAND = 0x0111;
    public const uint WM_SYSCOMMAND = 0x0112;
    public const uint SC_CLOSE = 0xF060;
    public const uint WM_KEYDOWN = 0x0100;
    public const uint WM_KEYUP = 0x0101;
    public const int VK_ESCAPE = 0x1B;

    public static void DismissModal(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(hWnd);
        Thread.Sleep(200);

        Console.WriteLine("Sending WM_COMMAND IDCANCEL (2) to " + hWnd);
        PostMessage(hWnd, WM_COMMAND, (IntPtr)2, IntPtr.Zero);
        Thread.Sleep(300);

        Console.WriteLine("Sending WM_SYSCOMMAND SC_CLOSE to " + hWnd);
        PostMessage(hWnd, WM_SYSCOMMAND, (IntPtr)SC_CLOSE, IntPtr.Zero);
        Thread.Sleep(300);

        Console.WriteLine("Sending ESC key to " + hWnd);
        PostMessage(hWnd, WM_KEYDOWN, (IntPtr)VK_ESCAPE, IntPtr.Zero);
        PostMessage(hWnd, WM_KEYUP, (IntPtr)VK_ESCAPE, IntPtr.Zero);
        Thread.Sleep(300);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[ModalCloser]::DismissModal([IntPtr]6099306)
[ModalCloser]::DismissModal([IntPtr]1311772)
[ModalCloser]::DismissModal([IntPtr]2098510)
