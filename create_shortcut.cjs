const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  const desktop = path.join(process.env.USERPROFILE, 'OneDrive', 'Desktop');
  const targetDir = fs.existsSync(desktop) ? desktop : path.join(process.env.USERPROFILE, 'Desktop');
  const lnkPath = path.join(targetDir, 'Reparar Sistema LIMS.lnk');
  
  const psScript = `
    $wsh = New-Object -ComObject WScript.Shell
    $sc = $wsh.CreateShortcut('${lnkPath.replace(/\\/g, '\\\\')}')
    $sc.TargetPath = 'C:\\lims-microlabs\\reparar_sistema.bat'
    $sc.WorkingDirectory = 'C:\\lims-microlabs'
    $sc.IconLocation = 'shell32.dll,277'
    $sc.Save()
    
    $bytes = [System.IO.File]::ReadAllBytes('${lnkPath.replace(/\\/g, '\\\\')}')
    $bytes[21] = $bytes[21] -bor 0x20
    [System.IO.File]::WriteAllBytes('${lnkPath.replace(/\\/g, '\\\\')}', $bytes)
  `;
  
  execSync(`powershell -Command "${psScript.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
  console.log('Shortcut created at:', lnkPath);
} catch (e) {
  console.error(e);
}
