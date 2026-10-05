[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class HeaderParentFinder {
    [DllImport("user32.dll")]
    public static extern IntPtr GetParent(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern int SendMessage(IntPtr hWnd, uint Msg, int wParam, int lParam);

    [DllImport("user32.dll")]
    public static extern int SendMessage(IntPtr hWnd, uint Msg, int wParam, StringBuilder lParam);

    public const uint LVM_GETITEMCOUNT = 0x1000 + 4;
    public const uint HDM_GETITEMCOUNT = 0x1200 + 0;

    public static void Inspect(IntPtr headerHwnd) {
        int colCount = SendMessage(headerHwnd, HDM_GETITEMCOUNT, 0, 0);
        Console.WriteLine("Header columns count: " + colCount);

        IntPtr parent = GetParent(headerHwnd);
        StringBuilder sb = new StringBuilder(256);
        StringBuilder sc = new StringBuilder(256);
        GetWindowText(parent, sb, 256);
        GetClassName(parent, sc, 256);
        Console.WriteLine("Parent HWND: " + parent + " | Class: " + sc.ToString() + " | Title: " + sb.ToString());

        int itemCount = SendMessage(parent, LVM_GETITEMCOUNT, 0, 0);
        Console.WriteLine("ListView item count: " + itemCount);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[HeaderParentFinder]::Inspect([IntPtr]2099164)
