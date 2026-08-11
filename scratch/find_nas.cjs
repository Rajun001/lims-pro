const dgram = require('dgram');
const client = dgram.createSocket('udp4');

console.log('Buscando dispositivos Synology / NAS en la red...');

client.on('message', (msg, rinfo) => {
  const str = msg.toString();
  console.log(`[Respuesta de ${rinfo.address}]:`, str.slice(0, 100));
  if (str.toLowerCase().includes('synology') || str.toLowerCase().includes('diskstation') || str.toLowerCase().includes('nas')) {
    console.log(`\n🎉 [NAS DETECTADO] IP: ${rinfo.address}\n`);
  }
});

client.bind(() => {
  client.setBroadcast(true);
  const msg = 
    'M-SEARCH * HTTP/1.1\r\n' +
    'HOST: 239.255.255.250:1900\r\n' +
    'MAN: "ssdp:discover"\r\n' +
    'MX: 2\r\n' +
    'ST: ssdp:all\r\n\r\n';
  client.send(msg, 0, msg.length, 1900, '239.255.255.250');
  
  setTimeout(() => {
    console.log('Búsqueda finalizada.');
    client.close();
    process.exit(0);
  }, 4000);
});
