using namespace System.Text
using namespace System.Collections.Generic

$csharp = @"
using System;
using System.Text;
using System.Collections.Generic;
using System.Runtime.InteropServices;

public class WinFinder {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWnd, EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static void ListWindows(uint pid) {
        EnumWindows((hWnd, lParam) => {
            uint procId;
            GetWindowThreadProcessId(hWnd, out procId);
            if (procId == pid && IsWindowVisible(hWnd)) {
                StringBuilder title = new StringBuilder(512);
                GetWindowText(hWnd, title, 512);
                StringBuilder cls = new StringBuilder(512);
                GetClassName(hWnd, cls, 512);
                Console.WriteLine("HWND: " + hWnd + " | Class: " + cls.ToString() + " | Title: " + title.ToString());
            }
            return true;
        }, IntPtr.Zero);
    }

    public static void ListChildren(IntPtr parent) {
        EnumChildWindows(parent, (hWnd, lParam) => {
            StringBuilder title = new StringBuilder(512);
            GetWindowText(hWnd, title, 512);
            StringBuilder cls = new StringBuilder(512);
            GetClassName(hWnd, cls, 512);
            if (IsWindowVisible(hWnd)) {
                Console.WriteLine("  Child HWND: " + hWnd + " | Class: " + cls.ToString() + " | Text: " + title.ToString());
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $csharp

$qbProc = Get-Process -Name QBW -ErrorAction SilentlyContinue
if ($qbProc) {
    Write-Host "QuickBooks PID: $($qbProc.Id)"
    [WinFinder]::ListWindows([uint32]$qbProc.Id)
} else {
    Write-Host "QuickBooks not running"
}
