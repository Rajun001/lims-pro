/**
 * Utilidad para resolver dinámicamente la URL de la API del LIMS.
 * Permite el acceso transparente tanto en desarrollo local, red LAN (Mac Mini u otros equipos),
 * como a través de túneles remotos (LocalTunnel, ngrok, etc.).
 */
export const getApiUrl = () => {
  let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  
  if (typeof window !== 'undefined' && window.location.hostname) {
    const isLoopback = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Si no estamos en localhost/loopback
    if (!isLoopback) {
      if (API_URL.includes('localhost') || API_URL.includes('127.0.0.1')) {
        // Si accedemos por IP local (ej. 192.168.0.29) o .local, conectamos al puerto 3001 del servidor LIMS
        if (/^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname) || window.location.hostname.endsWith('.local')) {
          return `${window.location.protocol}//${window.location.hostname}:3001`;
        }
        // Si es dominio web/túnel externo con reverse proxy
        return window.location.origin;
      }
    }
  }
  return API_URL;
};
