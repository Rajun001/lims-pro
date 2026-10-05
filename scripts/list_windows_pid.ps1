$csharp = @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class WinEnumDirect {
    public delegate bool EnumThreadDelegate(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumThreadWindows(int dwThreadId, EnumThreadDelegate lpfn, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static void ListProcWindows(int[] threadIds) {
        foreach (int tid in threadIds) {
            EnumThreadWindows(tid, (hWnd, lParam) => {
                StringBuilder title = new StringBuilder(512);
                GetWindowText(hWnd, title, 512);
                StringBuilder cls = new StringBuilder(512);
                GetClassName(hWnd, cls, 512);
                bool vis = IsWindowVisible(hWnd);
                Console.WriteLine("HWND: " + hWnd + " | Tid: " + tid + " | Vis: " + vis + " | Class: " + cls.ToString() + " | Title: " + title.ToString());
                return true;
            }, IntPtr.Zero);
        }
    }
}
"@

Add-Type -TypeDefinition $csharp

$proc = Get-Process -Id 9028
$tids = @()
foreach ($t in $proc.Threads) {
    $tids += $t.Id
}
Write-Host "Checking threads: $($tids.Count)"
[WinEnumDirect]::ListProcWindows($tids)
