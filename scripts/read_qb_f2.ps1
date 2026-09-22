Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class QBWindowReader {
    public delegate bool EnumThreadDelegate(IntPtr hWnd, IntPtr lParam);
    public delegate bool EnumChildDelegate(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumThreadWindows(int dwThreadId, EnumThreadDelegate lpfn, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumChildDelegate lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public static void ReadAllWindows(int pid) {
        try {
            var p = System.Diagnostics.Process.GetProcessById(pid);
            foreach (System.Diagnostics.ProcessThread t in p.Threads) {
                EnumThreadWindows(t.Id, (hWnd, lParam) => {
                    StringBuilder sb = new StringBuilder(512);
                    StringBuilder sc = new StringBuilder(256);
                    GetWindowText(hWnd, sb, 512);
                    GetClassName(hWnd, sc, 256);
                    string title = sb.ToString();
                    if (!string.IsNullOrEmpty(title)) {
                        Console.WriteLine("==================================================");
                        Console.WriteLine("WINDOW: HWND={0}, Class={1}, Title='{2}'", hWnd, sc.ToString(), title);
                        Console.WriteLine("==================================================");

                        // Read all child texts
                        EnumChildWindows(hWnd, (cWnd, clParam) => {
                            StringBuilder cb = new StringBuilder(512);
                            StringBuilder cc = new StringBuilder(256);
                            GetWindowText(cWnd, cb, 512);
                            GetClassName(cWnd, cc, 256);
                            string cText = cb.ToString().Trim();
                            if (!string.IsNullOrEmpty(cText)) {
                                Console.WriteLine("  [Control] Class: {0} | Text: {1}", cc.ToString(), cText);
                            }
                            return true;
                        }, IntPtr.Zero);
                    }
                    return true;
                }, IntPtr.Zero);
            }
        } catch(Exception e) {
            Console.WriteLine("Error: " + e.Message);
        }
    }
}
"@

$proc = Get-Process -Name QBW -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "Leyendo todas las ventanas del proceso QBW (PID $($proc.Id))..."
    [QBWindowReader]::ReadAllWindows($proc.Id)
} else {
    Write-Host "No se encontró el proceso QBW."
}
