Add-Type @"
using System;
using System.Runtime.InteropServices;

public class MouseClicker {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool SetCursorPos(int X, int Y);

    [DllImport("user32.dll")]
    public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, int dwExtraInfo);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

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
        SetForegroundWindow(hWnd);
        System.Threading.Thread.Sleep(200);
        RECT rect;
        if (GetWindowRect(hWnd, out rect)) {
            int cx = (rect.Left + rect.Right) / 2;
            int cy = (rect.Top + rect.Bottom) / 2;
            SetCursorPos(cx, cy);
            System.Threading.Thread.Sleep(100);
            mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, 0);
            System.Threading.Thread.Sleep(100);
            mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);
        }
    }
}
"@

# Click en C&ontinue (HWND 5900526)
Write-Host "Moviendo cursor y haciendo clic en C&ontinue..."
[MouseClicker]::ClickElement([IntPtr]5900526)
Write-Host "Clic físico de ratón ejecutado en C&ontinue!"
