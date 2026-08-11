import { startTunnel } from 'untun';

async function main() {
  console.log('Iniciando túnel seguro de Cloudflare para puerto 3001...');
  try {
    const tunnel = await startTunnel({ port: 3001 });
    const url = await tunnel.getURL();
    console.log('====================================================');
    console.log('🚀 URL DE ACCESO CLOUDFLARE:');
    console.log(url);
    console.log('====================================================');
  } catch (err) {
    console.error('Error iniciando túnel:', err);
  }
}

main();
