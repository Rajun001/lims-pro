$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class MenuExplorer {
    [DllImport("user32.dll")]
    public static extern IntPtr GetMenu(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr GetSubMenu(IntPtr hMenu, int nPos);

    [DllImport("user32.dll")]
    public static extern int GetMenuItemCount(IntPtr hMenu);

    [DllImport("user32.dll")]
    public static extern uint GetMenuItemID(IntPtr hMenu, int nPos);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetMenuString(IntPtr hMenu, uint uID, StringBuilder lpString, int nMaxCount, uint uFlag);

    public const uint MF_BYPOSITION = 0x0400;

    public static void ExploreMenus(IntPtr hWnd) {
        IntPtr hMenu = GetMenu(hWnd);
        if (hMenu == IntPtr.Zero) {
            Console.WriteLine("No standard Win32 menu on window " + hWnd);
            return;
        }

        int count = GetMenuItemCount(hMenu);
        Console.WriteLine("Top menu count: " + count);

        for (int i = 0; i < count; i++) {
            StringBuilder sb = new StringBuilder(256);
            GetMenuString(hMenu, (uint)i, sb, 256, MF_BYPOSITION);
            string topText = sb.ToString();
            Console.WriteLine("Top Menu [" + i + "]: " + topText);

            IntPtr hSub = GetSubMenu(hMenu, i);
            if (hSub != IntPtr.Zero) {
                int subCount = GetMenuItemCount(hSub);
                for (int j = 0; j < subCount; j++) {
                    StringBuilder subSb = new StringBuilder(256);
                    GetMenuString(hSub, (uint)j, subSb, 256, MF_BYPOSITION);
                    uint id = GetMenuItemID(hSub, j);
                    string subText = subSb.ToString();
                    if (subText.Contains("Single") || subText.Contains("Multi") || subText.Contains("User") || subText.Contains("Preferences") || subText.Contains("Export") || subText.Contains("Utilities")) {
                        Console.WriteLine("   -> Item [" + j + "]: ID=" + id + " Text='" + subText + "'");
                    }
                }
            }
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[MenuExplorer]::ExploreMenus([IntPtr]6228972)
