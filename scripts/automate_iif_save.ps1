Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class IifSaver {
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

    public const uint BM_CLICK = 0x00F5;
    public const uint WM_SETTEXT = 0x000C;

    public static void SaveIif() {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        if (hDesk == IntPtr.Zero) return;
        SetThreadDesktop(hDesk);

        IntPtr exportHwnd = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            if (sb.ToString().Equals("Export", StringComparison.OrdinalIgnoreCase)) {
                exportHwnd = hWnd;
            }
            return true;
        }, IntPtr.Zero);

        if (exportHwnd == IntPtr.Zero) {
            Console.WriteLine("No se encontro la ventana 'Export'");
            return;
        }

        Console.WriteLine("Ventana Export encontrada HWND=" + exportHwnd);
        IntPtr custChk = IntPtr.Zero;
        IntPtr itemChk = IntPtr.Zero;
        IntPtr okBtn = IntPtr.Zero;

        EnumChildWindows(exportHwnd, (cWnd, clParam) => {
            StringBuilder cb = new StringBuilder(512);
            GetWindowText(cWnd, cb, 512);
            string txt = cb.ToString().Trim();
            if (txt.Contains("Customer List")) custChk = cWnd;
            else if (txt.Contains("Item List")) itemChk = cWnd;
            else if (txt.Equals("OK", StringComparison.OrdinalIgnoreCase)) okBtn = cWnd;
            return true;
        }, IntPtr.Zero);

        if (custChk != IntPtr.Zero) {
            Console.WriteLine("Marcando Customer List (HWND=" + custChk + ")...");
            SendMessage(custChk, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        }
        if (itemChk != IntPtr.Zero) {
            Console.WriteLine("Marcando Item List (HWND=" + itemChk + ")...");
            SendMessage(itemChk, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        }

        Thread.Sleep(500);

        if (okBtn != IntPtr.Zero) {
            Console.WriteLine("Haciendo click en OK (HWND=" + okBtn + ")...");
            SendMessage(okBtn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
        }

        // Wait for Save As dialog
        Thread.Sleep(2000);

        IntPtr saveAsHwnd = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            StringBuilder sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, 512);
            string title = sb.ToString().Trim();
            if (title.Contains("Export") || title.Contains("Save") || title.Contains("Guardar")) {
                StringBuilder sc = new StringBuilder(256);
                GetClassName(hWnd, sc, 256);
                if (sc.ToString().Contains("#32770")) { // Standard dialog class
                    saveAsHwnd = hWnd;
                    Console.WriteLine("Dialogo Save As encontrado: " + title + " (HWND=" + hWnd + ")");
                }
            }
            return true;
        }, IntPtr.Zero);

        if (saveAsHwnd != IntPtr.Zero) {
            IntPtr editHwnd = IntPtr.Zero;
            IntPtr saveBtn = IntPtr.Zero;

            EnumChildWindows(saveAsHwnd, (cWnd, clParam) => {
                StringBuilder cb = new StringBuilder(512);
                StringBuilder cc = new StringBuilder(256);
                GetWindowText(cWnd, cb, 512);
                GetClassName(cWnd, cc, 256);
                string txt = cb.ToString().Trim();
                string cls = cc.ToString().Trim();

                if (cls.Equals("Edit", StringComparison.OrdinalIgnoreCase)) {
                    editHwnd = cWnd;
                } else if (txt.Contains("Save") || txt.Contains("Guardar")) {
                    saveBtn = cWnd;
                }
                return true;
            }, IntPtr.Zero);

            string targetFile = @"C:\lims-microlabs\quickbooks_alimentos10.iif";
            if (editHwnd != IntPtr.Zero) {
                Console.WriteLine("Estableciendo ruta de guardado en Edit HWND=" + editHwnd + " : " + targetFile);
                SendMessage(editHwnd, WM_SETTEXT, IntPtr.Zero, targetFile);
                Thread.Sleep(500);
            }

            if (saveBtn != IntPtr.Zero) {
                Console.WriteLine("Haciendo click en Guardar HWND=" + saveBtn + "...");
                SendMessage(saveBtn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
            }
        }
    }
}
"@

[IifSaver]::SaveIif()
