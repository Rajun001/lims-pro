Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class WinSearcher {
    [DllImport("user32.dll")]
    public static extern bool EnumThreadWindows(int dwThreadId, EnumThreadDelegate lpfn, IntPtr lParam);
    public delegate bool EnumThreadDelegate(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
    public static void CheckProc(int pid) {
        try {
            var p = System.Diagnostics.Process.GetProcessById(pid);
            foreach (System.Diagnostics.ProcessThread t in p.Threads) {
                EnumThreadWindows(t.Id, (hWnd, lParam) => {
                    StringBuilder sb = new StringBuilder(256);
                    GetWindowText(hWnd, sb, 256);
                    if (IsWindowVisible(hWnd) && sb.Length > 0) {
                        Console.WriteLine("PID: {0}, HWND: {1}, Title: '{2}'", pid, hWnd, sb.ToString());
                    }
                    return true;
                }, IntPtr.Zero);
            }
        } catch {}
    }
}
"@
[WinSearcher]::CheckProc(16024)
[WinSearcher]::CheckProc(16952)
