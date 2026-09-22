Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class IifExporter {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumDesktopWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, string lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint WM_COMMAND = 0x0111;
    public const uint BM_SETCHECK = 0x00F1;
    public const uint BM_CLICK = 0x00F5;
    public const uint WM_SETTEXT = 0x000C;

    public static void DoExport() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        IntPtr exportHwnd = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Equals("Export", StringComparison.OrdinalIgnoreCase)) {
                exportHwnd = hWnd;
            }
            return true;
        }, IntPtr.Zero);

        if (exportHwnd == IntPtr.Zero) {
            Console.WriteLine("No se encontro la ventana Export");
            return;
        }

        Console.WriteLine("Ventana Export encontrada: HWND=" + exportHwnd);
        IntPtr hCust = IntPtr.Zero;
        IntPtr hItem = IntPtr.Zero;
        IntPtr hOk = IntPtr.Zero;

        EnumChildWindows(exportHwnd, (cWnd, clParam) => {
            StringBuilder cb = new StringBuilder(512);
            GetWindowText(cWnd, cb, 512);
            string txt = cb.ToString().Trim();
            if (txt.Contains("Customer List")) hCust = cWnd;
            else if (txt.Contains("Item List")) hItem = cWnd;
            else if (txt.Equals("OK", StringComparison.OrdinalIgnoreCase)) hOk = cWnd;
            return true;
        }, IntPtr.Zero);

        Console.WriteLine("Marcando Customer List (ID 104)...");
        SendMessage(hCust, BM_SETCHECK, (IntPtr)1, IntPtr.Zero);
        SendMessage(exportHwnd, WM_COMMAND, (IntPtr)104, hCust);

        Console.WriteLine("Marcando Item List (ID 110)...");
        SendMessage(hItem, BM_SETCHECK, (IntPtr)1, IntPtr.Zero);
        SendMessage(exportHwnd, WM_COMMAND, (IntPtr)110, hItem);

        Thread.Sleep(500);

        Console.WriteLine("Presionando OK (ID 51)...");
        SendMessage(exportHwnd, WM_COMMAND, (IntPtr)51, hOk);

        // Wait for Save As dialog to appear
        Console.WriteLine("Esperando dialogo Save As...");
        Thread.Sleep(2000);

        IntPtr saveDlg = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 512);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString().Trim();
            string cls = sc.ToString().Trim();
            if (cls.Contains("#32770") && (title.Contains("Export") || title.Contains("Save") || title.Contains("Guardar") || title.Contains("Browse"))) {
                saveDlg = hWnd;
                Console.WriteLine("Dialogo de guardado detectado: " + title + " (HWND=" + hWnd + ")");
            }
            return true;
        }, IntPtr.Zero);

        if (saveDlg != IntPtr.Zero) {
            IntPtr editBox = IntPtr.Zero;
            IntPtr saveBtn = IntPtr.Zero;

            EnumChildWindows(saveDlg, (cWnd, clParam) => {
                StringBuilder cb = new StringBuilder(512);
                StringBuilder cc = new StringBuilder(256);
                GetWindowText(cWnd, cb, 512);
                GetClassName(cWnd, cc, 256);
                string txt = cb.ToString().Trim();
                string cls = cc.ToString().Trim();

                if (cls.Equals("Edit", StringComparison.OrdinalIgnoreCase)) {
                    editBox = cWnd;
                } else if (txt.Contains("Save") || txt.Contains("Guardar") || txt.Equals("&Save") || txt.Equals("&Guardar")) {
                    saveBtn = cWnd;
                }
                return true;
            }, IntPtr.Zero);

            string destFile = @"C:\lims-microlabs\quickbooks_alimentos10.iif";
            if (editBox != IntPtr.Zero) {
                Console.WriteLine("Configurando nombre de archivo en Edit (HWND=" + editBox + "): " + destFile);
                SendMessage(editBox, WM_SETTEXT, IntPtr.Zero, destFile);
                Thread.Sleep(500);
            }

            if (saveBtn != IntPtr.Zero) {
                Console.WriteLine("Haciendo clic en Guardar (HWND=" + saveBtn + ")...");
                SendMessage(saveBtn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
            }
        }
    }
}
"@

[IifExporter]::DoExport()
