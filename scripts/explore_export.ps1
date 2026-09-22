Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class MenuExplorer {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern IntPtr GetMenu(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern int GetMenuItemCount(IntPtr hMenu);

    [DllImport("user32.dll")]
    public static extern int GetMenuString(IntPtr hMenu, uint uIDItem, StringBuilder lpString, int nMaxCount, uint uFlag);

    [DllImport("user32.dll")]
    public static extern IntPtr GetSubMenu(IntPtr hMenu, int nPos);

    [DllImport("user32.dll")]
    public static extern uint GetMenuItemID(IntPtr hMenu, int nPos);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public static void ExploreExport() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Contains("QuickBooks Enterprise") && title.Contains("MICROLABS")) {
                IntPtr hMenu = GetMenu(hWnd);
                IntPtr hFile = GetSubMenu(hMenu, 0);
                IntPtr hUtils = GetSubMenu(hFile, 11);
                IntPtr hExport = GetSubMenu(hUtils, 1);
                int count = GetMenuItemCount(hExport);
                Console.WriteLine("Export menu items count: " + count);
                for (int i = 0; i < count; i++) {
                    StringBuilder ms = new StringBuilder(256);
                    GetMenuString(hExport, (uint)i, ms, 256, 0x0400);
                    uint id = GetMenuItemID(hExport, i);
                    Console.WriteLine("  Export Item " + i + " (ID=" + id + "): " + ms.ToString());
                }
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[MenuExplorer]::ExploreExport()
