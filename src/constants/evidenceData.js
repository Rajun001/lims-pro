// Generadores de imágenes SVG vectoriales realistas para placas de cultivo y evidencias microbiológicas
export const defaultMicrobiologyEvidence = [
    {
        id: 'ev-plate-1',
        stage: 'CULTURE_PLATE',
        title: 'Placa de Cultivo: Recuento de Heterotróficos en Placa (RTA / PCA)',
        description: 'Medio Plate Count Agar (PCA) incubado a 35°C ± 0.5°C durante 48 horas según SMEWW 9215B. Lectura: 62 colonias características color crema/opalescentes.',
        medium: 'Plate Count Agar (PCA)',
        dilution: '10⁻¹ (1.0 mL)',
        incubation: '35°C / 48 hrs',
        resultObservation: '62 UFC/mL (Conforme según RTCR 423:2008, Límite < 100 UFC/mL)',
        analyst: 'M.Q.C. Roldan Ajún Chaverri (Reg. 802)',
        timestamp: '2026-09-18 10:30',
        imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
                <defs>
                    <radialGradient id="dishBg" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#fff8e7"/>
                        <stop offset="85%" stop-color="#f5e6c8"/>
                        <stop offset="97%" stop-color="#e0cfab"/>
                        <stop offset="100%" stop-color="#94a3b8"/>
                    </radialGradient>
                    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="2" dy="4" stdDeviation="4" flood-opacity="0.25"/>
                    </filter>
                </defs>
                <!-- Placa Petri Exterior -->
                <circle cx="200" cy="200" r="185" fill="#f8fafc" stroke="#cbd5e1" stroke-width="4" filter="url(#shadow)"/>
                <circle cx="200" cy="200" r="175" fill="url(#dishBg)" stroke="#e2e8f0" stroke-width="2"/>
                <!-- Cuadrícula tenue de conteo -->
                <path d="M 60 200 H 340 M 200 60 V 340 M 100 100 L 300 300 M 100 300 L 300 100" stroke="#d5c39d" stroke-width="0.75" stroke-dasharray="3,3" opacity="0.4"/>
                <!-- Colonias RTA distribuidas aleatoriamente -->
                <g fill="#fef08a" stroke="#ca8a04" stroke-width="0.75">
                    <circle cx="180" cy="190" r="4.5"/>
                    <circle cx="210" cy="180" r="5"/>
                    <circle cx="195" cy="225" r="4"/>
                    <circle cx="230" cy="210" r="3.5"/>
                    <circle cx="150" cy="160" r="6"/>
                    <circle cx="165" cy="220" r="4.5"/>
                    <circle cx="240" cy="165" r="5"/>
                    <circle cx="220" cy="245" r="3.5"/>
                    <circle cx="135" cy="200" r="5.5"/>
                    <circle cx="265" cy="195" r="4"/>
                    <circle cx="170" cy="130" r="5"/>
                    <circle cx="205" cy="135" r="4.5"/>
                    <circle cx="245" cy="130" r="3.5"/>
                    <circle cx="130" cy="240" r="4"/>
                    <circle cx="155" cy="265" r="5"/>
                    <circle cx="200" cy="275" r="4.5"/>
                    <circle cx="250" cy="255" r="4"/>
                    <circle cx="280" cy="230" r="3.5"/>
                    <circle cx="115" cy="170" r="5"/>
                    <circle cx="110" cy="215" r="4"/>
                    <circle cx="285" cy="170" r="4.5"/>
                    <circle cx="160" cy="95" r="4"/>
                    <circle cx="215" cy="95" r="4.5"/>
                    <circle cx="260" cy="105" r="3.5"/>
                    <circle cx="100" cy="140" r="4"/>
                    <circle cx="295" cy="140" r="3.5"/>
                    <circle cx="95" cy="250" r="4"/>
                    <circle cx="290" cy="260" r="4"/>
                    <circle cx="120" cy="285" r="3.5"/>
                    <circle cx="175" cy="305" r="4.5"/>
                    <circle cx="225" cy="305" r="4"/>
                    <circle cx="270" cy="285" r="3.5"/>
                </g>
                <!-- Reflejo de vidrio -->
                <path d="M 70 120 A 150 150 0 0 1 200 45" fill="none" stroke="#ffffff" stroke-width="6" opacity="0.6" stroke-linecap="round"/>
                <!-- Etiqueta de placa -->
                <rect x="110" y="345" width="180" height="26" rx="4" fill="#0f172a" opacity="0.85"/>
                <text x="200" y="362" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold" text-anchor="middle">PCA / SMEWW 9215B (10⁻¹)</text>
            </svg>
        `)
    },
    {
        id: 'ev-plate-2',
        stage: 'CULTURE_PLATE',
        title: 'Placa Petrifilm™ / Medio Cromogénico: Coliformes & E. coli',
        description: 'Película Petrifilm™ para E. coli / Coliformes según AOAC Official Method 991.14 / SMEWW 9223. Lectura: 0 colonias azules con gas (Ausencia de E. coli) y 0 colonias rojas con gas.',
        medium: '3M Petrifilm™ EC Plate',
        dilution: '1.0 mL Directo',
        incubation: '35°C / 24 hrs',
        resultObservation: '< 1.1 NMP/100mL (No Detectable / Conforme)',
        analyst: 'M.Q.C. Roldan Ajún Chaverri (Reg. 802)',
        timestamp: '2026-09-17 14:15',
        imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
                <defs>
                    <filter id="pfilmShadow" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="3" dy="4" stdDeviation="5" flood-opacity="0.3"/>
                    </filter>
                    <radialGradient id="pfilmGel" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#fff5f5"/>
                        <stop offset="90%" stop-color="#fee2e2"/>
                        <stop offset="100%" stop-color="#fca5a5"/>
                    </radialGradient>
                </defs>
                <!-- Soporte Cartón Petrifilm -->
                <rect x="25" y="25" width="350" height="350" rx="12" fill="#dc2626" filter="url(#pfilmShadow)"/>
                <!-- Ventana circular transparente -->
                <circle cx="200" cy="200" r="140" fill="url(#pfilmGel)" stroke="#ef4444" stroke-width="4"/>
                <!-- Cuadrícula Petrifilm 1cm x 1cm -->
                <g stroke="#f87171" stroke-width="0.8" opacity="0.6">
                    <line x1="100" y1="65" x2="100" y2="335"/>
                    <line x1="140" y1="65" x2="140" y2="335"/>
                    <line x1="180" y1="65" x2="180" y2="335"/>
                    <line x1="220" y1="65" x2="220" y2="335"/>
                    <line x1="260" y1="65" x2="260" y2="335"/>
                    <line x1="300" y1="65" x2="300" y2="335"/>
                    <line x1="65" y1="100" x2="335" y2="100"/>
                    <line x1="65" y1="140" x2="335" y2="140"/>
                    <line x1="65" y1="180" x2="335" y2="180"/>
                    <line x1="65" y1="220" x2="335" y2="220"/>
                    <line x1="65" y1="260" x2="335" y2="260"/>
                    <line x1="65" y1="300" x2="335" y2="300"/>
                </g>
                <!-- Sello negativo: AUSENCIA DE GAS / SIN COLONIAS -->
                <circle cx="200" cy="200" r="80" fill="#ffffff" fill-opacity="0.85" stroke="#16a34a" stroke-width="3" stroke-dasharray="5,3"/>
                <text x="200" y="195" fill="#15803d" font-family="sans-serif" font-size="16" font-weight="900" text-anchor="middle">NEGATIVO (&lt;1.1)</text>
                <text x="200" y="215" fill="#166534" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">SIN GAS / SIN COLONIAS E. COLI</text>
                <!-- Brand Petrifilm -->
                <text x="45" y="55" fill="#ffffff" font-family="sans-serif" font-size="14" font-weight="bold">3M™ Petrifilm™</text>
                <text x="355" y="55" fill="#fee2e2" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="end">E. coli / Coliform</text>
                <!-- Bottom label -->
                <rect x="70" y="348" width="260" height="20" rx="3" fill="#ffffff" opacity="0.9"/>
                <text x="200" y="362" fill="#991b1b" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">AOAC 991.14 / LOTE-PF-2026</text>
            </svg>
        `)
    },
    {
        id: 'ev-intake-3',
        stage: 'INTAKE_COLD_CHAIN',
        title: 'Condición de Ingreso: Cadena de Frío & Precinto',
        description: 'Inspección de muestra en recepción: hielera isotérmica sellada con precinto de seguridad #8841. Temperatura medida con termómetro calibrado Traceable: 4.2°C (Cumple con rango ISO 7218: 1°C - 8°C).',
        medium: 'Hielera Térmica Certificada',
        dilution: 'N/A (Muestra Íntegra)',
        incubation: 'Recepción 4.2 °C',
        resultObservation: 'Envase estéril de 500 mL con tiosulfato de sodio, precinto intacto.',
        analyst: 'Recepción Técnica Microlabs',
        timestamp: '2026-09-16 08:45',
        imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
                <rect width="400" height="400" fill="#0f172a"/>
                <!-- Fondo Hielera -->
                <rect x="40" y="70" width="320" height="260" rx="16" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
                <!-- Frasco de Muestra de Agua -->
                <rect x="140" y="110" width="120" height="170" rx="12" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" opacity="0.9"/>
                <!-- Líquido agua -->
                <rect x="145" y="160" width="110" height="115" rx="8" fill="#38bdf8" opacity="0.6"/>
                <!-- Tapa del frasco -->
                <rect x="155" y="95" width="90" height="25" rx="4" fill="#0284c7"/>
                <!-- Precinto de seguridad -->
                <rect x="135" y="115" width="130" height="10" fill="#eab308"/>
                <text x="200" y="123" fill="#000000" font-family="monospace" font-size="8" font-weight="black" text-anchor="middle">PRECINTO #8841</text>
                <!-- Termómetro Digital Flotante -->
                <rect x="60" y="240" width="120" height="60" rx="8" fill="#020617" stroke="#10b981" stroke-width="2"/>
                <text x="120" y="260" fill="#94a3b8" font-family="monospace" font-size="9" text-anchor="middle">TEMPERATURA</text>
                <text x="120" y="288" fill="#34d399" font-family="monospace" font-size="22" font-weight="black" text-anchor="middle">4.2 °C</text>
                <!-- Badge de Conformidad -->
                <rect x="230" y="250" width="115" height="45" rx="8" fill="#065f46" stroke="#34d399" stroke-width="1.5"/>
                <text x="287" y="268" fill="#a7f3d0" font-family="sans-serif" font-size="10" font-weight="black" text-anchor="middle">CADENA DE FRÍO</text>
                <text x="287" y="284" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">✓ CONFORME</text>
                <!-- Header -->
                <text x="200" y="45" fill="#f8fafc" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">RECEPCIÓN DE MUESTRA SEGÚN ISO 7218</text>
            </svg>
        `)
    },
    {
        id: 'ev-sampling-4',
        stage: 'SAMPLING_POINT',
        title: 'Punto de Muestreo en Sitio: Grifo Monitoreado',
        description: 'Toma de muestra en grifo designado. Protocolo: Purga previa durante 2-3 minutos a flujo constante, desinfección con hipoclorito de sodio al 1%, flameado y colecta aséptica en frasco estéril con tiosulfato.',
        medium: 'Grifo Monitoreado en Planta',
        dilution: 'N/A',
        incubation: 'En campo',
        resultObservation: 'Punto de control identificado y rotulado según cronograma anual.',
        analyst: 'Muestreador de Campo Certificado',
        timestamp: '2026-09-16 07:30',
        imageUrl: 'data:image/svg+xml;utf8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
                <rect width="400" height="400" fill="#1e293b"/>
                <!-- Pared de azulejos blancos del laboratorio -->
                <defs>
                    <pattern id="tiles" width="40" height="40" patternUnits="userSpaceOnUse">
                        <rect width="40" height="40" fill="#334155" stroke="#475569" stroke-width="1"/>
                    </pattern>
                </defs>
                <rect x="20" y="20" width="360" height="360" fill="url(#tiles)" rx="12"/>
                <!-- Grifo de acero inoxidable -->
                <path d="M 120 180 L 220 180 C 250 180 270 190 270 230 L 270 260" fill="none" stroke="#cbd5e1" stroke-width="26" stroke-linecap="round"/>
                <path d="M 120 180 L 220 180 C 250 180 270 190 270 230 L 270 260" fill="none" stroke="#f8fafc" stroke-width="10" stroke-linecap="round"/>
                <!-- Chorro de agua laminar aséptico -->
                <rect x="264" y="260" width="12" height="90" fill="#38bdf8" opacity="0.8" rx="4"/>
                <!-- Frasco estéril colectando -->
                <rect x="235" y="300" width="70" height="75" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" opacity="0.85"/>
                <!-- Etiqueta de punto de muestreo -->
                <rect x="50" y="50" width="220" height="50" rx="8" fill="#0f172a" stroke="#60a5fa" stroke-width="1.5"/>
                <text x="60" y="70" fill="#93c5fd" font-family="monospace" font-size="10" font-weight="bold">PUNTO DE MUESTREO: #01</text>
                <text x="60" y="88" fill="#f8fafc" font-family="sans-serif" font-size="12" font-weight="bold">1. BAÑO HOMBRES (GRIFO)</text>
                <!-- Badge de desinfección -->
                <rect x="250" y="50" width="110" height="35" rx="6" fill="#1e1b4b" stroke="#818cf8" stroke-width="1"/>
                <text x="305" y="72" fill="#c7d2fe" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">FLAMEADO ASÉPTICO</text>
            </svg>
        `)
    }
];
