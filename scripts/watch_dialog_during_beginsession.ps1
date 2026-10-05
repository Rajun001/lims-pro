[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class WinWatcher {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumDesktopWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint BM_CLICK = 0x00F5;
    public const uint BM_SETCHECK = 0x00F1;
    public const uint BST_CHECKED = 1;

    public static volatile bool KeepRunning = true;

    public static void StartWatcher() {
        Thread t = new Thread(() => {
            IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
            SetThreadDesktop(hDesk);

            Console.WriteLine("[WATCHER] Observando ventanas en Desktop Default...");
            while (KeepRunning) {
                Thread.Sleep(200);
                EnumDesktopWindows(hDesk, (hWnd, lParam) => {
                    StringBuilder sb = new StringBuilder(512);
                    StringBuilder sc = new StringBuilder(256);
                    GetWindowText(hWnd, sb, 512);
                    GetClassName(hWnd, sc, 256);
                    string title = sb.ToString().Trim();
                    string cls = sc.ToString().Trim();

                    if (cls == "#32770" || title.Contains("QuickBooks") || title.Contains("Certificate") || title.Contains("Application") || title.Contains("Permitir") || title.Contains("Company File")) {
                        if (title != "MICROLABS  - Intuit QuickBooks Enterprise Solutions: Accountant 24.0(multi-user)(Admin)" && !title.Contains("Messenger")) {
                            Console.WriteLine("[WATCHER DETECTO]: HWND=" + hWnd + " Cls=" + cls + " Title='" + title + "'");
                            EnumChildWindows(hWnd, (cWnd, clParam) => {
                                StringBuilder cb = new StringBuilder(512);
                                GetWindowText(cWnd, cb, 512);
                                string ct = cb.ToString().Trim();
                                if (!string.IsNullOrEmpty(ct)) {
                                    Console.WriteLine("    CHILD HWND=" + cWnd + " TEXT='" + ct + "'");
                                    if (ct.Contains("Yes, whenever") || ct.Contains("whenever this") || ct.Contains("Yes, always")) {
                                        Console.WriteLine("    >>> CLIC EN RADIO 'YES': " + ct);
                                        SendMessage(cWnd, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
                                        SendMessage(cWnd, BM_SETCHECK, (IntPtr)BST_CHECKED, IntPtr.Zero);
                                    }
                                    if (ct.Equals("Continue", StringComparison.OrdinalIgnoreCase) || ct.Equals("Continuar", StringComparison.OrdinalIgnoreCase) || ct.Equals("Done", StringComparison.OrdinalIgnoreCase) || ct.Equals("Yes", StringComparison.OrdinalIgnoreCase)) {
                                        Console.WriteLine("    >>> CLIC EN BOTON: " + ct);
                                        SendMessage(cWnd, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
                                    }
                                }
                                return true;
                            }, IntPtr.Zero);
                        }
                    }
                    return true;
                }, IntPtr.Zero);
            }
        });
        t.IsBackground = true;
        t.Start();
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[WinWatcher]::StartWatcher()

Write-Host "Iniciando intento de BeginSession..."
try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsLIMS", "Microlabs LIMS System", 1)
    Write-Host "OpenConnection2 OK. Llamando BeginSession..."
    $ticket = $rp.BeginSession("C:\quickbooks2010\alimentos10.QBW", 2)
    Write-Host "[EXITO TOTAL] TICKET: $ticket" -ForegroundColor Green
    $rp.EndSession($ticket)
    $rp.CloseConnection()
} catch {
    Write-Host "[ERROR]: $($_.Exception.Message)" -ForegroundColor Red
}

[WinWatcher]::KeepRunning = $false
Write-Host "Prueba completada."
