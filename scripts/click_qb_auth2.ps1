
Add-Type @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public class QBAuthHelper2 {
    public delegate bool EnumWindowProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool EnumChildWindows(IntPtr hWndParent, EnumWindowProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern IntPtr SendMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

    public const uint BM_CLICK = 0x00F5;

    public static List<string> ClickAuth(IntPtr parentHwnd) {
        List<string> list = new List<string>();
        IntPtr continueBtn = IntPtr.Zero;
        IntPtr yesRadio = IntPtr.Zero;

        EnumChildWindows(parentHwnd, (hWnd, lParam) => {
            StringBuilder text = new StringBuilder(256);
            GetWindowText(hWnd, text, 256);
            StringBuilder cls = new StringBuilder(256);
            GetClassName(hWnd, cls, 256);
            string sText = text.ToString();
            string cleanText = sText.Replace("&", "");
            list.Add(string.Format("Child HWND: {0}, Class: {1}, Text: '{2}'", hWnd, cls.ToString(), sText));

            if (cleanText.Contains("Yes, whenever")) {
                yesRadio = hWnd;
            }
            if (cleanText.Equals("Continue", StringComparison.OrdinalIgnoreCase) || cleanText.Equals("Done", StringComparison.OrdinalIgnoreCase) || cleanText.Equals("OK", StringComparison.OrdinalIgnoreCase)) {
                continueBtn = hWnd;
            }
            return true;
        }, IntPtr.Zero);

        if (yesRadio != IntPtr.Zero) {
            SendMessage(yesRadio, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
            list.Add("--> Clicked YES radio: " + yesRadio);
        }
        if (continueBtn != IntPtr.Zero) {
            SendMessage(continueBtn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
            PostMessage(continueBtn, BM_CLICK, IntPtr.Zero, IntPtr.Zero);
            list.Add("--> Clicked CONTINUE/DONE button: " + continueBtn);
        }

        return list;
    }
}
"@

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WindowFinder2 {
    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
}
"@

$hwnd = [WindowFinder2]::FindWindow("MauiForm", "Application permission")
if ($hwnd -eq [IntPtr]::Zero) {
    # Buscar enumerando hilos
    $proc = Get-Process -Name QBW -ErrorAction SilentlyContinue
    if ($proc) {
        $threadIds = $proc.Threads | Select-Object -ExpandProperty Id
        foreach ($tid in $threadIds) {
            [QBCloseHelper]::EnumThreadWindows($tid, {
                param($h, $l)
                $sb = New-Object System.Text.StringBuilder 256
                [QBCloseHelper]::GetWindowText($h, $sb, 256) | Out-Null
                $t = $sb.ToString()
                if ($t -like "*permission*" -or $t -like "*Certificate*") {
                    $global:foundHwnd = $h
                }
                return $true
            }, [IntPtr]::Zero)
        }
        $hwnd = $global:foundHwnd
    }
}

Write-Host "Target HWND: $hwnd"
if ($hwnd -and $hwnd -ne [IntPtr]::Zero) {
    $res = [QBAuthHelper2]::ClickAuth($hwnd)
    foreach ($r in $res) {
        Write-Host $r
    }
}
