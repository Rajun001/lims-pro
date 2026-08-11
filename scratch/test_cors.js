const isLocalOrigin = (origin) => {
  try {
    const url = new URL(origin);
    const hostname = url.hostname;
    
    // Localhost, bucle local o mDNS local
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname.endsWith('.local')) {
      return true;
    }
    
    // Rangos de IP privadas (RFC 1918)
    // Clase A: 10.0.0.0 - 10.255.255.255
    if (hostname.startsWith('10.')) return true;
    
    // Clase B: 172.16.0.0 - 172.31.255.255
    if (hostname.startsWith('172.')) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const secondOctet = parseInt(parts[1], 10);
        if (secondOctet >= 16 && secondOctet <= 31) return true;
      }
    }
    
    // Clase C: 192.168.0.0 - 192.168.255.255
    if (hostname.startsWith('192.168.')) return true;
    
    return false;
  } catch (e) {
    return false;
  }
};

const testOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://192.168.0.90:5173',
  'http://192.168.1.15:5173',
  'http://10.0.0.5:3000',
  'http://172.16.2.3:5173',
  'http://172.31.5.6:5173',
  'http://172.15.1.1:5173', // Should be false
  'http://172.32.1.1:5173', // Should be false
  'http://google.com',       // Should be false
  'http://lims-server.local:5173'
];

testOrigins.forEach(origin => {
  console.log(`${origin} => ${isLocalOrigin(origin)}`);
});
