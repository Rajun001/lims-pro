$csharp = @"
using System;
using System.Runtime.InteropServices;
using System.Security.Principal;

public class IntegrityChecker {
    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool OpenProcessToken(IntPtr ProcessHandle, uint DesiredAccess, out IntPtr TokenHandle);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr OpenProcess(uint processAccess, bool bInheritHandle, int processId);

    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool GetTokenInformation(IntPtr TokenHandle, int TokenInformationClass, IntPtr TokenInformation, int TokenInformationLength, out int ReturnLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool CloseHandle(IntPtr hObject);

    public const uint PROCESS_QUERY_LIMITED_INFORMATION = 0x1000;
    public const uint TOKEN_QUERY = 0x0008;
    public const int TokenIntegrityLevel = 25;

    public static void CheckIntegrity(int pid) {
        IntPtr hProc = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid);
        if (hProc == IntPtr.Zero) {
            Console.WriteLine("Could not open process: " + Marshal.GetLastWin32Error());
            return;
        }
        IntPtr hToken;
        if (!OpenProcessToken(hProc, TOKEN_QUERY, out hToken)) {
            Console.WriteLine("Could not open token: " + Marshal.GetLastWin32Error());
            CloseHandle(hProc);
            return;
        }

        int len = 0;
        GetTokenInformation(hToken, TokenIntegrityLevel, IntPtr.Zero, 0, out len);
        IntPtr pData = Marshal.AllocHGlobal(len);
        if (GetTokenInformation(hToken, TokenIntegrityLevel, pData, len, out len)) {
            IntPtr pSid = Marshal.ReadIntPtr(pData);
            IntPtr pSubAuthCount = GetSidSubAuthorityCount(pSid);
            byte count = Marshal.ReadByte(pSubAuthCount);
            IntPtr pSubAuth = GetSidSubAuthority(pSid, (byte)(count - 1));
            int rid = Marshal.ReadInt32(pSubAuth);
            Console.WriteLine("PID " + pid + " Integrity RID: 0x" + rid.ToString("X") + " (" + rid + ")");
        } else {
            Console.WriteLine("GetTokenInformation failed: " + Marshal.GetLastWin32Error());
        }
        Marshal.FreeHGlobal(pData);
        CloseHandle(hToken);
        CloseHandle(hProc);
    }

    [DllImport("advapi32.dll")]
    public static extern IntPtr GetSidSubAuthorityCount(IntPtr pSid);

    [DllImport("advapi32.dll")]
    public static extern IntPtr GetSidSubAuthority(IntPtr pSid, byte nSubAuthority);
}
"@

Add-Type -TypeDefinition $csharp
[IntegrityChecker]::CheckIntegrity(9028)
[IntegrityChecker]::CheckIntegrity([System.Diagnostics.Process]::GetCurrentProcess().Id)
