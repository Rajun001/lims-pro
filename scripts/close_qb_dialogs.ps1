Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class QBCloseHelper {
    [DllImport("user32.dll")]
    public static extern bool EnumThreadWindows(int dwThreadId, EnumThreadDelegate lpfn, IntPtr lParam);
    public delegate bool EnumThreadDelegate(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);

    public const uint WM_CLOSE = 0x0010;
    public const uint WM_KEYDOWN = 0x0100;
    public const uint WM_KEYUP = 0x0101;
    public const uint VK_ESCAPE = 0x1B;

    public static List<string> CloseDialogs(int[] threadIds) {
        List<string> results = new List<string>();
        foreach (int tid in threadIds) {
            EnumThreadWindows(tid, (hWnd, lParam) => {
                StringBuilder title = new StringBuilder(256);
                GetWindowText(hWnd, title, 256);
                StringBuilder cls = new StringBuilder(256);
                GetClassName(hWnd, cls, 256);
                string t = title.ToString();
                string c = cls.ToString();
                if (IsWindowVisible(hWnd) && !string.IsNullOrEmpty(t)) {
                    results.Add(string.Format("HWND: {0}, Class: {1}, Title: {2}", hWnd, c, t));
                    // If it is a dialog or child form (not the main window container)
                    if (c == "#32770" || t.Contains("Estimates") || t.Contains("Report") || t.Contains("QuickBooks") && t != "QuickBooks Enterprise Solutions: Accountant Edition 2024") {
                        // Send Escape and WM_CLOSE
                        PostMessage(hWnd, WM_KEYDOWN, (IntPtr)VK_ESCAPE, IntPtr.Zero);
                        PostMessage(hWnd, WM_KEYUP, (IntPtr)VK_ESCAPE, IntPtr.Zero);
                        PostMessage(hWnd, WM_CLOSE, IntPtr.Zero, IntPtr.Zero);
                        results.Add("--> Sent CLOSE to: " + t);
                    }
                }
                return true;
            }, IntPtr.Zero);
        }
        return results;
    }
}
"@

$proc = Get-Process -Name QBW -ErrorAction SilentlyContinue
if ($proc) {
    $threadIds = $proc.Threads | Select-Object -ExpandProperty Id
    Write-Host "Revisando $($threadIds.Count) hilos de QuickBooks..."
    $res = [QBCloseHelper]::CloseDialogs($threadIds)
    foreach ($r in $res) {
        Write-Host $r
    }
} else {
    Write-Host "QuickBooks no está ejecutándose."
}
