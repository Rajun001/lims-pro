$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class FocusFinder {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public static void Check() {
        IntPtr fg = GetForegroundWindow();
        StringBuilder t = new StringBuilder(512);
        StringBuilder c = new StringBuilder(256);
        GetWindowText(fg, t, 512);
        GetClassName(fg, c, 256);
        Console.WriteLine("Foreground: HWND=" + fg + " Class=" + c + " Title='" + t + "'");
    }
}
"@
Add-Type -TypeDefinition $cs -Language CSharp
[FocusFinder]::Check()
