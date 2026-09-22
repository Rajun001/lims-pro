Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinStaChecker {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr GetProcessWindowStation();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr GetThreadDesktop(uint dwThreadId);

    [DllImport("kernel32.dll")]
    public static extern uint GetCurrentThreadId();

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool GetUserObjectInformation(IntPtr hObj, int nIndex, StringBuilder pvInfo, uint nLength, out uint lpnLengthNeeded);

    public static void Check() {
        IntPtr hWs = GetProcessWindowStation();
        StringBuilder sbWs = new StringBuilder(256);
        uint len;
        GetUserObjectInformation(hWs, 2, sbWs, 256, out len); // 2 = UOI_NAME
        Console.WriteLine("Process Window Station: " + sbWs.ToString());

        IntPtr hDesk = GetThreadDesktop(GetCurrentThreadId());
        StringBuilder sbDesk = new StringBuilder(256);
        GetUserObjectInformation(hDesk, 2, sbDesk, 256, out len);
        Console.WriteLine("Thread Desktop: " + sbDesk.ToString());
    }
}
"@

[WinStaChecker]::Check()
