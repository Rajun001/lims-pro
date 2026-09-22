Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinCloser {
    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    public const uint WM_CLOSE = 0x0010;
}
"@
[WinCloser]::PostMessage([IntPtr]919390, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero)
Write-Host "Popup closed!"
