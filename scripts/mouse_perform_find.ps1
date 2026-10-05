$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class MouseFinder {
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

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }

    public const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    public const uint MOUSEEVENTF_LEFTUP = 0x0004;
    public const byte VK_RETURN = 0x0D;

    public static void ClickHwnd(IntPtr hWnd) {
        RECT rect;
        if (GetWindowRect(hWnd, out rect)) {
            int cx = (rect.Left + rect.Right) / 2;
            int cy = (rect.Top + rect.Bottom) / 2;
            Console.WriteLine("Clicking at (" + cx + ", " + cy + ")...");
            SetCursorPos(cx, cy);
            Thread.Sleep(100);
            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
            Thread.Sleep(80);
            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
            Thread.Sleep(200);
        }
    }

    public static void PerformFind(IntPtr editHwnd, IntPtr findBtnHwnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(editHwnd);
        ClickHwnd(editHwnd);
        Thread.Sleep(200);

        // Type 131474 using SendKeys or keybd_event
        string text = "131474";
        foreach (char c in text) {
            byte vk = (byte)c;
            keybd_event(vk, 0, 0, UIntPtr.Zero);
            Thread.Sleep(40);
            keybd_event(vk, 0, 2, UIntPtr.Zero);
            Thread.Sleep(40);
        }
        Thread.Sleep(300);

        Console.WriteLine("Clicking Find button...");
        ClickHwnd(findBtnHwnd);
        Thread.Sleep(1500);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[MouseFinder]::PerformFind([IntPtr]11601572, [IntPtr]2623434)
