$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class ReportCopier {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_COMMAND = 0x0111;

    public static void Copy(IntPtr qbMain, IntPtr rptHwnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(qbMain);
        SetForegroundWindow(rptHwnd);
        Thread.Sleep(300);

        Console.WriteLine("Enviando WM_COMMAND 125 (Edit -> Copy)...");
        SendMessage(qbMain, WM_COMMAND, (IntPtr)125, IntPtr.Zero);
        Thread.Sleep(1000);
    }
}
"@

# Clear clipboard first
Set-Clipboard -Value ""

Add-Type -TypeDefinition $cs -Language CSharp
[ReportCopier]::Copy([IntPtr]6228972, [IntPtr]11340518)

$clip = Get-Clipboard -Raw
if (![string]::IsNullOrWhiteSpace($clip)) {
    Write-Host "LONGITUD: $($clip.Length)"
    Write-Host "MUESTRA DE TEXTO:"
    $clip.Split("`n") | Select-Object -First 25 | ForEach-Object { Write-Host $_ }
    $clip | Out-File "c:\lims-microlabs\scripts\report_export.txt" -Encoding UTF8
} else {
    Write-Host "El portapapeles sigue vacío."
}
