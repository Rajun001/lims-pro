
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
public class WinSearcherAll {
    [DllImport("user32.dll")]
    public static extern bool EnumThreadWindows(int dwThreadId, EnumThreadDelegate lpfn, IntPtr lParam);
    public delegate bool EnumThreadDelegate(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static void CheckProc(int pid) {
        try {
            var p = System.Diagnostics.Process.GetProcessById(pid);
            foreach (System.Diagnostics.ProcessThread t in p.Threads) {
                EnumThreadWindows(t.Id, (hWnd, lParam) => {
                    StringBuilder sb = new StringBuilder(256);
                    StringBuilder sc = new StringBuilder(256);
                    GetWindowText(hWnd, sb, 256);
                    GetClassName(hWnd, sc, 256);
                    if (sb.Length > 0) {
                        Console.WriteLine("HWND: {0}, Visible: {1}, Class: {2}, Title: '{3}'", hWnd, IsWindowVisible(hWnd), sc.ToString(), sb.ToString());
                    }
                    return true;
                }, IntPtr.Zero);
            }
        } catch(Exception ex) {
            Console.WriteLine("Error: " + ex.Message);
        }
    }
}
"@
$proc = Get-Process -Name QBW -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "Revisando hilos de QBW (PID $($proc.Id))..."
    [WinSearcherAll]::CheckProc($proc.Id)
}
