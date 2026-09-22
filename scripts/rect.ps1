Add-Type @"
using System;
using System.Runtime.InteropServices;
public class RectHelper {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
    [StructLayout(LayoutKind.Sequential)]
    public struct RECT {
        public int Left;
        public int Top;
        public int Right;
        public int Bottom;
    }
    public static void ShowRect(IntPtr hWnd) {
        RECT r;
        if (GetWindowRect(hWnd, out r)) {
            Console.WriteLine("L: {0}, T: {1}, R: {2}, B: {3}, W: {4}, H: {5}", r.Left, r.Top, r.Right, r.Bottom, r.Right - r.Left, r.Bottom - r.Top);
        }
    }
}
"@
[RectHelper]::ShowRect([IntPtr]919390)
