[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Buscando '131474' en Outlook..."
try {
    $ol = New-Object -ComObject "Outlook.Application"
    $ns = $ol.GetNamespace("MAPI")
    
    # Check Sent Mail (Folder 5) and Inbox (Folder 6)
    $folders = @(
        $ns.GetDefaultFolder(5), # olFolderSentMail
        $ns.GetDefaultFolder(6)  # olFolderInbox
    )

    foreach ($folder in $folders) {
        Write-Host "Revisando carpeta: $($folder.Name)..."
        $items = $folder.Items
        $items.Sort("[ReceivedTime]", $true) # Descending
        
        $count = [Math]::Min(50, $items.Count)
        for ($i = 1; $i -le $count; $i++) {
            $item = $items.Item($i)
            $subject = $item.Subject
            $body = $item.Body
            
            if ($subject -match "131474" -or $body -match "131474" -or $subject -match "131442" -or $subject -match "131443") {
                Write-Host "`n[COINCIDENCIA EN OUTLOOK]:" -ForegroundColor Green
                Write-Host "Carpeta: $($folder.Name)"
                Write-Host "Asunto: $subject"
                Write-Host "Fecha: $($item.ReceivedTime)"
                Write-Host "Para: $($item.To)"
                Write-Host "Adjuntos:"
                foreach ($att in $item.Attachments) {
                    Write-Host "  - $($att.FileName)"
                }
                Write-Host "Cuerpo (primeros 300 caracteres):"
                $cleanBody = ($body -replace "\s+", " ").Trim()
                Write-Host $cleanBody.Substring(0, [Math]::Min(300, $cleanBody.Length))
            }
        }
    }
} catch {
    Write-Host "Aviso Outlook: $($_.Exception.Message)"
}
