import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware.js';
import { publicFormLimiter, staffPasscodeLimiter } from '../middlewares/rateLimiter.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = Router();

// Sanitizador seguro contra XSS e inyecciones
const sanitizeText = (val, maxLen = 300) => {
    if (!val) return '';
    return String(val)
        .replace(/[<>]/g, '') // Eliminar etiquetas HTML
        .trim()
        .slice(0, maxLen);
};

// Archivo de persistencia local para triage de solicitudes web
const TRIAGE_STORAGE_PATH = path.join(__dirname, '../data/web_intake_triage.json');

const loadTriageRequests = () => {
    try {
        if (!fs.existsSync(TRIAGE_STORAGE_PATH)) {
            const defaultSeed = [
                {
                    id: 'WEB-2026-1001',
                    clientType: 'empresa',
                    clientName: 'Industrias Lácteas del Valle S.A.',
                    contactPerson: 'Ing. Carlos Brenes (Calidad)',
                    email: 'cbrenes@lacteosvalle.cr',
                    phone: '+506 8899-2233',
                    sampleType: 'Alimento Procesado (Queso Fresco)',
                    sampleDescription: 'Lote QF-0824, toma de muestra en línea de empaque',
                    urgency: true,
                    analysisRequested: 'Listeria monocytogenes, E. coli, Recuento de Coliformes (Petrifilm AOAC)',
                    status: 'PENDING_TRIAGE',
                    createdAt: new Date(Date.now() - 3600000).toISOString(),
                    ip: '190.113.112.45'
                },
                {
                    id: 'WEB-2026-1002',
                    clientType: 'particular',
                    clientName: 'María Fernanda Solano Gamboa',
                    contactPerson: 'María Fernanda Solano',
                    email: 'mf.solano@gmail.com',
                    phone: '+506 7012-4455',
                    sampleType: 'Agua Potable de Pozo',
                    sampleDescription: 'Agua de grifo residencial para potabilidad',
                    urgency: false,
                    analysisRequested: 'Físico-Químico Básico + Coliformes Fecales / E. coli NMP',
                    status: 'PENDING_TRIAGE',
                    createdAt: new Date(Date.now() - 7200000).toISOString(),
                    ip: '186.15.89.12'
                }
            ];
            fs.mkdirSync(path.dirname(TRIAGE_STORAGE_PATH), { recursive: true });
            fs.writeFileSync(TRIAGE_STORAGE_PATH, JSON.stringify(defaultSeed, null, 2), 'utf8');
            return defaultSeed;
        }
        const data = fs.readFileSync(TRIAGE_STORAGE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.warn('Error reading web_intake_triage.json:', err.message);
        return [];
    }
};

const saveTriageRequests = (items) => {
    try {
        fs.mkdirSync(path.dirname(TRIAGE_STORAGE_PATH), { recursive: true });
        fs.writeFileSync(TRIAGE_STORAGE_PATH, JSON.stringify(items, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving web_intake_triage.json:', err.message);
    }
};

// Archivo de persistencia para solicitudes de cotización confidenciales (Privacidad y Discreción)
const QUOTES_STORAGE_PATH = path.join(__dirname, '../data/web_quotes_confidential.json');

const loadQuoteRequests = () => {
    try {
        if (!fs.existsSync(QUOTES_STORAGE_PATH)) {
            return [];
        }
        const data = fs.readFileSync(QUOTES_STORAGE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.warn('Error reading web_quotes_confidential.json:', err.message);
        return [];
    }
};

const saveQuoteRequests = (items) => {
    try {
        fs.mkdirSync(path.dirname(QUOTES_STORAGE_PATH), { recursive: true });
        fs.writeFileSync(QUOTES_STORAGE_PATH, JSON.stringify(items, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving web_quotes_confidential.json:', err.message);
    }
};

// =============================================================================
// 1. ENDPOINT PÚBLICO: Pre-ingreso Seguro de Muestras desde www.microlabscr.com
// =============================================================================
router.post('/public/intake', publicFormLimiter, (req, res) => {
    try {
        const {
            clientType,
            clientName,
            contactPerson,
            email,
            phone,
            sampleType,
            sampleDescription,
            urgency,
            analysisRequested,
            honeypot // Campo invisible anti-bot
        } = req.body;

        // Anti-spam Honeypot: si viene relleno, es un bot rastreador
        if (honeypot && String(honeypot).trim() !== '') {
            console.warn('[Anti-Bot Triggered] Bot detected and dropped silently.');
            return res.status(200).json({ success: true, message: 'Solicitud recibida correctamente.' });
        }

        if (!clientName || !phone || !sampleType) {
            return res.status(400).json({
                error: 'Los campos Nombre de Cliente/Empresa, Teléfono y Tipo de Muestra son obligatorios.'
            });
        }

        const trackingId = `WEB-2026-${Math.floor(1000 + Math.random() * 9000)}`;

        const newRecord = {
            id: trackingId,
            clientType: ['empresa', 'particular', 'clinica'].includes(clientType) ? clientType : 'particular',
            clientName: sanitizeText(clientName, 120),
            contactPerson: sanitizeText(contactPerson, 100),
            email: sanitizeText(email, 100),
            phone: sanitizeText(phone, 30),
            sampleType: sanitizeText(sampleType, 100),
            sampleDescription: sanitizeText(sampleDescription, 500),
            urgency: Boolean(urgency),
            analysisRequested: sanitizeText(analysisRequested, 400),
            status: 'PENDING_TRIAGE',
            createdAt: new Date().toISOString(),
            ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        };

        const existing = loadTriageRequests();
        existing.unshift(newRecord);
        saveTriageRequests(existing);

        return res.status(201).json({
            success: true,
            trackingId,
            message: 'Su solicitud ha sido pre-registrada de forma segura en LIMS-PRO Microlabs. Nuestro equipo de recepción validará la muestra a su entrega.',
            timestamp: newRecord.createdAt
        });
    } catch (err) {
        console.error('Error en /api/public/intake:', err);
        return res.status(500).json({ error: 'Ocurrió un error al procesar su solicitud. Intente nuevamente.' });
    }
});

// =============================================================================
// 2. ENDPOINT LIMS: Listado de Pre-ingresos Pendientes de Triage (Para Recepción)
// =============================================================================
router.get('/public/intake', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR', 'RECEPTION', 'CLINICAL_ANALYST'), (req, res) => {
    try {
        const items = loadTriageRequests();
        return res.json(items);
    } catch {
        return res.status(500).json({ error: 'Error al consultar triage de muestras web' });
    }
});

// Actualizar estado de solicitud web (Aprobar para admisión oficial o Descartar)
router.patch('/public/intake/:id/status', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR', 'RECEPTION'), (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;
        const items = loadTriageRequests();
        const index = items.findIndex(i => i.id === id);

        if (index === -1) {
            return res.status(404).json({ error: 'Solicitud no encontrada' });
        }

        items[index].status = status || items[index].status;
        items[index].updatedAt = new Date().toISOString();
        if (remarks) items[index].remarks = sanitizeText(remarks, 300);

        saveTriageRequests(items);
        return res.json({ success: true, item: items[index] });
    } catch {
        return res.status(500).json({ error: 'Error al actualizar estado' });
    }
});

// =============================================================================
// 3. ENDPOINT PÚBLICO: Solicitud de Cotización Confidencial (Protección de Tarifas y Privacidad)
// =============================================================================
router.post('/public/quote-request', publicFormLimiter, (req, res) => {
    try {
        const { clientType, clientName, contactPerson, email, phone, sampleCategory, testsRequested, notes, honeypot } = req.body;

        if (honeypot) {
            return res.status(200).json({ success: true, message: 'Recibido' });
        }

        if (!clientName || !email || !phone) {
            return res.status(400).json({
                error: 'Los campos Nombre/Empresa, Correo Electrónico y Teléfono son obligatorios para enviar la cotización.'
            });
        }

        const quoteId = `COT-WEB-${Math.floor(1000 + Math.random() * 9000)}`;

        const newQuote = {
            id: quoteId,
            clientType: ['empresa', 'particular', 'clinica'].includes(clientType) ? clientType : 'empresa',
            clientName: sanitizeText(clientName, 120),
            contactPerson: sanitizeText(contactPerson, 100),
            email: sanitizeText(email, 100),
            phone: sanitizeText(phone, 30),
            sampleCategory: sanitizeText(sampleCategory || 'Alimentos / Aguas', 100),
            testsRequested: Array.isArray(testsRequested) ? testsRequested.map(t => sanitizeText(typeof t === 'string' ? t : t.name, 150)) : [sanitizeText(testsRequested, 400)],
            notes: sanitizeText(notes, 500),
            status: 'PENDING_OFFER',
            createdAt: new Date().toISOString(),
            ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1'
        };

        const list = loadQuoteRequests();
        list.unshift(newQuote);
        saveQuoteRequests(list);

        return res.status(201).json({
            success: true,
            quoteId,
            message: 'Su solicitud de presupuesto confidencial ha sido recibida con estricta reserva comercial. Un especialista técnico de Microlabs emitirá su oferta personalizada formal.',
            timestamp: newQuote.createdAt
        });
    } catch (err) {
        console.error('Error en /api/public/quote-request:', err);
        return res.status(500).json({ error: 'Ocurrió un error al procesar su solicitud de cotización. Intente nuevamente.' });
    }
});

// Listar cotizaciones confidenciales para el personal LIMS
router.get('/public/quote-requests', authenticateJWT, authorizeRoles('ADMINISTRATOR', 'TECHNICAL_DIRECTOR', 'RECEPTION'), (req, res) => {
    try {
        const quotes = loadQuoteRequests();
        return res.json(quotes);
    } catch {
        return res.status(500).json({ error: 'Error al consultar cotizaciones' });
    }
});

// =============================================================================
// 4. ENDPOINT: Validación de Contraseña Previa Institucional para Acceso Interno (Staff)
// =============================================================================
router.post('/public/verify-staff-passcode', staffPasscodeLimiter, (req, res) => {
    try {
        const { passcode } = req.body;
        const normalized = (passcode || '').trim().toUpperCase();

        const INSTITUTIONAL_PASSCODES = ['MICROLABS-2026', 'MICROLABS2026', 'ADMIN2026'];

        if (INSTITUTIONAL_PASSCODES.includes(normalized)) {
            return res.json({
                authorized: true,
                message: 'Contraseña institucional verificada correctamente.',
                authCode: 'MICROLABS-2026'
            });
        }

        return res.status(401).json({
            authorized: false,
            error: 'Contraseña institucional previa inválida. Verifique con la Dirección Técnica de Microlabs.'
        });
    } catch {
        return res.status(500).json({ authorized: false, error: 'Error al verificar clave de seguridad' });
    }
});

// =============================================================================
// 5. ENDPOINT PÚBLICO: Catálogo Oficial Dinámico de Ensayos para la Web
// =============================================================================
router.get('/public/catalog', (req, res) => {
    const catalog = {
        accreditations: [
            {
                name: 'LGC AXIO Proficiency Testing (UK)',
                scheme: 'Food Microbiology (QMS) Scheme 2026',
                standard: 'ISO/IEC 17043',
                status: 'Vigente 2026',
                badge: 'LGC 2026'
            },
            {
                name: 'AOAC INTERNATIONAL (USA)',
                scheme: 'M02 Pathogen-Free Microbiology',
                standard: 'A2LA Cert #1782.01',
                status: 'Vigente',
                badge: 'AOAC'
            },
            {
                name: 'SENASA (Costa Rica)',
                scheme: 'Certificado Veterinario de Operación (CVO)',
                standard: 'Ley Nº 8495',
                status: 'Habilitado Oficial',
                badge: 'SENASA'
            },
            {
                name: 'MEIC DIGEPYME',
                scheme: 'Condición PYME Nacional',
                standard: 'Ley Nº 8262',
                status: '2024 - 2028',
                badge: 'MEIC'
            }
        ],
        categories: [
            {
                id: 'food',
                title: 'Microbiología de Alimentos y Materias Primas',
                description: 'Ensayos cuantitativos y detección de patógenos según normas AOAC / FDA-BAM / ISO.',
                tests: [
                    { name: 'Recuento de Aerobios Mesófilos (RAM)', method: 'AOAC 990.12 Petrifilm', time: '48h', sample: 'Sólido / Líquido' },
                    { name: 'Coliformes Totales y E. coli', method: 'AOAC 991.14 / 998.08', time: '24-48h', sample: 'Alimentos / Insumos' },
                    { name: 'Staphylococcus aureus coagulasa positiva', method: 'AOAC 2003.07 / 2003.08 / ISO 6888', time: '48h', sample: 'Alimentos procesados' },
                    { name: 'Detección de Salmonella spp.', method: 'AOAC / FDA-BAM Ch. 5', time: '3-5 días', sample: '25g muestra' },
                    { name: 'Detección de Listeria monocytogenes', method: 'AOAC 999.06 / ISO 11290', time: '3-5 días', sample: '25g muestra' },
                    { name: 'Hongos y Levaduras', method: 'AOAC 997.02 Petrifilm', time: '72h', sample: 'Alimentos deshidratados y lácteos' }
                ]
            },
            {
                id: 'water',
                title: 'Análisis de Aguas y Hielo (Potabilidad y Residual)',
                description: 'Verificación del Reglamento de Calidad del Agua Potable (Costa Rica) y SMEWW.',
                tests: [
                    { name: 'Coliformes Fecales y E. coli en Agua', method: 'SMEWW 9221 / Colilert / NMP', time: '24h', sample: '100 mL estéril' },
                    { name: 'Recuento Heterotrófico en Placa', method: 'SMEWW 9215 B', time: '48h', sample: 'Agua purificada / envasada' },
                    { name: 'Pseudomonas aeruginosa', method: 'SMEWW 9213 / Filtración membrana', time: '48h', sample: 'Agua embotellada / Hielo' },
                    { name: 'Análisis Físico-Químico Básico', method: 'pH, Turbidez, Cloro Residual, Conductividad', time: '24h', sample: '1000 mL' }
                ]
            },
            {
                id: 'surfaces',
                title: 'Monitoreo Ambiental y Superficies Vivas/Inertes',
                description: 'Verificación de programas de higiene, manipulación y BPM / HACCP.',
                tests: [
                    { name: 'Hisopado de Superficies Inertes', method: 'Hisopo / Esponja neutralizante', time: '48h', sample: '100 cm²' },
                    { name: 'Manos de Manipuladores', method: 'Frotis de dedos / palmas', time: '48h', sample: 'Superficie viva' },
                    { name: 'Ambientes por Sedimentación / Aire', method: 'Placas expuestas / Muestreo volumétrico', time: '48h', sample: 'Áreas de producción' }
                ]
            },
            {
                id: 'clinical',
                title: 'Microbiología y Química Clínica Integral',
                description: 'Exámenes clínicos de rutina, coprología, hematología y bacteriología.',
                tests: [
                    { name: 'Examen General de Orina (EGO)', method: 'Tira Reactiva + Sedimento Microscópico', time: 'Mismo día', sample: 'Orina fresca' },
                    { name: 'Examen Coprológico & Parásitos', method: 'Examen Directo + Concentración', time: 'Mismo día', sample: 'Heces' },
                    { name: 'Cultivo Bacteriano con Antibiograma', method: 'Aislamiento + Sensibilidad CLSI', time: '48-72h', sample: 'Diversas muestras' },
                    { name: 'Perfil Lipídico & Química Sanguínea', method: 'Bioquímica automatizada', time: 'Mismo día', sample: 'Suero' }
                ]
            }
        ]
    };

    return res.json(catalog);
});

export default router;
