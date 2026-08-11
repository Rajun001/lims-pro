const net = require('net');

// Configuración
const PORT = 9000;
const HOST = '127.0.0.1';

// Trama HL7 estándar para simular un antibiograma del analizador automático
// Se usa M-10001 en el segmento OBR.2 como código de barras del LIMS.
// Los segmentos están separados por Carriage Return (\r).
const hl7Message = [
  'MSH|^~\\&|ANALIZADOR_AUTO|LAB_MICROLABS|LIMS_PRO|LAB_MICROLABS|20260530120000||ORU^R01^ORU_R01|MSG20260530001|P|2.3',
  'PID|||12345678||Perez^Juan||19850524|M',
  'OBR||M-10001||CULTIVO^Cultivo Microbiologico|||20260530100000',
  'OBX|1|ST|AMP^Ampicilina||R|||R',
  'OBX|2|ST|CIP^Ciprofloxacina||S|||S',
  'OBX|3|ST|GEN^Gentamicina||S|||S',
  'OBX|4|ST|ERY^Eritromicina||I|||I'
].join('\r');

// Envolver la trama en MLLP (Minimum Lower Layer Protocol)
// <VT> = \x0b, <FS> = \x1c, <CR> = \x0d
const mllpFrame = '\x0b' + hl7Message + '\x1c\x0d';

console.log(`[+] Conectando al servicio del analizador TCP en ${HOST}:${PORT}...`);

const client = new net.Socket();

client.connect(PORT, HOST, () => {
  console.log('[+] Conectado. Enviando trama HL7 simulada...');
  client.write(mllpFrame);
});

client.on('data', (data) => {
  console.log(`[+] Respuesta recibida del servidor:\n${data.toString('utf-8')}`);
  client.destroy(); // Cerrar conexión
});

client.on('close', () => {
  console.log('[+] Conexión cerrada con éxito.');
});

client.on('error', (err) => {
  console.error(`[!] Error de conexión: ${err.message}`);
});
