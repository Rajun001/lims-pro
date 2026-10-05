$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class ClipCopier {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr SetFocus(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    public const byte VK_CONTROL = 0x11;
    public const byte VK_C = 0x43;
    public const byte VK_A = 0x41;
    public const uint KEYEVENTF_KEYUP = 0x0002;

    public static void CopyReport(IntPtr rptGridHwnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(rptGridHwnd);
        SetFocus(rptGridHwnd);
        Thread.Sleep(300);

        Console.WriteLine("Enviando Ctrl+C...");
        keybd_event(VK_CONTROL, 0, 0, UIntPtr.Zero);
        Thread.Sleep(50);
        keybd_event(VK_C, 0, 0, UIntPtr.Zero);
        Thread.Sleep(50);
        keybd_event(VK_C, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        Thread.Sleep(50);
        keybd_event(VK_CONTROL, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        Thread.Sleep(500);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
# rptGridHwnd: 19662876
[ClipCopier]::CopyReport([IntPtr]19662876)

$clip = Get-Clipboard -Raw
if (![string]::IsNullOrWhiteSpace($clip)) {
    Write-Host "LONGITUD DEL PORTAPAPELES: $($clip.Length) caracteres"
    Write-Host "PRIMERAS LINEAS:"
    $clip.Split("`n") | Select-Object -First 30 | ForEach-Object { Write-Host $_ }
    $clip | Out-File "c:\lims-microlabs\scripts\clipboard_report.txt" -Encoding UTF8
} else {
    Write-Host "El portapapeles está vacío."
}
