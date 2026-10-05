$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class PdfFinalizer {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, string lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_SETTEXT = 0x000C;
    public const uint BM_CLICK = 0x00F5;

    public static void SaveFile(IntPtr dlgHwnd, IntPtr editHwnd, IntPtr saveBtnHwnd, string fullPath) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(dlgHwnd);
        Thread.Sleep(200);

        Console.WriteLine("Escribiendo ruta: " + fullPath);
        SendMessage(editHwnd, WM_SETTEXT, IntPtr.Zero, fullPath);
        Thread.Sleep(300);

        Console.WriteLine("Haciendo clic en '&Save'...");
        SendMessage(saveBtnHwnd, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        PostMessage(saveBtnHwnd, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        Thread.Sleep(2500);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
$targetPath = "C:\lims-microlabs\scripts\131474_Patricia_Bonilla.pdf"
[PdfFinalizer]::SaveFile([IntPtr]12256932, [IntPtr]5116706, [IntPtr]6032788, $targetPath)

if (Test-Path $targetPath) {
    $item = Get-Item $targetPath
    Write-Host "¡¡¡EXITO TOTAL!!! ARCHIVO GENERADO POR QUICKBOOKS:" -ForegroundColor Green
    Write-Host "Ruta: $($item.FullName)"
    Write-Host "Tamaño: $($item.Length) bytes"
    Write-Host "Fecha: $($item.LastWriteTime)"
} else {
    Write-Host "Esperando escritura del archivo..."
}
