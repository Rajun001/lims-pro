$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class ButtonClicker {
    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint BM_CLICK = 0x00F5;

    public static void Click(IntPtr[] btnHwnds) {
        foreach (var b in btnHwnds) {
            Console.WriteLine("Clicking Cancel Button HWND: " + b);
            PostMessage(b, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
            Thread.Sleep(500);
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[ButtonClicker]::Click(@([IntPtr]2233194, [IntPtr]7276948, [IntPtr]8457316))
