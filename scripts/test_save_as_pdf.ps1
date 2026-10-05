$cs = @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

public class PdfSaver {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    [DllImport("user32.dll")]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern IntPtr PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumDesktopWindows(IntPtr hDesktop, EnumDesktopWindowsProc lpfn, IntPtr lParam);
    public delegate bool EnumDesktopWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, string lParam);

    public const uint WM_COMMAND = 0x0111;
    public const uint WM_SETTEXT = 0x000C;
    public const uint BM_CLICK = 0x00F5;

    public static void SavePdf(IntPtr qbMain, IntPtr formHwnd, string targetPdfPath) {
        IntPtr hDesk = OpenDesktop("Default", 0, false, 0x01FF);
        SetThreadDesktop(hDesk);

        SetForegroundWindow(formHwnd);
        Thread.Sleep(300);

        Console.WriteLine("Enviando File -> Save as PDF (WM_COMMAND 1805)...");
        PostMessage(qbMain, WM_COMMAND, (IntPtr)1805, IntPtr.Zero);
        Thread.Sleep(2000);

        IntPtr saveDialogHwnd = IntPtr.Zero;
        EnumDesktopWindows(hDesk, (hWnd, lParam) => {
            if (!IsWindowVisible(hWnd)) return true;
            StringBuilder sb = new StringBuilder(512);
            StringBuilder sc = new StringBuilder(256);
            GetWindowText(hWnd, sb, 512);
            GetClassName(hWnd, sc, 256);
            string title = sb.ToString();
            string cls = sc.ToString();

            if (cls == "#32770" && (title.Contains("Save") || title.Contains("Guardar") || title.Contains("PDF"))) {
                saveDialogHwnd = hWnd;
                Console.WriteLine("Diálogo Save As encontrado: HWND " + hWnd + " Title: '" + title + "'");
                return false;
            }
            return true;
        }, IntPtr.Zero);

        if (saveDialogHwnd != IntPtr.Zero) {
            SetForegroundWindow(saveDialogHwnd);
            Thread.Sleep(300);

            // Find Edit control and Save button
            // In standard Windows Save dialog: Edit is usually ID 1148 or ID 1001, Button Save is ID 1
            Console.WriteLine("Escribiendo ruta destino: " + targetPdfPath);
        }
    }
}
"@

Add-Type -TypeDefinition $cs -Language CSharp
[PdfSaver]::SavePdf([IntPtr]6228972, [IntPtr]7407552, "c:\lims-microlabs\scripts\estimate_131474_qb.pdf")
