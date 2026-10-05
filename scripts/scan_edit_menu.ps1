$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class EditMenuScanner {
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

    public static void ScanEdit(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        IntPtr hMenu = GetMenu(hWnd);
        IntPtr editMenu = GetSubMenu(hMenu, 1); // Edit is [1]
        int cnt = GetMenuItemCount(editMenu);
        Console.WriteLine("Edit menu items (" + cnt + "):");
        for (int i = 0; i < cnt; i++) {
            StringBuilder sb = new StringBuilder(256);
            GetMenuString(editMenu, (uint)i, sb, 256, MF_BYPOSITION);
            uint id = GetMenuItemID(editMenu, i);
            Console.WriteLine("  [" + i + "] ID=" + id + " : " + sb.ToString());
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[EditMenuScanner]::ScanEdit([IntPtr]6228972)
