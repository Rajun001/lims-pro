[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class PrefCategoryTester {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumChildProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumChildProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_LBUTTONDOWN = 0x0201;
    public const uint WM_LBUTTONUP = 0x0202;
    public const uint MK_LBUTTON = 0x0001;

    public static IntPtr MakeLParam(int x, int y) {
        return (IntPtr)((y << 16) | (x & 0xFFFF));
    }

    public static void ClickAndCheck(IntPtr prefHwnd, int y) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        IntPtr lp = MakeLParam(100, y);
        Console.WriteLine(string.Format("Clicking category at (100, {0})...", y));
        PostMessage(prefHwnd, WM_LBUTTONDOWN, (IntPtr)MK_LBUTTON, lp);
        Thread.Sleep(50);
        PostMessage(prefHwnd, WM_LBUTTONUP, IntPtr.Zero, lp);
        Thread.Sleep(400);


        EnumChildWindows(prefHwnd, (cWnd, clParam) => {
            StringBuilder cb = new StringBuilder(512);
            GetWindowText(cWnd, cb, 512);
            string txt = cb.ToString();
            if (txt.Contains("Integrated") || txt.Contains("Applications") || txt.Contains("Don't allow") || txt.Contains("Company Preferences") || txt.Contains("My Preferences")) {
                Console.WriteLine(string.Format("  [MATCH Y={0}] Control HWND={1} Text='{2}'", y, cWnd, txt));

            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp

$src = @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class PrefFinder4 {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);
    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);
    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public static IntPtr Find() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);
        IntPtr found = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            if (sb.ToString().Equals("Preferences", StringComparison.OrdinalIgnoreCase)) {
                found = hWnd;
            }
            return true;
        }, IntPtr.Zero);
        return found;
    }
}
"@
Add-Type -TypeDefinition $src
$prefHwnd = [PrefFinder4]::Find()
Write-Host "Preferences HWND: $prefHwnd"
if ($prefHwnd -ne [IntPtr]::Zero) {
    foreach ($y in @(200, 230, 260, 280, 290, 300, 310, 320, 340, 360, 380, 400)) {
        [PrefCategoryTester]::ClickAndCheck($prefHwnd, $y)
    }
}
