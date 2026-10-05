Add-Type @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Security.Principal;

public class ElevChecker {
    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool OpenProcessToken(IntPtr ProcessHandle, uint DesiredAccess, out IntPtr TokenHandle);

    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool GetTokenInformation(IntPtr TokenHandle, int TokenInformationClass, IntPtr TokenInformation, uint TokenInformationLength, out uint ReturnLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool CloseHandle(IntPtr hObject);

    public static void Check(int pid) {
        IntPtr hProc = Process.GetProcessById(pid).Handle;
        IntPtr hToken;
        if (OpenProcessToken(hProc, 8, out hToken)) {
            IntPtr pElev = Marshal.AllocHGlobal(4);
            uint retLen;
            if (GetTokenInformation(hToken, 20, pElev, 4, out retLen)) {
                int isElev = Marshal.ReadInt32(pElev);
                Console.WriteLine("Process PID " + pid + " Elevation: " + (isElev != 0 ? "ELEVATED (Admin)" : "STANDARD (Non-Admin)"));
            } else {
                Console.WriteLine("GetTokenInformation failed: " + Marshal.GetLastWin32Error());
            }
            Marshal.FreeHGlobal(pElev);
            CloseHandle(hToken);
        } else {
            Console.WriteLine("OpenProcessToken failed (access denied): " + Marshal.GetLastWin32Error());
        }
    }
}
"@

$qb = Get-Process QBW -ErrorAction SilentlyContinue
if ($qb) {
    [ElevChecker]::Check($qb.Id)
}
$curr = [System.Diagnostics.Process]::GetCurrentProcess()
[ElevChecker]::Check($curr.Id)
