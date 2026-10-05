[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class MenuScanner {
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

    public const uint MF_BYPOSITION = 0x0400;

    public static void ScanMenus(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        IntPtr hMenu = GetMenu(hWnd);
        if (hMenu == IntPtr.Zero) {
            Console.WriteLine("GetMenu returned Zero");
            return;
        }

        int topCount = GetMenuItemCount(hMenu);
        Console.WriteLine("Top menus: " + topCount);
        for (int i = 0; i < topCount; i++) {
            StringBuilder sb = new StringBuilder(256);
            GetMenuString(hMenu, (uint)i, sb, 256, MF_BYPOSITION);
            string topTitle = sb.ToString();
            Console.WriteLine("[" + i + "] " + topTitle);

            IntPtr sub = GetSubMenu(hMenu, i);
            if (sub != IntPtr.Zero) {
                int subCount = GetMenuItemCount(sub);
                for (int j = 0; j < subCount; j++) {
                    StringBuilder subSb = new StringBuilder(256);
                    GetMenuString(sub, (uint)j, subSb, 256, MF_BYPOSITION);
                    uint id = GetMenuItemID(sub, j);
                    string itemText = subSb.ToString();
                    if (!string.IsNullOrEmpty(itemText)) {
                        Console.WriteLine("    [" + j + "] ID=" + id + " : " + itemText);
                    }
                }
            }
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[MenuScanner]::ScanMenus([IntPtr]6228972)
