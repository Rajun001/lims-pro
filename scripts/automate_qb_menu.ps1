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

    public static void ExploreFirstMenus() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Contains("QuickBooks Enterprise") && title.Contains("MICROLABS")) {
                Console.WriteLine("Main Window: " + title + " (HWND=" + hWnd + ")");
                IntPtr hMenu = GetMenu(hWnd);
                for (uint i = 0; i < 4; i++) {
                    StringBuilder ms = new StringBuilder(256);
                    GetMenuString(hMenu, i, ms, 256, 0x0400);
                    Console.WriteLine("Menu " + i + ": " + ms.ToString());
                    IntPtr hSub = GetSubMenu(hMenu, (int)i);
                    if (hSub != IntPtr.Zero) {
                        int subCount = GetMenuItemCount(hSub);
                        for (int j = 0; j < subCount; j++) {
                            StringBuilder sms = new StringBuilder(256);
                            GetMenuString(hSub, (uint)j, sms, 256, 0x0400);
                            uint id = GetMenuItemID(hSub, j);
                            Console.WriteLine("   Item " + j + " (ID=" + id + "): " + sms.ToString());
                            if (id == 4294967295) { // Submenu
                                IntPtr hSubSub = GetSubMenu(hSub, j);
                                if (hSubSub != IntPtr.Zero) {
                                    int ssc = GetMenuItemCount(hSubSub);
                                    for (int k = 0; k < ssc; k++) {
                                        StringBuilder ssms = new StringBuilder(256);
                                        GetMenuString(hSubSub, (uint)k, ssms, 256, 0x0400);
                                        uint ssid = GetMenuItemID(hSubSub, k);
                                        Console.WriteLine("       SubItem " + k + " (ID=" + ssid + "): " + ssms.ToString());
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return true;
        }, IntPtr.Zero);
    }
}
"@

[MenuExplorer]::ExploreFirstMenus()
