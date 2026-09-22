Add-Type @"
using System;
using System.Runtime.InteropServices;
public class AuthFix {
    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    public const uint BM_CLICK = 0x00F5;
    public const uint WM_KEYDOWN = 0x0100;
    public const uint WM_KEYUP = 0x0101;
    public const uint VK_RETURN = 0x0D;

    public static void SelectAndContinue(IntPtr parent, IntPtr radio, IntPtr btn) {
        SetForegroundWindow(parent);
        System.Threading.Thread.Sleep(200);
        SendMessage(radio, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        System.Threading.Thread.Sleep(200);
        SendMessage(btn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        PostMessage(btn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        PostMessage(parent, WM_KEYDOWN, (IntPtr)VK_RETURN, IntPtr.Zero);
        PostMessage(parent, WM_KEYUP, (IntPtr)VK_RETURN, IntPtr.Zero);
    }
}
"@

Write-Host "Enviando seleccion y confirmacion..."
[AuthFix]::SelectAndContinue([IntPtr]1311020, [IntPtr]1575852, [IntPtr]1181614)
Write-Host "Completado."
