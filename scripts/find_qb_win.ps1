[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class QBWinFinder {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumProc lpfn, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);

    public static void FindWindows(uint targetPid) {
        EnumWindows((hWnd, lParam) => {
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            if (pid == targetPid) {
                StringBuilder title = new StringBuilder(256);
                StringBuilder cls = new StringBuilder(256);
                GetWindowText(hWnd, title, 256);
                GetClassName(hWnd, cls, 256);
                bool visible = IsWindowVisible(hWnd);
                Console.WriteLine("HWND: " + hWnd + " | Visible: " + visible + " | Cls: " + cls + " | Title: " + title);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
$qbw = Get-Process -Name qbw* -ErrorAction SilentlyContinue | Select-Object -First 1
if ($qbw) {
    Write-Host "PID de QBW: $($qbw.Id)"
    [QBWinFinder]::FindWindows($qbw.Id)
} else {
    Write-Host "No hay proceso QBW"
}
