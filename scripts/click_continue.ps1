Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Clicker {
    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern IntPtr FindWindowEx(IntPtr parentHandle, IntPtr childAfter, string className, string windowTitle);

    public const uint BM_CLICK = 0x00F5;
    public const uint WM_LBUTTONDOWN = 0x0201;
    public const uint WM_LBUTTONUP = 0x0202;
    public const uint WM_KEYDOWN = 0x0100;
    public const uint WM_KEYUP = 0x0101;
    public const uint VK_RETURN = 0x0D;

    public static void ClickHwnd(IntPtr btn) {
        SendMessage(btn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        PostMessage(btn, WM_LBUTTONDOWN, (IntPtr)1, IntPtr.Zero);
        PostMessage(btn, WM_LBUTTONUP, IntPtr.Zero, IntPtr.Zero);
        PostMessage(btn, WM_KEYDOWN, (IntPtr)VK_RETURN, IntPtr.Zero);
        PostMessage(btn, WM_KEYUP, (IntPtr)VK_RETURN, IntPtr.Zero);
    }
}
"@

$btn = [Clicker]::FindWindowEx([IntPtr]5902424, [IntPtr]::Zero, "MauiPushButton", "C&ontinue")
Write-Host "Continue Btn HWND: $btn"
if ($btn -ne [IntPtr]::Zero) {
    [Clicker]::ClickHwnd($btn)
    Write-Host "CLICK SENT TO CONTINUE!"
} else {
    # Try finding any MauiPushButton in 5902424
    Write-Host "Looking for all push buttons in 5902424..."
    $proc = [Clicker]::FindWindowEx([IntPtr]5902424, [IntPtr]::Zero, "MauiPushButton", $null)
    while ($proc -ne [IntPtr]::Zero) {
        Write-Host "Button: $proc"
        [Clicker]::ClickHwnd($proc)
        $proc = [Clicker]::FindWindowEx([IntPtr]5902424, $proc, "MauiPushButton", $null)
    }
}
