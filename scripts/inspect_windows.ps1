Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class WinInspector {
    [DllImport("user32.dll")]
    public static extern bool EnumThreadWindows(int dwThreadId, EnumThreadDelegate lpfn, IntPtr lParam);
    public delegate bool EnumThreadDelegate(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static List<string> GetAllVisible(int[] threadIds) {
        List<string> list = new List<string>();
        foreach (int tid in threadIds) {
            EnumThreadWindows(tid, (hWnd, lParam) => {
                StringBuilder title = new StringBuilder(256);
                GetWindowText(hWnd, title, 256);
                StringBuilder cls = new StringBuilder(256);
                GetClassName(hWnd, cls, 256);
                string t = title.ToString();
                string c = cls.ToString();
                if (IsWindowVisible(hWnd) && !string.IsNullOrEmpty(t)) {
                    list.Add(string.Format("HWND: {0}, Class: {1}, Title: '{2}'", hWnd, c, t));
                }
                return true;
            }, IntPtr.Zero);
        }
        return list;
    }
}
"@

$proc = Get-Process -Name QBW -ErrorAction SilentlyContinue
$threadIds = $proc.Threads | Select-Object -ExpandProperty Id
$windows = [WinInspector]::GetAllVisible($threadIds)
foreach ($w in $windows) {
    Write-Host $w
}
