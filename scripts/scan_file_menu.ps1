$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class FileMenuScanner {
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

    public static void ScanFileMenu(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        IntPtr hMenu = GetMenu(hWnd);
        IntPtr sub = GetSubMenu(hMenu, 0); // File menu
        int subCount = GetMenuItemCount(sub);
        Console.WriteLine("File menu item count: " + subCount);
        for (int j = 0; j < subCount; j++) {
            StringBuilder subSb = new StringBuilder(256);
            GetMenuString(sub, (uint)j, subSb, 256, MF_BYPOSITION);
            uint id = GetMenuItemID(sub, j);
            Console.WriteLine("  [" + j + "] ID=" + id + " : " + subSb.ToString());
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[FileMenuScanner]::ScanFileMenu([IntPtr]6228972)
