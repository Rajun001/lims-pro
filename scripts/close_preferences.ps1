$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class WinCloser {
    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_CLOSE = 0x0010;

    public static void CloseHwnds(IntPtr[] hwnds) {
        foreach (var h in hwnds) {
            Console.WriteLine("Closing HWND: " + h);
            SendMessage(h, WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
            Thread.Sleep(500);
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[WinCloser]::CloseHwnds(@([IntPtr]6099306, [IntPtr]1311772, [IntPtr]2098510))
