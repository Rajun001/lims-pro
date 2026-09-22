[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csharp = @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public class WinCloser {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumDesktopWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint BM_CLICK = 0x00F5;
    public const uint WM_CLOSE = 0x0010;

    public static void CloseProductInformation() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            if (sb.ToString().Equals("Product Information", StringComparison.OrdinalIgnoreCase)) {
                Console.WriteLine("Cerrando ventana modal 'Product Information'...");
                EnumChildWindows(hWnd, (cWnd, clParam) => {
                    StringBuilder cb = new StringBuilder(512);
                    GetWindowText(cWnd, cb, 512);
                    if (cb.ToString().Trim().Equals("OK", StringComparison.OrdinalIgnoreCase)) {
                        SendMessage(cWnd, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
                        Console.WriteLine("Boton OK presionado.");
                    }
                    return true;
                }, IntPtr.Zero);
                SendMessage(hWnd, WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
            }
            return true;
        }, IntPtr.Zero);
    }
}
'@

Add-Type -TypeDefinition $csharp -ErrorAction SilentlyContinue

# 1. Cerrar ventana modal F2 si sigue abierta
try {
    [WinCloser]::CloseProductInformation()
} catch {}
Start-Sleep -Milliseconds 500

# 2. Conectar con QuickBooks
$companyFile = "C:\quickbooks2010\alimentos10.QBW"
$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"

Write-Host "Abriendo canal de conexion con QuickBooks..." -ForegroundColor Yellow
$rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
Write-Host "[OK] OpenConnection2 completado." -ForegroundColor Green

Write-Host "Iniciando sesion con archivo abierto..." -ForegroundColor Yellow
$ticket = $null
$attempts = 0
while ($attempts -lt 15 -and [string]::IsNullOrEmpty($ticket)) {
    $attempts++
    try {
        $ticket = $rp.BeginSession($companyFile, 2)
        Write-Host "`n[EXITO TOTAL] Sesion iniciada con QuickBooks! Ticket: $ticket" -ForegroundColor Green
        break
    } catch {
        $msg = $_.Exception.Message
        Write-Host "Intento $attempts : $msg" -ForegroundColor Gray
        Start-Sleep -Seconds 1
    }
}

if ([string]::IsNullOrEmpty($ticket)) {
    Write-Host "[ERROR] No se pudo obtener el ticket de sesion." -ForegroundColor Red
    $rp.CloseConnection()
    exit 1
}

# 3. Probar consulta de 5 clientes
Write-Host "`nConsultando primeros clientes de la base de datos..." -ForegroundColor Yellow
$query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <CustomerQueryRq requestID="1">
      <MaxReturned>5</MaxReturned>
    </CustomerQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@

$resp = $rp.ProcessRequest($ticket, $query)
$rp.EndSession($ticket)
$rp.CloseConnection()

[xml]$xml = $resp
$customers = $xml.SelectNodes("//CustomerRet")
Write-Host "[EXITO] Clientes recibidos de QuickBooks:" -ForegroundColor Green
foreach ($c in $customers) {
    Write-Host " - ListID: $($c.ListID) | Nombre: $($c.FullName) | Saldo: $($c.TotalBalance)" -ForegroundColor Cyan
}

Write-Host "`nCONEXION VALIDADA AL 100%! El conector nativo esta listo para la extraccion logica." -ForegroundColor Green
