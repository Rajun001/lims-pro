$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class ReportScanner {
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

    public static void ScanReports(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        IntPtr hMenu = GetMenu(hWnd);
        IntPtr repMenu = GetSubMenu(hMenu, 11); // Reports is [11]

        int cnt = GetMenuItemCount(repMenu);
        Console.WriteLine("Reports top count: " + cnt);

        for (int i = 0; i < cnt; i++) {
            StringBuilder sb = new StringBuilder(256);
            GetMenuString(repMenu, (uint)i, sb, 256, MF_BYPOSITION);
            string title = sb.ToString();

            IntPtr sub = GetSubMenu(repMenu, i);
            if (sub != IntPtr.Zero) {
                int subCnt = GetMenuItemCount(sub);
                for (int j = 0; j < subCnt; j++) {
                    StringBuilder ssb = new StringBuilder(256);
                    GetMenuString(sub, (uint)j, ssb, 256, MF_BYPOSITION);
                    uint sid = GetMenuItemID(sub, j);
                    string itemText = ssb.ToString();
                    if (itemText.Contains("Estimate") || itemText.Contains("Estimado") || itemText.Contains("Presupuesto") || itemText.Contains("Sales") || itemText.Contains("Detail") || itemText.Contains("Custom")) {
                        Console.WriteLine("[" + title + "] -> ID=" + sid + " : " + itemText);
                    }
                }
            }
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[ReportScanner]::ScanReports([IntPtr]6228972)
