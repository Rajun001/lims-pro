[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Threading;

public class QBCleaner {
    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_COMMAND = 0x0111;

    public static void CloseAll(IntPtr qbHwnd) {
        Console.WriteLine("Enviando Window -> Close All (WM_COMMAND 331) a HWND " + qbHwnd + "...");
        PostMessage(qbHwnd, WM_COMMAND, (IntPtr)331, IntPtr.Zero);
        Thread.Sleep(1000);
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[QBCleaner]::CloseAll([IntPtr]6228972)

Write-Host "Probando conexión COM con RequestProcessor..."
try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    Write-Host "OpenConnection2 OK. Probando BeginSession('', 2)..."
    $ticket = $rp.BeginSession("", 2)
    Write-Host "[EXITO TOTAL] Conectado a QuickBooks! Ticket: $ticket" -ForegroundColor Green

    # Query estimate 131474
    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <RefNumberFilter>
        <MatchCriterion>Contains</MatchCriterion>
        <RefNumber>131474</RefNumber>
      </RefNumberFilter>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
    Write-Host "Consultando Estimate 131474..."
    $res = $rp.ProcessRequest($ticket, $query)
    Write-Host "Resultado recibido: $($res.Length) caracteres"
    [System.IO.File]::WriteAllText("c:\lims-microlabs\scripts\qb_131474_found.xml", $res, [System.Text.Encoding]::UTF8)

    $rp.EndSession($ticket)
    $rp.CloseConnection()
} catch {
    Write-Host "[ERROR COM]: $($_.Exception.Message)" -ForegroundColor Red
}
