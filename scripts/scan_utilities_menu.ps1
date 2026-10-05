$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class UtilScanner {
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

    public static void Scan(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        IntPtr hMenu = GetMenu(hWnd);
        IntPtr fileMenu = GetSubMenu(hMenu, 0); // File

        // Utilities is [11]
        IntPtr utilMenu = GetSubMenu(fileMenu, 11);
        if (utilMenu != IntPtr.Zero) {
            int cnt = GetMenuItemCount(utilMenu);
            Console.WriteLine("--- Utilities items (" + cnt + ") ---");
            for (int i = 0; i < cnt; i++) {
                StringBuilder sb = new StringBuilder(256);
                GetMenuString(utilMenu, (uint)i, sb, 256, MF_BYPOSITION);
                uint id = GetMenuItemID(utilMenu, i);
                Console.WriteLine("  [" + i + "] ID=" + id + " : " + sb.ToString());

                IntPtr subSub = GetSubMenu(utilMenu, i);
                if (subSub != IntPtr.Zero) {
                    int subCnt = GetMenuItemCount(subSub);
                    for (int k = 0; k < subCnt; k++) {
                        StringBuilder ssb = new StringBuilder(256);
                        GetMenuString(subSub, (uint)k, ssb, 256, MF_BYPOSITION);
                        uint sid = GetMenuItemID(subSub, k);
                        Console.WriteLine("      sub [" + k + "] ID=" + sid + " : " + ssb.ToString());
                    }
                }
            }
        }

        // App Management is [23]
        IntPtr appMenu = GetSubMenu(fileMenu, 23);
        if (appMenu != IntPtr.Zero) {
            int cnt = GetMenuItemCount(appMenu);
            Console.WriteLine("--- App Management items (" + cnt + ") ---");
            for (int i = 0; i < cnt; i++) {
                StringBuilder sb = new StringBuilder(256);
                GetMenuString(appMenu, (uint)i, sb, 256, MF_BYPOSITION);
                uint id = GetMenuItemID(appMenu, i);
                Console.WriteLine("  [" + i + "] ID=" + id + " : " + sb.ToString());
            }
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[UtilScanner]::Scan([IntPtr]6228972)
