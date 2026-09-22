[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$paths = @(
    "C:\quickbooks2010\alimentos10.QBW",
    "C:\Users\Public\Documents\Intuit\QuickBooks\Company Files\alimentos10.QBW"
)

$rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
$rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
Write-Host "OpenConnection2 OK."

foreach ($p in $paths) {
    Write-Host "Probando BeginSession con: $p ..."
    try {
        $ticket = $rp.BeginSession($p, 2)
        Write-Host ">>> EXITO TOTAL con: $p ! Ticket: $ticket" -ForegroundColor Green
        
        $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <CompanyQueryRq requestID="1" />
  </QBXMLMsgsRq>
</QBXML>
"@
        $res = $rp.ProcessRequest($ticket, $query)
        $rp.EndSession($ticket)
        $rp.CloseConnection()
        
        [xml]$xml = $res
        $comp = $xml.QBXML.QBXMLMsgsRs.CompanyQueryRs.CompanyRet.CompanyName
        Write-Host "EMPRESA CONECTADA: '$comp'" -ForegroundColor Green
        exit 0
    } catch {
        Write-Host "Error con $p : $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

$rp.CloseConnection()
