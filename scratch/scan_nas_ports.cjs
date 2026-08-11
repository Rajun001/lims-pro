const net = require('net');

const ports = [22, 5000, 5001, 5005, 5006, 445, 548];
const found = [];

let pending = 254 * ports.length;

for (let i = 1; i <= 254; i++) {
  const ip = `192.168.0.${i}`;
  ports.forEach(port => {
    const s = new net.Socket();
    s.setTimeout(1500);
    s.on('connect', () => {
      console.log(`[+] IP: ${ip} tiene PUERTO ${port} ABIERTO`);
      found.push({ ip, port });
      s.destroy();
    });
    s.on('timeout', () => s.destroy());
    s.on('error', () => {});
    s.on('close', () => {
      pending--;
      if (pending === 0) {
        console.log('\n--- Escaneo de puertos del NAS finalizado ---');
        console.log(JSON.stringify(found, null, 2));
        process.exit(0);
      }
    });
    s.connect(port, ip);
  });
}
