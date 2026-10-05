[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;

public class ModalFinder {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumChildProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumChildProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool IsWindowEnabled(IntPtr hWnd);

    public static void FindAllModals(uint pid) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            uint procId;
            GetWindowThreadProcessId(hWnd, out procId);
            if (procId == pid) {
                StringBuilder sb = new StringBuilder(512);
                StringBuilder sc = new StringBuilder(256);
                GetWindowText(hWnd, sb, 512);
                GetClassName(hWnd, sc, 256);
                bool vis = IsWindowVisible(hWnd);
                bool en = IsWindowEnabled(hWnd);
                Console.WriteLine("HWND=" + hWnd + " VIS=" + vis + " EN=" + en + " CLASS=" + sc.ToString() + " TITLE='" + sb.ToString() + "'");

                EnumChildWindows(hWnd, (cWnd, clp) => {
                    StringBuilder cb = new StringBuilder(512);
                    StringBuilder cc = new StringBuilder(256);
                    GetWindowText(cWnd, cb, 512);
                    GetClassName(cWnd, cc, 256);
                    bool cvis = IsWindowVisible(cWnd);
                    bool cen = IsWindowEnabled(cWnd);
                    string t = cb.ToString().Trim();
                    if (!string.IsNullOrEmpty(t) || cvis) {
                        Console.WriteLine("   -> CHILD HWND=" + cWnd + " VIS=" + cvis + " EN=" + cen + " CLASS=" + cc.ToString() + " TEXT='" + t + "'");
                    }
                    return true;
                }, IntPtr.Zero);
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
$p = Get-Process QBW
[ModalFinder]::FindAllModals([uint32]$p.Id)
