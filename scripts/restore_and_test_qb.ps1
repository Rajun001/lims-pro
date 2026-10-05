[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class WinRestorer {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern bool EnableWindow(IntPtr hWnd, bool bEnable);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const int SW_RESTORE = 9;
    public const int SW_SHOW = 5;
    public const uint WM_COMMAND = 0x0111;

    public static void RestoreAndEnable(IntPtr hWnd) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        EnableWindow(hWnd, true);
        ShowWindow(hWnd, SW_RESTORE);
        SetForegroundWindow(hWnd);
        Thread.Sleep(500);

        // Send Window -> Close All (331) to close any blocking child forms inside QB
        PostMessage(hWnd, WM_COMMAND, (IntPtr)331, IntPtr.Zero);
        Thread.Sleep(1000);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[WinRestorer]::RestoreAndEnable([IntPtr]6228972)

Write-Host "Ventana restaurada y habilitada. Probando conexión con RequestProcessor..."
try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    Write-Host "OpenConnection2 OK. Llamando a BeginSession('', 2)..."
    $ticket = $rp.BeginSession("", 2)
    Write-Host ">>> TICKET OBTENIDO: $ticket <<<" -ForegroundColor Green

    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <MaxReturned>5</MaxReturned>
      <FromTxnDate>2024-01-01</FromTxnDate>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    $res = $rp.ProcessRequest($ticket, $query)
    Write-Host ">>> EXITO AL PROCESAR QUERY! Longitud: $($res.Length) <<<" -ForegroundColor Green
    [System.IO.File]::WriteAllText("c:\lims-microlabs\scripts\qb_2024_real.xml", $res, [System.Text.Encoding]::UTF8)
    $rp.EndSession($ticket)
    $rp.CloseConnection()
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
