[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
$rp.OpenConnection2("MicrolabsSync", "Microlabs LIMS Sync", 1)

$company = "C:\quickbooks2010\alimentos10.QBW"
$modes = @(
    @{ Name = "alimentos10, Mode 2 (MultiUser)"; Path = $company; Mode = 2 },
    @{ Name = "alimentos10, Mode 1 (DoNotCare)"; Path = $company; Mode = 1 },
    @{ Name = "Empty, Mode 2 (MultiUser)"; Path = ""; Mode = 2 },
    @{ Name = "Empty, Mode 1 (DoNotCare)"; Path = ""; Mode = 1 }
)

foreach ($m in $modes) {
    Write-Host "`nProbando $($m.Name)..."
    try {
        $ticket = $rp.BeginSession($m.Path, $m.Mode)
        Write-Host ">>> EXITO TOTAL! Ticket: $ticket" -ForegroundColor Green
        
        $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <MaxReturned>10</MaxReturned>
      <FromTxnDate>2026-09-23</FromTxnDate>
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@
        $res = $rp.ProcessRequest($ticket, $query)
        Write-Host "Respuesta procesada ($($res.Length) chars)"
        [System.IO.File]::WriteAllText("c:\lims-microlabs\scripts\today_estimates_raw.xml", $res, [System.Text.Encoding]::UTF8)

        $rp.EndSession($ticket)
        break
    } catch {
        Write-Host "Fallo: $($_.Exception.Message)"
    }
}

try { $rp.CloseConnection() } catch {}
