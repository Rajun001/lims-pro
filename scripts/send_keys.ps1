
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class KeySender {
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_KEYDOWN = 0x0100;
    public const uint WM_KEYUP = 0x0101;
    public const uint WM_SYSKEYDOWN = 0x0104;
    public const uint WM_SYSKEYUP = 0x0105;
    public const uint VK_RETURN = 0x0D;

    public static void SendKeysToHwnd(IntPtr hWnd) {
        SetForegroundWindow(hWnd);
        System.Threading.Thread.Sleep(200);
        // Alt+Y (0x59)
        SendMessage(hWnd, WM_SYSKEYDOWN, (IntPtr)0x59, (IntPtr)0x20000001);
        System.Threading.Thread.Sleep(100);
        SendMessage(hWnd, WM_SYSKEYUP, (IntPtr)0x59, (IntPtr)0x20000001);
        System.Threading.Thread.Sleep(200);

        // Enter
        SendMessage(hWnd, WM_KEYDOWN, (IntPtr)VK_RETURN, IntPtr.Zero);
        System.Threading.Thread.Sleep(100);
        SendMessage(hWnd, WM_KEYUP, (IntPtr)VK_RETURN, IntPtr.Zero);
    }
}
"@

$hwnd = [IntPtr]1311020
Write-Host "Enviando teclas a HWND $hwnd..."
[KeySender]::SendKeysToHwnd($hwnd)
Write-Host "Teclas enviadas."
