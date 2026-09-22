
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinDump {
    [DllImport("user32.dll")]
    public static extern bool EnumThreadWindows(int dwThreadId, EnumThreadDelegate lpfn, IntPtr lParam);
    public delegate bool EnumThreadDelegate(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    public static void Dump(int[] threadIds) {
        foreach (int tid in threadIds) {
            EnumThreadWindows(tid, (hWnd, lParam) => {
                StringBuilder title = new StringBuilder(256);
                GetWindowText(hWnd, title, 256);
                StringBuilder cls = new StringBuilder(256);
                GetClassName(hWnd, cls, 256);
                string t = title.ToString();
                string c = cls.ToString();
                if (!string.IsNullOrEmpty(t)) {
                    Console.WriteLine("TID: {0}, HWND: {1}, Class: {2}, Title: '{3}'", tid, hWnd, c, t);
                }
                return true;
            }, IntPtr.Zero);
        }
    }
}
"@
$proc = Get-Process -Name QBW -ErrorAction SilentlyContinue
$threadIds = $proc.Threads | Select-Object -ExpandProperty Id
[WinDump]::Dump($threadIds)
