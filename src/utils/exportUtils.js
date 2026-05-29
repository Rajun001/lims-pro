export const exportToCSV = (data, filename) => {
    if (!data || !data.length) return;

    // Obtener los encabezados de las claves del primer objeto
    const headers = Object.keys(data[0]);

    // Crear el contenido CSV
    const csvContent = [
        headers.join(','), // Fila de encabezados
        ...data.map(row =>
            headers.map(header => {
                const value = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                // Escapar comillas dobles y comas envolviendo en comillas dobles
                return `"${value.replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');

    // Crear un Blob y forzar la descarga
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF for BOM (UTF-8)
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
