/**
 * Parseador Estándar de HL7 (Health Level Seven)
 * Convierte tramas crudas de equipos médicos en un objeto JSON manejable.
 */

function parseHL7(rawMessage) {
    const segments = rawMessage.split(/[\r\n]+/).filter(line => line.trim().length > 0);
    
    let result = {
        equipment: 'Desconocido',
        barcode: null,
        patientName: null,
        patientId: null,
        tests: [],
        rawData: {},
        status: 'pending'
    };

    segments.forEach(segment => {
        const fields = segment.split('|');
        const segmentType = fields[0];

        if (segmentType === 'MSH') {
            // MSH|^~\&|NX6000|LAB...
            result.equipment = fields[2] || 'Desconocido';
        } else if (segmentType === 'PID') {
            // PID|1||12345678^^^LIMS||Doe^John...
            result.patientId = (fields[3] || '').split('^')[0];
            const nameParts = (fields[5] || '').split('^');
            result.patientName = nameParts.filter(n => n).join(' ');
        } else if (segmentType === 'OBR') {
            // OBR|1||MC-2026-0506|GLU^Glucose...
            // OBR.3 is usually the Filler Order Number (Barcode)
            result.barcode = fields[3] || result.barcode;
            // OBR.4 is the universal service identifier
            const testCode = (fields[4] || '').split('^')[0];
            if (testCode && !result.tests.includes(testCode)) {
                result.tests.push(testCode);
            }
        } else if (segmentType === 'OBX') {
            // OBX|1|NM|GLU^Glucose|1|95|mg/dL|70-100|N|||F
            const obxTestCode = (fields[3] || '').split('^')[0];
            const value = fields[5];
            
            if (obxTestCode) {
                if (!result.tests.includes(obxTestCode)) {
                    result.tests.push(obxTestCode);
                }
                result.rawData[obxTestCode] = value;
            }
        }
    });

    return result;
}

module.exports = { parseHL7 };
