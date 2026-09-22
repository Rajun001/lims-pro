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

    public static void ExploreReports() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Contains("QuickBooks Enterprise") && title.Contains("MICROLABS")) {
                IntPtr hMenu = GetMenu(hWnd);
                IntPtr hRep = GetSubMenu(hMenu, 11); // Reports
                IntPtr hSales = GetSubMenu(hRep, 13); // Sales
                if (hSales != IntPtr.Zero) {
                    int count = GetMenuItemCount(hSales);
                    Console.WriteLine("Reports -> Sales count: " + count);
                    for (int i = 0; i < count; i++) {
                        StringBuilder ms = new StringBuilder(256);
                        GetMenuString(hSales, (uint)i, ms, 256, 0x0400);
                        uint id = GetMenuItemID(hSales, i);
                        Console.WriteLine("  Sales Item " + i + " (ID=" + id + "): " + ms.ToString());
                    }
                }
                
                IntPtr hCust = GetSubMenu(hRep, 14); // Jobs, Time & Mileage
                if (hCust != IntPtr.Zero) {
                    int count = GetMenuItemCount(hCust);
                    Console.WriteLine("Reports -> Jobs count: " + count);
                    for (int i = 0; i < count; i++) {
                        StringBuilder ms = new StringBuilder(256);
                        GetMenuString(hCust, (uint)i, ms, 256, 0x0400);
                        uint id = GetMenuItemID(hCust, i);
                        Console.WriteLine("  Jobs Item " + i + " (ID=" + id + "): " + ms.ToString());
                    }
                }
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[MenuExplorer]::ExploreReports()
