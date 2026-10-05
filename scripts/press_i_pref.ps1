$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class PrefKeys {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumChildProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumChildProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public const uint WM_KEYDOWN = 0x0100;
    public const uint WM_KEYUP = 0x0101;
    public const uint WM_CHAR = 0x0102;
    public const int VK_I = 0x49;

    public static void PressI(IntPtr prefHwnd, IntPtr listEditHwnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(prefHwnd);
        Thread.Sleep(300);

        Console.WriteLine("Enviando tecla 'I' a la lista...");
        PostMessage(listEditHwnd, WM_KEYDOWN, (IntPtr)VK_I, IntPtr.Zero);
        PostMessage(listEditHwnd, WM_CHAR, (IntPtr)'i', IntPtr.Zero);
        PostMessage(listEditHwnd, WM_KEYUP, (IntPtr)VK_I, IntPtr.Zero);
        Thread.Sleep(1000);

        // Check new controls
        EnumChildWindows(prefHwnd, (cWnd, clp) => {
            StringBuilder cb = new StringBuilder(512);
            StringBuilder cc = new StringBuilder(256);
            GetWindowText(cWnd, cb, 512);
            GetClassName(cWnd, cc, 256);
            bool vis = IsWindowVisible(cWnd);
            string t = cb.ToString();
            if (vis && !string.IsNullOrEmpty(t)) {
                Console.WriteLine("  Control HWND: " + cWnd + " | Class: " + cc.ToString() + " | Text: '" + t + "'");
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[PrefKeys]::PressI([IntPtr]1774738, [IntPtr]3412756)
