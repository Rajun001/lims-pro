$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class KeyTyper {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr SetFocus(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_KEYDOWN = 0x0100;
    public const uint WM_KEYUP = 0x0101;
    public const uint WM_CHAR = 0x0102;
    public const int VK_RETURN = 0x0D;

    public static void TypeAndSearch(IntPtr editHwnd, string text) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(editHwnd);
        SetFocus(editHwnd);
        Thread.Sleep(200);

        foreach (char c in text) {
            PostMessage(editHwnd, WM_CHAR, (IntPtr)c, IntPtr.Zero);
            Thread.Sleep(50);
        }
        Thread.Sleep(200);

        Console.WriteLine("Enviando ENTER para buscar...");
        PostMessage(editHwnd, WM_KEYDOWN, (IntPtr)VK_RETURN, IntPtr.Zero);
        Thread.Sleep(50);
        PostMessage(editHwnd, WM_KEYUP, (IntPtr)VK_RETURN, IntPtr.Zero);
        Thread.Sleep(2000);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[KeyTyper]::TypeAndSearch([IntPtr]11601572, "131474")
