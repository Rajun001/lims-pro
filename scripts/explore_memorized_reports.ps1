Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class MemorizedReportExplorer {
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

    public static void ExploreMemorized() {
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
                IntPtr hMem = GetSubMenu(hRep, 1); // Memorized Reports
                if (hMem != IntPtr.Zero) {
                    int count = GetMenuItemCount(hMem);
                    Console.WriteLine("Memorized Reports count: " + count);
                    for (int i = 0; i < count; i++) {
                        StringBuilder ms = new StringBuilder(256);
                        GetMenuString(hMem, (uint)i, ms, 256, 0x0400);
                        uint id = GetMenuItemID(hMem, i);
                        Console.WriteLine("  Mem Report Item " + i + " (ID=" + id + "): " + ms.ToString());
                        if (id == 4294967295) {
                            IntPtr hSubSub = GetSubMenu(hMem, i);
                            if (hSubSub != IntPtr.Zero) {
                                int subCount = GetMenuItemCount(hSubSub);
                                for (int j = 0; j < subCount; j++) {
                                    StringBuilder sms = new StringBuilder(256);
                                    GetMenuString(hSubSub, (uint)j, sms, 256, 0x0400);
                                    uint subId = GetMenuItemID(hSubSub, j);
                                    Console.WriteLine("     SubItem " + j + " (ID=" + subId + "): " + sms.ToString());
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

[MemorizedReportExplorer]::ExploreMemorized()
