[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$csharp = @'
using System;
using System.Runtime.InteropServices;
using System.Threading;
using System.Reflection;

public class QbRunner {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr OpenDesktop(string lpszDesktop, uint dwFlags, bool fInherit, uint dwDesiredAccess);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool SetThreadDesktop(IntPtr hDesktop);

    public const uint DESKTOP_ALL = 0x01FF;

    public static void RunQbTask() {
        Thread t = new Thread(() => {
            IntPtr hDesk = OpenDesktop("Default", 0, false, DESKTOP_ALL);
            if (hDesk == IntPtr.Zero) {
                Console.WriteLine("OpenDesktop failed: " + Marshal.GetLastWin32Error());
                return;
            }
            bool ok = SetThreadDesktop(hDesk);
            if (!ok) {
                Console.WriteLine("SetThreadDesktop failed: " + Marshal.GetLastWin32Error());
                return;
            }
            Console.WriteLine("[OK] New STA Thread successfully bound to 'Default' desktop!");

            try {
                Type qbType = Type.GetTypeFromProgID("QBXMLRP2.RequestProcessor");
                if (qbType == null) {
                    Console.WriteLine("No se encontro QBXMLRP2.RequestProcessor");
                    return;
                }
                object rp = Activator.CreateInstance(qbType);
                Console.WriteLine("Llamando OpenConnection2 con LIMS Pro Data Bridge...");
                qbType.InvokeMember("OpenConnection2", BindingFlags.InvokeMethod, null, rp, new object[] { "LIMSProBridge", "LIMS Pro Data Bridge", 1 });
                Console.WriteLine("[OK] OpenConnection2 completado!");

                Console.WriteLine("Llamando BeginSession con C:\\quickbooks2010\\alimentos10.QBW y modo 2 (MultiUser)...");
                string ticket = (string)qbType.InvokeMember("BeginSession", BindingFlags.InvokeMethod, null, rp, new object[] { @"C:\quickbooks2010\alimentos10.QBW", 2 });
                Console.WriteLine("\n========================================================");
                Console.WriteLine("[EXITO TOTAL!] Ticket obtenido: " + ticket);
                Console.WriteLine("========================================================\n");

                string xmlQuery = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<?qbxml version=\"13.0\"?>\n<QBXML>\n  <QBXMLMsgsRq onError=\"continueOnError\">\n    <CustomerQueryRq requestID=\"1\">\n      <MaxReturned>5</MaxReturned>\n    </CustomerQueryRq>\n  </QBXMLMsgsRq>\n</QBXML>";

                string resp = (string)qbType.InvokeMember("ProcessRequest", BindingFlags.InvokeMethod, null, rp, new object[] { ticket, xmlQuery });
                Console.WriteLine("Respuesta recibida (" + resp.Length + " caracteres).");
                qbType.InvokeMember("EndSession", BindingFlags.InvokeMethod, null, rp, new object[] { ticket });
                qbType.InvokeMember("CloseConnection", BindingFlags.InvokeMethod, null, rp, null);

                Console.WriteLine(resp.Substring(0, Math.Min(500, resp.Length)));
            } catch (Exception ex) {
                Console.WriteLine("[ERROR EN QB SDK]: " + (ex.InnerException != null ? ex.InnerException.Message : ex.Message));
            }
        });

        t.SetApartmentState(ApartmentState.STA);
        t.Start();
        t.Join();
    }
}
'@

Add-Type -TypeDefinition $csharp

[QbRunner]::RunQbTask()
