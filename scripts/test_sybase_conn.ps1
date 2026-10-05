[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$connStrings = @(
    "Driver={QB SQL Anywhere};ServerName=QB_HP_34;DatabaseName=4a7548c2e3e6406ebd5e2eeb65f0bb2c;CommLinks=TCPIP(HOST=127.0.0.1:54283);UID=dba;PWD=sql",
    "Driver={QB SQL Anywhere};ServerName=QB_HP_34;DatabaseName=4a7548c2e3e6406ebd5e2eeb65f0bb2c;CommLinks=TCPIP(HOST=192.168.0.29:54283);UID=dba;PWD=sql",
    "Driver={QB SQL Anywhere};ServerName=QB_HP_34;DatabaseName=4a7548c2e3e6406ebd5e2eeb65f0bb2c;CommLinks=TCPIP(HOST=127.0.0.1:54283);Integrated=YES",
    "Driver={QB SQL Anywhere};ServerName=QB_HP_34;DatabaseName=4a7548c2e3e6406ebd5e2eeb65f0bb2c;CommLinks=TCPIP(HOST=127.0.0.1:54283);UID=Admin;PWD="
)

foreach ($cs in $connStrings) {
    Write-Host "`nProbando conexion: $cs"
    try {
        $conn = New-Object System.Data.Odbc.OdbcConnection($cs)
        $conn.Open()
        Write-Host "[EXITO TOTAL] Conexion Sybase establecida!" -ForegroundColor Green
        
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = "SELECT table_name FROM systable WHERE creator = 1"
        $reader = $cmd.ExecuteReader()
        while ($reader.Read()) {
            Write-Host "Tabla: $($reader[0])"
        }
        $reader.Close()
        $conn.Close()
        break
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}
