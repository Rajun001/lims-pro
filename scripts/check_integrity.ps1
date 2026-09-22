Add-Type @"
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

public class TokenChecker {
    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool OpenProcessToken(IntPtr ProcessHandle, uint DesiredAccess, out IntPtr TokenHandle);

    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern bool GetTokenInformation(IntPtr TokenHandle, int TokenInformationClass, IntPtr TokenInformation, uint TokenInformationLength, out uint ReturnLength);

    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern IntPtr GetSidSubAuthority(IntPtr pSid, uint nSubAuthority);

    [DllImport("advapi32.dll", SetLastError = true)]
    public static extern IntPtr GetSidSubAuthorityCount(IntPtr pSid);

    [DllImport("kernel32.dll")]
    public static extern bool CloseHandle(IntPtr hObject);

    public const uint TOKEN_QUERY = 0x0008;

    public static void CheckProcess(int pid) {
        Process p = Process.GetProcessById(pid);
        IntPtr hToken;
        if (!OpenProcessToken(p.Handle, TOKEN_QUERY, out hToken)) {
            Console.WriteLine("Could not open token: " + Marshal.GetLastWin32Error());
            return;
        }

        uint len;
        GetTokenInformation(hToken, 25, IntPtr.Zero, 0, out len); // 25 = TokenIntegrityLevel
        IntPtr pTil = Marshal.AllocHGlobal((int)len);
        if (GetTokenInformation(hToken, 25, pTil, len, out len)) {
            IntPtr pSid = Marshal.ReadIntPtr(pTil);
            byte count = Marshal.ReadByte(GetSidSubAuthorityCount(pSid));
            int rid = Marshal.ReadInt32(GetSidSubAuthority(pSid, (uint)(count - 1)));
            Console.WriteLine("Process PID=" + pid + " (" + p.ProcessName + ") Integrity Level RID=" + rid);
            if (rid == 0x2000) Console.WriteLine("Level: Medium (Standard User)");
            else if (rid == 0x3000) Console.WriteLine("Level: High (Administrator)");
            else if (rid == 0x4000) Console.WriteLine("Level: System");
        } else {
            Console.WriteLine("GetTokenInformation failed: " + Marshal.GetLastWin32Error());
        }
        Marshal.FreeHGlobal(pTil);
        CloseHandle(hToken);
    }
}
"@

$qb = Get-Process QBW -ErrorAction SilentlyContinue
if ($qb) {
    [TokenChecker]::CheckProcess($qb.Id)
}
[TokenChecker]::CheckProcess($PID)
