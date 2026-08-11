/**
 * Utilidades para formatear fechas y horas al huso horario local de Costa Rica (America/Costa_Rica)
 * y en el formato estándar es-CR (DD/MM/AAAA).
 */

/**
 * Convierte un timestamp, string de fecha o segundos de Firestore a un objeto Date de JS.
 */
export const getCRDate = (ts) => {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  if (ts.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
};

/**
 * Formatea una fecha a solo fecha local (DD/MM/AAAA) en el huso de Costa Rica.
 */
export const formatToCRDate = (ts) => {
  const date = getCRDate(ts);
  if (!date || isNaN(date.getTime())) return 'N/A';
  
  // Si el valor recibido es un string 'YYYY-MM-DD' (típico de inputs de fecha),
  // lo formateamos directamente para evitar desfases de zona horaria (UTC a local).
  if (typeof ts === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ts)) {
    const [year, month, day] = ts.split('-');
    return `${day}/${month}/${year}`;
  }

  return date.toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica' });
};

/**
 * Formatea una fecha y hora (DD/MM/AAAA hh:mm:ss a.m./p.m.) en el huso de Costa Rica.
 */
export const formatToCRDateTime = (ts) => {
  const date = getCRDate(ts);
  if (!date || isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('es-CR', { timeZone: 'America/Costa_Rica', hour12: true });
};
