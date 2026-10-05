[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$filePath = "C:\quickbooks2010\alimentos10.QBW.TLG"
Write-Host "Abriendo $filePath con FileShare.ReadWrite..."

try {
    $fs = New-Object System.IO.FileStream($filePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
    $reader = New-Object System.IO.BinaryReader($fs)
    $bytes = $reader.ReadBytes([int]$fs.Length)
    $reader.Close()
    $fs.Close()

    Write-Host "Leidos $($bytes.Length) bytes de TLG."

    # Convertir a texto ASCII / UTF8
    $asciiText = [System.Text.Encoding]::ASCII.GetString($bytes)
    $utf8Text = [System.Text.Encoding]::UTF8.GetString($bytes)
    $unicodeText = [System.Text.Encoding]::Unicode.GetString($bytes)

    $target = "131474"
    $found = $false

    foreach ($encodingName in @("ASCII", "UTF8", "Unicode")) {
        $text = switch ($encodingName) {
            "ASCII" { $asciiText }
            "UTF8" { $utf8Text }
            "Unicode" { $unicodeText }
        }

        $idx = $text.IndexOf($target)
        while ($idx -ge 0) {
            $found = $true
            $start = [Math]::Max(0, $idx - 300)
            $len = [Math]::Min(600, $text.Length - $start)
            $snippet = $text.Substring($start, $len)
            # Limpiar caracteres de control
            $cleanSnippet = $snippet -replace "[\x00-\x1F\x7F-\x9F]", " "
            Write-Host "`n[$encodingName COINCIDENCIA en offset $idx]:"
            Write-Host $cleanSnippet
            
            $idx = $text.IndexOf($target, $idx + 1)
        }
    }

    if (-not $found) {
        Write-Host "No se encontro '131474' directamente en TLG. Buscando codigos cercanos como 131442, 131443..."
        foreach ($c in @("131442", "131443", "131473", "131475")) {
            $idx = $asciiText.IndexOf($c)
            if ($idx -ge 0) {
                Write-Host "Encontrado codigo cercano $c en offset $idx"
            }
        }
    }
} catch {
    Write-Host "ERROR: $($_.Exception.ToString())"
}
