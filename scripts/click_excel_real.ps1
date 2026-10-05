$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class MouseClicker {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;

    public static void ClickElement(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(hWnd);
        Thread.Sleep(300);

        RECT rect;
        if (GetWindowRect(hWnd, out rect)) {
            int cx = (rect.Left + rect.Right) / 2;
            int cy = (rect.Top + rect.Bottom) / 2;
            Console.WriteLine("Moviendo cursor a (" + cx + ", " + cy + ") para hacer clic...");
            SetCursorPos(cx, cy);
            Thread.Sleep(150);
            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
            Thread.Sleep(100);
            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
            Thread.Sleep(1000);
        } else {
            Console.WriteLine("No se pudo obtener el rect de HWND " + hWnd);
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[MouseClicker]::ClickElement([IntPtr]11994880)
