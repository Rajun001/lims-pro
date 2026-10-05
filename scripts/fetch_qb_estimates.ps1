param(
    [int]$MaxReturned = 500,
    [string]$FromTxnDate = "",
    [string]$RefNumber = "",
    [string]$OutputFile = "c:\lims-microlabs\scripts\qb_estimates_latest.json"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Limpieza previa de posibles modales de error
$crashCloser = "c:\lims-microlabs\scripts\CrashDialogCloser.cs"
if (Test-Path $crashCloser) {
    try {
        Add-Type -Path $crashCloser -ErrorAction SilentlyContinue
        [CrashDialogCloser]::Dismiss()
    } catch {}
}

# Iniciar observador de diálogo de autorización interactiva
$csPath = "c:\lims-microlabs\scripts\QBInteractiveAuthorizer.cs"
if (Test-Path $csPath) {
    Add-Type -Path $csPath -ErrorAction SilentlyContinue
    [QBInteractiveAuthorizer]::StartWatcherThread()
}

$rp = $null
$ticket = $null

try {
    $rp = New-Object -ComObject "QBXMLRP2.RequestProcessor"
    $rp.OpenConnection2("MicrolabsExport", "Microlabs Export Tool", 1)
    $companyFile = "C:\quickbooks2010\alimentos10.QBW"
    
    # Intentar primero con archivo actualmente abierto en memoria
    try {
        $ticket = $rp.BeginSession("", 2)
    } catch {
        try {
            $ticket = $rp.BeginSession($companyFile, 2)
        } catch {
            $ticket = $rp.BeginSession("", 1)
        }
    }

    [QBInteractiveAuthorizer]::StopWatcher()

    # Construir filtros XML
    $filterXml = ""
    if (![string]::IsNullOrWhiteSpace($RefNumber)) {
        $filterXml += "<RefNumberFilter><MatchCriterion>Contains</MatchCriterion><RefNumber>$RefNumber</RefNumber></RefNumberFilter>"
    }
    if (![string]::IsNullOrWhiteSpace($FromTxnDate)) {
        $filterXml += "<FromTxnDate>$FromTxnDate</FromTxnDate>"
    }

    $query = @"
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EstimateQueryRq requestID="1">
      <MaxReturned>$MaxReturned</MaxReturned>
      $filterXml
      <IncludeLineItems>true</IncludeLineItems>
      <OwnerID>0</OwnerID>
    </EstimateQueryRq>
  </QBXMLMsgsRq>
</QBXML>
"@

    $res = $rp.ProcessRequest($ticket, $query)
    $rp.EndSession($ticket)
    $ticket = $null
    $rp.CloseConnection()
    $rp = $null

    [xml]$xml = $res
    $estimates = @()

    $retList = $xml.QBXML.QBXMLMsgsRs.EstimateQueryRs.EstimateRet
    if ($retList) {
        foreach ($est in $retList) {
            $lines = @()
            if ($est.EstimateLineRet) {
                foreach ($l in $est.EstimateLineRet) {
                    $lines += [PSCustomObject]@{
                        ItemName = if ($l.ItemRef) { $l.ItemRef.FullName } else { "" }
                        Desc = $l.Desc
                        Quantity = $l.Quantity
                        Rate = $l.Rate
                        Amount = $l.Amount
                    }
                }
            }
            if ($est.EstimateLineGroupRet) {
                foreach ($g in $est.EstimateLineGroupRet) {
                    $groupName = if ($g.ItemGroupRef) { $g.ItemGroupRef.FullName } else { "" }
                    if ($g.EstimateLineRet) {
                        foreach ($gl in $g.EstimateLineRet) {
                            $lines += [PSCustomObject]@{
                                ItemName = "$groupName : $(if ($gl.ItemRef) { $gl.ItemRef.FullName } else { '' })"
                                Desc = $gl.Desc
                                Quantity = $gl.Quantity
                                Rate = $gl.Rate
                                Amount = $gl.Amount
                            }
                        }
                    }
                }
            }

            $customFields = @{}
            if ($est.DataExtRet) {
                foreach ($de in $est.DataExtRet) {
                    $customFields[$de.DataExtName] = $de.DataExtValue
                }
            }

            $estimates += [PSCustomObject]@{
                TxnID = $est.TxnID
                RefNumber = $est.RefNumber
                TxnDate = $est.TxnDate
                CustomerName = if ($est.CustomerRef) { $est.CustomerRef.FullName } else { "" }
                CustomerListID = if ($est.CustomerRef) { $est.CustomerRef.ListID } else { "" }
                TotalAmount = $est.TotalAmount
                IsActive = $est.IsActive
                Memo = $est.Memo
                CustomFields = $customFields
                Lines = $lines
            }
        }
    }

    $json = $estimates | ConvertTo-Json -Depth 6
    [System.IO.File]::WriteAllText($OutputFile, $json, [System.Text.Encoding]::UTF8)
    Write-Host "OK: $($estimates.Count) estimates guardados en $OutputFile"

} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
} finally {
    if ($ticket -and $rp) {
        try { $rp.EndSession($ticket) } catch {}
    }
    if ($rp) {
        try { $rp.CloseConnection() } catch {}
    }
    [QBInteractiveAuthorizer]::StopWatcher()
}
