import React, { useState, useMemo } from 'react';
import { 
    HelpCircle, Search, ChevronDown, ChevronUp, Microscope, Users, Cpu, 
    Activity, FileText, PlusCircle, Printer, ArrowRight, Sparkles, 
    AlertTriangle, CheckCircle2, Info, Lock 
} from 'lucide-react';

export const HelpView = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [openIndex, setOpenIndex] = useState(null);
    const [lang, setLang] = useState('es');

    // Interactive Troubleshooting Simulator States
    const [problemArea, setProblemArea] = useState('');
    const [specificProblem, setSpecificProblem] = useState('');

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const translations = {
        es: {
            supportCenter: 'Centro de Soporte Operativo',
            howHelp: '¿En qué podemos ayudarte hoy?',
            helpDesc: 'Aquí encontrarás guías completas sobre el uso del LIMS, resolución de problemas y flujos analíticos para garantizar la máxima calidad en los resultados de laboratorio.',
            statAccessioning: 'Ingreso de Muestras',
            statAccessioningDesc: 'Creación de órdenes rápidas',
            statCustody: 'Custodia Física',
            statCustodyDesc: 'Doble firma con PIN seguro',
            statAnalyzers: 'Analizadores',
            statAnalyzersDesc: 'Mapeo de datos middleware',
            statQc: 'Gráficos de QC',
            statQcDesc: 'L-J y Reglas de Westgard',
            titleManuals: 'Manuales del LIMS y Guías Operativas',
            searchPlaceholder: "Busca palabras clave (ej. 'custodia', 'pdf', 'imprimir')...",
            searchNoResults: 'No se encontraron guías para tu búsqueda.',
            searchNoResultsDesc: 'Intenta con otros términos generales.',
            titleTroubleshooting: 'Asistente de Problemas',
            troubleDesc: 'Selecciona el área de tu consulta para obtener una guía paso a paso y resolver inconvenientes en tiempo real.',
            selectAreaLabel: '1. ¿Con qué tienes dudas?',
            selectAreaPlaceholder: '-- Selecciona un área --',
            selectProblemLabel: '2. Detalle del inconveniente',
            selectProblemPlaceholder: '-- Selecciona el problema específico --',
            solutionRecommended: 'Solución Recomendada',
            checklistTitle: 'Checklist Operacional Diario',
            contactTitle: '¿Problemas Técnicos Graves?',
            contactDesc: 'Si experimenta fallos de conectividad, caída de bases de datos o error de servidor físico:',
            contactSupport: 'Soporte Técnico LIMS:',
            contactPhone: '📞 Ext. 4022 / +506 4000-8899',
            contactEmail: '✉️ soporte.sistemas@microlabs.com',
            categories: {
                all: 'Todos',
                accessioning: 'Ingreso',
                custody: 'Custodia',
                equipment: 'Analizadores',
                qc: 'Calidad (QC)',
                reports: 'Reportes'
            }
        },
        en: {
            supportCenter: 'Operational Support Center',
            howHelp: 'How can we help you today?',
            helpDesc: 'Here you will find complete guides on using the LIMS, troubleshooting, and analytical flows to ensure maximum quality in laboratory results.',
            statAccessioning: 'Sample Accessioning',
            statAccessioningDesc: 'Fast order creation',
            statCustody: 'Physical Custody',
            statCustodyDesc: 'Double signature with secure PIN',
            statAnalyzers: 'Analyzers',
            statAnalyzersDesc: 'Middleware data mapping',
            statQc: 'QC Charts',
            statQcDesc: 'L-J and Westgard Rules',
            titleManuals: 'LIMS Manuals and Operating Guides',
            searchPlaceholder: "Search keywords (e.g., 'custody', 'pdf', 'print')...",
            searchNoResults: 'No guides found for your search.',
            searchNoResultsDesc: 'Try using other general terms.',
            titleTroubleshooting: 'Troubleshooting Assistant',
            troubleDesc: 'Select your query area to get a step-by-step guide and resolve issues in real time.',
            selectAreaLabel: '1. What are your doubts about?',
            selectAreaPlaceholder: '-- Select an area --',
            selectProblemLabel: '2. Issue details',
            selectProblemPlaceholder: '-- Select specific problem --',
            solutionRecommended: 'Recommended Solution',
            checklistTitle: 'Daily Operational Checklist',
            contactTitle: 'Severe Technical Problems?',
            contactDesc: 'If you experience connectivity failures, database crashes, or physical server issues:',
            contactSupport: 'LIMS Technical Support:',
            contactPhone: '📞 Ext. 4022 / +506 4000-8899',
            contactEmail: '✉️ soporte.sistemas@microlabs.com',
            categories: {
                all: 'All',
                accessioning: 'Accessioning',
                custody: 'Custody',
                equipment: 'Analyzers',
                qc: 'Quality (QC)',
                reports: 'Reports'
            }
        }
    };

    const t = translations[lang];

    // Guide categories and topics
    const guides = useMemo(() => {
        return lang === 'es' ? [
            {
                id: 'accessioning-1',
                category: 'accessioning',
                categoryName: 'Ingreso de Muestras',
                title: '¿Cómo registrar un nuevo paciente y su solicitud?',
                content: 'Para registrar un paciente nuevo:\n1. Diríjase a "Ingreso Muestras" en el menú.\n2. Ingrese los datos demográficos (Nombre, DNI, Edad, Sexo).\n3. En la sección de análisis, digite el código o nombre del examen en la barra de búsqueda y presione Enter o haga clic en la sugerencia para añadirlo.\n4. Complete la información de facturación y haga clic en "Crear Solicitud". Se generará automáticamente el ID único con el formato MC-AAAA-XXXX.',
                keywords: 'ingreso registrar paciente nuevo examen agregar solicitud'
            },
            {
                id: 'accessioning-2',
                category: 'accessioning',
                categoryName: 'Ingreso de Muestras',
                title: 'Impresión y pegado de etiquetas de código de barras',
                content: 'El código de barras asegura la trazabilidad:\n1. Al crear la solicitud, se muestra un botón para "Imprimir Código de Barras".\n2. Asegúrese de que la impresora de etiquetas térmicas esté encendida y alineada.\n3. Pegue la etiqueta verticalmente sobre el tubo de ensayo o contenedor, evitando arrugas sobre el código de barras para que los lectores ópticos de los analizadores automatizados puedan escanearlo correctamente.',
                keywords: 'etiqueta codigo de barras barcode imprimir pegar tubo'
            },
            {
                id: 'custody-1',
                category: 'custody',
                categoryName: 'Cadena de Custodia',
                title: '¿Cómo registrar una transferencia física de muestra?',
                content: 'La cadena de custodia física registra la ubicación exacta y el responsable de la muestra:\n1. Ingrese a "Solicitudes", busque el código correspondiente y vaya a "Ver Detalles".\n2. Seleccione la pestaña "Cadena de Custodia".\n3. Haga clic en "Registrar Transferencia".\n4. Complete el destinatario (ej. Lic. María Delgado), la nueva ubicación física (ej. Mesón de Trabajo B) y el motivo (ej. Procesamiento).\n5. Solicite las firmas electrónicas ingresando los PINs de seguridad (firma doble de entregador y receptor) y guarde los cambios.',
                keywords: 'custodia transferencia física pin firma entregar recibir transferir'
            },
            {
                id: 'custody-2',
                category: 'custody',
                categoryName: 'Cadena de Custodia',
                title: '¿Cómo corregir un error en la cadena de custodia?',
                content: 'Por seguridad regulatoria, las transferencias de custodia firmadas electrónicamente no se pueden borrar ni editar. Si cometió un error (por ejemplo, registrar una ubicación equivocada), debe realizar una nueva transferencia de custodia inmediatamente indicando la ubicación correcta y agregando en el motivo una aclaración aclaratoria (ej. "Corrección de registro anterior por error de dedo"). El sistema mantendrá el registro histórico completo para fines de auditoría.',
                keywords: 'corregir error borrar custodia editar historial auditoria'
            },
            {
                id: 'equipment-1',
                category: 'equipment',
                categoryName: 'Analizadores',
                title: 'Procesamiento de resultados desde la bandeja de entrada de equipos',
                content: 'Los analizadores envían los resultados directamente a la base de datos:\n1. Vaya a "Analizadores" (Bandeja de Entrada de Analizadores).\n2. El sistema muestra los registros con estado "Pendiente" que han sido transmitidos por los equipos automatizados (ej. Mindray BC-5300).\n3. Verifique la coincidencia del ID de Muestra con el del LIMS.\n4. Haga clic en "Importar Resultados" para mover los datos analíticos hacia la hoja de revisión del paciente. Los valores que se salgan de los rangos de referencia se marcarán automáticamente con alertas.',
                keywords: 'analizador equipo automatizado importar bandeja de entrada mindray sysmex'
            },
            {
                id: 'equipment-2',
                category: 'equipment',
                categoryName: 'Analizadores',
                title: '¿Qué hacer si un analizador no transmite los resultados?',
                content: 'Si un equipo analítico finalizó la corrida pero el LIMS no muestra los datos:\n1. Confirme la conexión a la red local (Ethernet/WiFi) del computador del analizador y de la central LIMS.\n2. Revise si el servicio "LIMS-Middleware Bridge" está en ejecución en la barra de herramientas del sistema.\n3. Verifique en la consola del equipo si el resultado fue enviado a la cola de exportación ASTM/HL7.\n4. Si el problema persiste, utilice el "Ingreso Manual de Resultados" en la solicitud correspondiente para evitar retrasar el reporte clínico, y reporte el incidente a soporte técnico.',
                keywords: 'analizador no transmite conexion middleware astm hl7 red manual'
            },
            {
                id: 'qc-1',
                category: 'qc',
                categoryName: 'Control de Calidad (QC)',
                title: 'Monitoreo de cartas de Levey-Jennings y Reglas de Westgard',
                content: 'El control de calidad interno asegura la precisión analítica:\n1. Acceda al módulo "Calidad" (QC).\n2. Seleccione el analizador y el analito (ej. Glucosa).\n3. La gráfica de Levey-Jennings ilustrará los puntos diarios con respecto a la Media, +/- 1SD, +/- 2SD y +/- 3SD.\n4. El sistema evalúa automáticamente las Reglas de Westgard:\n   - 1_2s: Alerta de advertencia si un valor supera 2 desviaciones estándar.\n   - 1_3s / 2_2s / R_4s: Violaciones de rechazo sistemático o aleatorio. En estos casos, la corrida del día queda bloqueada para validación clínica hasta que se registre una acción correctiva.',
                keywords: 'calidad qc levey jennings westgard desviacion error calibrador control'
            },
            {
                id: 'qc-2',
                category: 'qc',
                categoryName: 'Control de Calidad (QC)',
                title: '¿Cómo registrar un nuevo lote de suero control?',
                content: 'Al recibir un nuevo lote de reactivo/control:\n1. Vaya a "Calidad" -> "Configurar Controles/Lotes".\n2. Presione "Nuevo Lote de Control".\n3. Introduzca el código del lote, fecha de vencimiento, nivel (Nivel 1 Normal o Nivel 2 Patológico), y los valores diana declarados por el fabricante (Media y Desviación Estándar).\n4. Guarde el registro para que las nuevas lecturas de QC se comparen contra estos parámetros actualizados.',
                keywords: 'lote control suero reactivo media desviacion diana calibrador'
            },
            {
                id: 'reports-1',
                category: 'reports',
                categoryName: 'Informes y Validación',
                title: 'Flujo de aprobación: Pre-informes vs Informes Finales',
                content: 'El LIMS maneja estados estrictos antes de que el paciente reciba sus resultados:\n- **Pre-informe (Borrador)**: Contiene resultados parciales o pendientes de firma. El botón de PDF está disponible para revisión médica interna, pero cuenta con marcas de agua de "Borrador Incompleto".\n- **Informe Final**: Se habilita una vez que todos los analitos requeridos han sido validados y firmados electrónicamente por el profesional responsable (microbiólogo / patólogo). Al guardar como aprobado, el PDF final se genera limpio, con firma digital/código QR y se libera de forma automática en el Portal del Paciente y de la Empresa.',
                keywords: 'pre informe borrador final validacion firma microbiologo aprobar liberar'
            },
            {
                id: 'reports-2',
                category: 'reports',
                categoryName: 'Informes y Validación',
                title: '¿Por qué un cliente no puede descargar su PDF?',
                content: 'El Portal de Clientes bloquea la descarga de informes PDF si la solicitud no está en estado "Aprobado". Esto previene que los pacientes o empresas lean resultados preliminares que no han pasado por el control de calidad interno o la firma del microbiólogo. En el portal se les mostrará el estado de la muestra como "En Proceso" o "Pendiente de Aprobación" con el botón de descarga inactivo y con un candado de seguridad.',
                keywords: 'cliente pdf descargar bloqueado candado aprobado proceso revision'
            }
        ] : [
            {
                id: 'accessioning-1',
                category: 'accessioning',
                categoryName: 'Sample Accessioning',
                title: 'How to register a new patient and request?',
                content: 'To register a new patient:\n1. Go to "Sample Accessioning" in the menu.\n2. Enter demographic data (Name, ID/DNI, Age, Gender).\n3. In the analysis section, type the test code or name in the search bar and press Enter or click the suggestion to add it.\n4. Complete the billing information and click "Create Request". The unique ID will be automatically generated with the format MC-YYYY-XXXX.',
                keywords: 'accession register new patient exam test add request'
            },
            {
                id: 'accessioning-2',
                category: 'accessioning',
                categoryName: 'Sample Accessioning',
                title: 'Printing and applying barcode labels',
                content: 'The barcode ensures traceability:\n1. Upon creating the request, a button to "Print Barcode" is displayed.\n2. Ensure the thermal label printer is powered on and aligned.\n3. Apply the label vertically on the test tube or container, avoiding wrinkles over the barcode so that the optical scanners of automated analyzers can read it correctly.',
                keywords: 'label barcode print apply tube'
            },
            {
                id: 'custody-1',
                category: 'custody',
                categoryName: 'Chain of Custody',
                title: 'How to register a physical sample transfer?',
                content: 'The physical chain of custody logs the exact location and custodian of the sample:\n1. Go to "Requests", search for the corresponding code, and click "View Details".\n2. Select the "Chain of Custody" tab.\n3. Click "Register Transfer".\n4. Enter the recipient (e.g., María Delgado, MT), the new physical location (e.g., Workstation B), and the reason (e.g., Processing).\n5. Request digital signatures by entering security PINs (dual signature of deliverer and receiver) and save changes.',
                keywords: 'custody physical transfer pin signature deliver receive transfer'
            },
            {
                id: 'custody-2',
                category: 'custody',
                categoryName: 'Chain of Custody',
                title: 'How to correct a chain of custody error?',
                content: 'For regulatory safety, electronically signed custody transfers cannot be deleted or edited. If you made a mistake (e.g., registering an incorrect location), you must immediately perform a new custody transfer indicating the correct location and adding a clarification in the reason (e.g., "Correction of previous entry due to input error"). The system keeps the full historical log for auditing purposes.',
                keywords: 'correct error delete custody edit history audit'
            },
            {
                id: 'equipment-1',
                category: 'equipment',
                categoryName: 'Analyzers',
                title: 'Processing results from the analyzer inbox',
                content: 'Analyzers send results directly to the database:\n1. Go to "Analyzers" (Analyzer Inbox).\n2. The system shows records with "Pending" status transmitted by automated equipment (e.g., Mindray BC-5300).\n3. Verify that the Sample ID matches the LIMS ID.\n4. Click "Import Results" to transfer the analytical data to the patient\'s review sheet. Values falling outside reference ranges will be automatically flagged with alerts.',
                keywords: 'analyzer automated equipment import inbox mindray sysmex'
            },
            {
                id: 'equipment-2',
                category: 'equipment',
                categoryName: 'Analyzers',
                title: 'What to do if an analyzer does not transmit results?',
                content: 'If an analyzer has finished the run but the LIMS does not show the data:\n1. Confirm the local network connection (Ethernet/WiFi) of both the analyzer PC and the LIMS server.\n2. Check if the "LIMS-Middleware Bridge" service is running in the system tray.\n3. Verify in the equipment console if the result was sent to the ASTM/HL7 export queue.\n4. If the problem persists, use "Manual Results Entry" on the corresponding request to avoid delaying the clinical report, and report the issue to tech support.',
                keywords: 'analyzer does not transmit connection middleware astm hl7 network manual'
            },
            {
                id: 'qc-1',
                category: 'qc',
                categoryName: 'Quality Control (QC)',
                title: 'Monitoring Levey-Jennings charts and Westgard Rules',
                content: 'Internal quality control ensures analytical precision:\n1. Access the "Quality" (QC) module.\n2. Select the analyzer and analyte (e.g., Glucose).\n3. The Levey-Jennings chart will illustrate the daily points with respect to the Mean, +/- 1SD, +/- 2SD, and +/- 3SD.\n4. The system automatically evaluates Westgard Rules:\n   - 1_2s: Warning alert if a value exceeds 2 standard deviations.\n   - 1_3s / 2_2s / R_4s: Rejection violations (systemic or random error). In these cases, the day\'s run is blocked for clinical validation until a corrective action is registered.',
                keywords: 'quality qc levey jennings westgard deviation error calibrator control'
            },
            {
                id: 'qc-2',
                category: 'qc',
                categoryName: 'Quality Control (QC)',
                title: 'How to register a new control lot?',
                content: 'Upon receiving a new reagent/control lot:\n1. Go to "Quality" -> "Configure Lots".\n2. Click "New Control Lot".\n3. Enter the lot code, expiration date, level (Level 1 Normal or Level 2 Pathological), and target values declared by the manufacturer (Mean and Standard Deviation).\n4. Save the entry so that new QC readings are evaluated against these updated parameters.',
                keywords: 'lot control serum reagent mean deviation target calibrator'
            },
            {
                id: 'reports-1',
                category: 'reports',
                categoryName: 'Reports & Validation',
                title: 'Approval flow: Draft reports vs Final reports',
                content: 'The LIMS handles strict states before the patient receives results:\n- **Draft Report (Pre-informe)**: Contains partial results or pending signatures. The PDF button is available for internal medical review but has "Draft / Incomplete" watermarks.\n- **Final Report**: Enabled once all required analytes have been validated and digitally signed by the responsible professional (microbiologist/pathologist). Upon approval, the final PDF is generated clean, with digital signatures/QR code, and automatically released to the Patient and Company Portals.',
                keywords: 'draft final validation signature microbiologist approve release'
            },
            {
                id: 'reports-2',
                category: 'reports',
                categoryName: 'Reports & Validation',
                title: 'Why can\'t a client download their PDF?',
                content: 'The Client Portal blocks the download of PDF reports if the request is not in the "Approved" state. This prevents patients or companies from reading preliminary results that have not passed internal quality control or the microbiologist\'s signature. On the portal, the sample status will show as "In Process" or "Pending Approval" with the download button disabled and locked.',
                keywords: 'client pdf download blocked lock approved process review'
            }
        ];
    }, [lang]);

    // Filter guides based on category and search query
    const filteredGuides = useMemo(() => {
        return guides.filter(guide => {
            const matchesCategory = activeCategory === 'all' || guide.category === activeCategory;
            
            const matchesSearch = !searchQuery.trim() || 
                guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                guide.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                guide.keywords.toLowerCase().includes(searchQuery.toLowerCase());
                
            return matchesCategory && matchesSearch;
        });
    }, [searchQuery, activeCategory, guides]);

    // Problem troubleshooting mapping
    const specificProblemsMap = useMemo(() => {
        return lang === 'es' ? {
            'ingreso': [
                { value: 'no_encuentro_analisis', label: 'No encuentro un análisis clínico en el listado' },
                { value: 'dni_duplicado', label: 'El sistema me dice que el DNI del paciente ya existe' },
                { value: 'error_demograficos', label: 'Escribí mal el nombre de la solicitud ya guardada' }
            ],
            'custodia': [
                { value: 'pin_invalido', label: 'El formulario indica PIN Inválido de entregador/receptor' },
                { value: 'no_aparece_timeline', label: 'No veo la transferencia reflejada en la línea de tiempo' },
                { value: 'perdida_muestra', label: 'Muestra perdida o derramada (cómo registrar el desecho)' }
            ],
            'analizadores': [
                { value: 'sin_transmision', label: 'El equipo terminó el test pero no aparece en el LIMS' },
                { value: 'id_incorrecto', label: 'Los resultados entraron con un ID erróneo en la bandeja' },
                { value: 'valores_fuera', label: 'El analizador envió datos extraños o valores en blanco' }
            ],
            'qc': [
                { value: 'alerta_westgard', label: 'El gráfico de QC muestra un punto en zona roja (Alerta Westgard)' },
                { value: 'cambio_lote', label: 'Tengo que cambiar el lote de controles de Hematología/Química' }
            ],
            'reportes': [
                { value: 'pdf_bloqueado', label: 'El paciente llama porque su PDF aparece bloqueado' },
                { value: 'modificar_firmado', label: 'Necesito modificar un resultado que ya fue firmado y aprobado' }
            ]
        } : {
            'ingreso': [
                { value: 'no_encuentro_analisis', label: 'I cannot find a clinical test in the list' },
                { value: 'dni_duplicado', label: 'The system says the patient DNI already exists' },
                { value: 'error_demograficos', label: 'I misspelled the patient name on a saved request' }
            ],
            'custodia': [
                { value: 'pin_invalido', label: 'The form shows Invalid PIN for deliverer/receiver' },
                { value: 'no_aparece_timeline', label: 'I do not see the transfer reflected in the timeline' },
                { value: 'perdida_muestra', label: 'Lost or spilled sample (how to record disposal)' }
            ],
            'analizadores': [
                { value: 'sin_transmision', label: 'The equipment finished the test but it does not show in LIMS' },
                { value: 'id_incorrecto', label: 'Results entered with an incorrect ID in the inbox' },
                { value: 'valores_fuera', label: 'The analyzer sent strange data or blank values' }
            ],
            'qc': [
                { value: 'alerta_westgard', label: 'The QC chart shows a point in the red zone (Westgard Alert)' },
                { value: 'cambio_lote', label: 'I have to change the control lot for Hematology/Chemistry' }
            ],
            'reportes': [
                { value: 'pdf_bloqueado', label: 'The patient is calling because their PDF appears locked' },
                { value: 'modificar_firmado', label: 'I need to modify a result that has already been signed/approved' }
            ]
        };
    }, [lang]);

    const getTroubleshootingSolution = () => {
        if (!problemArea || !specificProblem) return null;

        if (lang === 'es') {
            switch (specificProblem) {
                // Ingreso
                case 'no_encuentro_analisis':
                    return {
                        title: 'Búsqueda e inclusión de exámenes',
                        steps: [
                            'Verifique que no haya errores ortográficos o de acentuación en el buscador.',
                            'Si el análisis es poco común, intente buscarlo por su abreviatura o siglas (ej. "TGO" en lugar de "Transaminasa Glutámico Oxalacética").',
                            'Si el examen es de reciente introducción, un administrador debe registrarlo primero en "Configuración de Análisis" (Configuración -> Análisis) agregando su código único, nombre oficial, reactivos consumidos y rangos de referencia.'
                        ],
                        alert: 'No asigne análisis genéricos u homónimos sin autorización para no alterar el cobro y la interpretación clínica.'
                    };
                case 'dni_duplicado':
                    return {
                        title: 'DNI existente en la base de datos',
                        steps: [
                            'El LIMS valida la unicidad de los pacientes mediante su número de cédula, DNI o pasaporte.',
                            'Si el DNI ya existe, el sistema cargará automáticamente la ficha demográfica histórica del paciente para evitar duplicar registros.',
                            'Simplemente presione el botón de "Cargar Paciente Histórico" y proceda a registrar la nueva solicitud clínica. Esto permite mantener el historial del paciente unificado.'
                        ]
                    };
                case 'error_demograficos':
                    return {
                        title: 'Corrección de datos demográficos de la solicitud',
                        steps: [
                            'Si la solicitud está en estado "Pendiente" o "En Proceso", diríjase a la sección "CRM" o "Clientes" -> "Buscar Paciente" y edite la ficha del paciente para corregir nombres, teléfonos o correos.',
                            'Si necesita modificar los exámenes incluidos en una solicitud activa, entre al detalle de la solicitud, presione "Modificar Análisis" (requiere rol Admin), agregue o remueva el análisis y guarde.',
                            'Si el informe ya está firmado y aprobado, por políticas de calidad de laboratorio no podrá editar los datos demográficos. Deberá contactar al administrador para anular la solicitud y generar una rectificación.'
                        ]
                    };

                // Custodia
                case 'pin_invalido':
                    return {
                        title: 'Fallo de PIN de Seguridad en Custodia',
                        steps: [
                            'Para validar una transferencia de posesión de muestra, ambos operadores deben introducir un PIN válido de 4 dígitos.',
                            'Para pruebas y simulación rápida del sistema LIMS, utilice el PIN "1234" para el Entregador y el PIN "5678" para el Receptor.',
                            'En el entorno real, verifique que los operadores no tengan el teclado bloqueado y que utilicen los PINs personales configurados en su ficha de usuario.'
                        ],
                        alert: 'Nunca comparta su PIN de seguridad con otros compañeros. El registro de custodia física es un documento con validez legal e interna.'
                    };
                case 'no_aparece_timeline':
                    return {
                        title: 'Línea de tiempo no actualizada',
                        steps: [
                            'Asegúrese de haber hecho clic en el botón "Guardar Transferencia" después de completar los PINs de seguridad.',
                            'El LIMS actualiza en tiempo real los datos usando Firestore. Si la conexión de red es lenta, recargue la página (F5) para forzar la sincronización.',
                            'Verifique en la pestaña "Cadena de Custodia" si el estado del banner superior cambió para mostrar al nuevo custodio y ubicación actual.'
                        ]
                    };
                case 'perdida_muestra':
                    return {
                        title: 'Registro de Desecho o Muestra No Apta',
                        steps: [
                            'Si una muestra se derrama, se hemoliza o no es apta para procesamiento:',
                            '1. Genere una transferencia de custodia seleccionando como Receptor: "Desecho Biológico / Incinerador" o "Área de Rechazo".',
                            '2. En el Motivo, seleccione: "Muestra No Apta / Rechazada".',
                            '3. Informe inmediatamente al paciente o al médico a través de la sección CRM para programar una toma de muestra de reposición (re-toma) sin costo adicional.'
                        ]
                    };

                // Analizadores
                case 'sin_transmision':
                    return {
                        title: 'Fallo de transmisión de equipo automatizado',
                        steps: [
                            'Confirme que el equipo analítico (ej. Mindray, Sysmex) tenga salida de datos habilitada (host communication activado).',
                            'Revise el computador del Middleware local del laboratorio y asegúrese de que el software de conexión esté encendido.',
                            'Vaya a "Analizadores" en la barra lateral del LIMS y revise si los datos entraron con un código de barra huérfano. De ser así, asocie manualmente el código de la corrida al ID de la solicitud correspondiente.'
                        ]
                    };
                case 'id_incorrecto':
                    return {
                        title: 'Resultados ingresados en ID erróneo',
                        steps: [
                            'Si el operador digitó mal el ID de la muestra en la consola física del analizador, los resultados se transmitirán a un ID inexistente.',
                            '1. Ingrese a "Analizadores" en el menú.',
                            '2. Localice la transmisión errónea en la bandeja de entrada.',
                            '3. Haga clic en el botón de reasociación manual de ID, digite el ID correcto de la solicitud LIMS y aplique la corrección.'
                        ]
                    };
                case 'valores_fuera':
                    return {
                        title: 'Parámetros analíticos vacíos o extraños',
                        steps: [
                            'Verifique si el equipo requiere calibración de reactivos.',
                            'Si el analizador envía campos vacíos, confirme si el examen clínico del LIMS contiene exactamente los mismos códigos de parámetros configurados en el Middleware (mapeo de canales).',
                            'Si el examen físico tiene resultados manuales complementarios, utilice el módulo de "Ingreso Manual" en la pestaña de la solicitud para rellenar los datos faltantes.'
                        ]
                    };

                // QC
                case 'alerta_westgard':
                    return {
                        title: 'Acción Correctiva ante Desvío de Control de Calidad',
                        steps: [
                            'Si un punto de QC sobrepasa 3 desviaciones estándar (Regla 1_3s) o dos puntos consecutivos superan 2 desviaciones estándar (Regla 2_2s):',
                            '1. No valide ni apruebe resultados de pacientes para este analito.',
                            '2. Prepare un nuevo vial de suero de control y repita la corrida.',
                            '3. Si el error persiste, realice el mantenimiento del equipo, calibre el canal de reactivo y vuelva a procesar.',
                            '4. Una vez que el control esté dentro del rango de aceptación (verde), documente la acción correctiva en el módulo de QC para liberar el bloqueo de aprobación de pacientes.'
                        ],
                        alert: 'Liberar resultados con controles de calidad fuera de rango invalida la acreditación ISO 15189 del laboratorio.'
                    };
                case 'cambio_lote':
                    return {
                        title: 'Configuración de Nuevos Valores Diana',
                        steps: [
                            'Antes de procesar controles de un nuevo lote del fabricante, introduzca los valores de la hoja técnica:',
                            '1. Ingrese al módulo "Calidad".',
                            '2. Seleccione "Agregar Nuevo Lote Control".',
                            '3. Introduzca la Media y Desviación Estándar teóricas.',
                            '4. Cambie el estado del lote anterior a "Inactivo" para evitar confusiones en los gráficos históricos.'
                        ]
                    };

                // Reportes
                case 'pdf_bloqueado':
                    return {
                        title: 'Liberación de Informes de Resultados',
                        steps: [
                            'Los pacientes y empresas no pueden descargar archivos PDF que estén en estados parciales o en revisión.',
                            '1. Revise la solicitud correspondiente en "Solicitudes".',
                            '2. Verifique si todos los exámenes solicitados tienen resultados y si han sido firmados.',
                            '3. Firme digitalmente y marque el informe como "Aprobado". Esto liberará inmediatamente el PDF para descarga directa desde el portal externo.'
                        ]
                    };
                case 'modificar_firmado':
                    return {
                        title: 'Modificación de Reportes Aprobados',
                        steps: [
                            'Por trazabilidad ISO, un reporte aprobado y firmado digitalmente no puede ser editado directamente de forma sigilosa.',
                            '1. El microbiólogo responsable debe cambiar el estatus de la solicitud a "En Enmienda".',
                            '2. Se generará un log automático de auditoría requiriendo justificar el cambio.',
                            '3. Modifique los resultados clínicos y vuelva a firmar. El reporte PDF final ahora incluirá una leyenda legal de "Reporte Rectificado / Enmienda del informe MC-XXXX" cumpliendo con los estándares internacionales.'
                        ]
                    };

                default:
                    return null;
            }
        } else {
            switch (specificProblem) {
                // Ingreso
                case 'no_encuentro_analisis':
                    return {
                        title: 'Searching and adding tests',
                        steps: [
                            'Verify there are no spelling or accentuation errors in the search bar.',
                            'If the test is uncommon, try searching by abbreviation or acronym (e.g., "AST" instead of "Aspartate Aminotransferase").',
                            'If the test was recently introduced, an administrator must first register it under "Analysis Settings" (Settings -> Analysis) by adding its unique code, official name, reagents consumed, and reference ranges.'
                        ],
                        alert: 'Do not assign generic or homonymous analyses without authorization to avoid altering billing and clinical interpretation.'
                    };
                case 'dni_duplicado':
                    return {
                        title: 'Existing DNI/ID in database',
                        steps: [
                            'The LIMS validates patient uniqueness using their ID, DNI, or passport number.',
                            'If the DNI already exists, the system will automatically load the patient\'s historical demographic record to avoid duplicate entries.',
                            'Simply press "Load Historical Patient" and proceed to register the new clinical request. This keeps the patient\'s history unified.'
                        ]
                    };
                case 'error_demograficos':
                    return {
                        title: 'Correction of request demographics data',
                        steps: [
                            'If the request is in "Pending" or "In Process" status, go to "CRM" or "Clients" -> "Search Patient" and edit the patient profile to correct names, phone numbers, or emails.',
                            'If you need to modify the tests included in an active request, open the request details, click "Modify Analysis" (Admin role required), add or remove the test, and save.',
                            'If the report is already signed and approved, quality laboratory policies prevent editing demographics. You must contact the administrator to cancel the request and issue a rectification.'
                        ]
                    };

                // Custodia
                case 'pin_invalido':
                    return {
                        title: 'Security PIN Failure in Custody Transfer',
                        steps: [
                            'To validate a sample transfer of ownership, both operators must enter a valid 4-digit PIN.',
                            'For testing and quick LIMS simulation, use PIN "1234" for the Deliverer and PIN "5678" for the Receiver.',
                            'In the production environment, verify that operators do not have the caps lock on and that they use the personal PINs configured in their user profile.'
                        ],
                        alert: 'Never share your security PIN with other colleagues. The physical custody log is a document with legal and internal validity.'
                    };
                case 'no_aparece_timeline':
                    return {
                        title: 'Timeline not updating',
                        steps: [
                            'Make sure you clicked the "Save Transfer" button after completing the security PINs.',
                            'The LIMS updates data in real time using Firestore. If the network connection is slow, reload the page (F5) to force synchronization.',
                            'Check in the "Chain of Custody" tab if the upper banner status changed to show the new custodian and current location.'
                        ]
                    };
                case 'perdida_muestra':
                    return {
                        title: 'Recording Waste or Unsuitable Sample',
                        steps: [
                            'If a sample is spilled, hemolyzed, or is not suitable for processing:',
                            '1. Generate a custody transfer selecting as Receiver: "Biological Waste / Incinerator" or "Rejection Area".',
                            '2. In the Reason field, select: "Unsuitable Sample / Rejected".',
                            '3. Immediately inform the patient or physician via the CRM section to schedule a replacement sample collection (re-take) at no additional cost.'
                        ]
                    };

                // Analizadores
                case 'sin_transmision':
                    return {
                        title: 'Automated equipment transmission failure',
                        steps: [
                            'Confirm that the analytical equipment (e.g., Mindray, Sysmex) has data output enabled (host communication active).',
                            'Check the local laboratory Middleware PC and ensure that the connection software is turned on.',
                            'Go to "Analyzers" in the LIMS sidebar and check if the data entered with an orphan barcode. If so, manually associate the run barcode to the corresponding LIMS request ID.'
                        ]
                    };
                case 'id_incorrecto':
                    return {
                        title: 'Results imported under wrong ID',
                        steps: [
                            'If the operator entered the sample ID incorrectly in the physical console of the analyzer, results will transmit to a non-existent ID.',
                            '1. Go to "Analyzers" in the menu.',
                            '2. Locate the wrong transmission in the inbox.',
                            '3. Click the manual ID reassociation button, type the correct LIMS request ID, and apply the correction.'
                        ]
                    };
                case 'valores_fuera':
                    return {
                        title: 'Empty or strange analytical parameters',
                        steps: [
                            'Verify if the equipment requires reagent calibration.',
                            'If the analyzer sends empty fields, check if the clinical test in LIMS has the exact parameter codes configured in the Middleware (channel mapping).',
                            'If the test has complementary manual results, use the "Manual Entry" module in the request tab to fill in missing data.'
                        ]
                    };

                // QC
                case 'alerta_westgard':
                    return {
                        title: 'Corrective Action for Quality Control Deviation',
                        steps: [
                            'If a QC point exceeds 3 standard deviations (Rule 1_3s) or two consecutive points exceed 2 standard deviations (Rule 2_2s):',
                            '1. Do not validate or approve patient results for this analyte.',
                            '2. Prepare a new vial of control serum and rerun the test.',
                            '3. If the error persists, perform equipment maintenance, calibrate the reagent channel, and process again.',
                            '4. Once the control is within acceptance range (green), document the corrective action in the QC module to release the patient approval lock.'
                        ],
                        alert: 'Releasing results with quality controls out of range invalidates the laboratory\'s ISO 15189 accreditation.'
                    };
                case 'cambio_lote':
                    return {
                        title: 'Configuring New Target Values',
                        steps: [
                            'Before processing controls from a new manufacturer lot, enter the technical sheet values:',
                            '1. Go to the "Quality" module.',
                            '2. Select "Add New Control Lot".',
                            '3. Enter the theoretical Mean and Standard Deviation.',
                            '4. Change the status of the previous lot to "Inactive" to prevent confusion in historical charts.'
                        ]
                    };

                // Reportes
                case 'pdf_bloqueado':
                    return {
                        title: 'Result Reports Release',
                        steps: [
                            'Patients and companies cannot download PDF files that are in partial or review states.',
                            '1. Check the corresponding request under "Requests".',
                            '2. Verify that all requested tests have results and have been signed.',
                            '3. Digitally sign and mark the report as "Approved". This will immediately release the PDF for direct download from the external portal.'
                        ]
                    };
                case 'modificar_firmado':
                    return {
                        title: 'Modification of Approved Reports',
                        steps: [
                            'For ISO traceability, an approved and digitally signed report cannot be edited directly.',
                            '1. The responsible microbiologist must change the request status to "Under Amendment".',
                            '2. An automatic audit log is generated requiring justification for the change.',
                            '3. Modify the clinical results and sign again. The final PDF report will now include a legal legend "Rectified Report / Amendment of report MC-XXXX" complying with international standards.'
                        ]
                    };

                default:
                    return null;
            }
        }
    };

    const activeSolution = getTroubleshootingSolution();

    const checklistItems = lang === 'es' ? [
        {
            title: 'Inicio de Turno (Apertura)',
            desc: 'Verificar reactivos, encender analizadores y correr muestras control de calidad (QC) de nivel 1 y 2.'
        },
        {
            title: 'Validación de Datos Middleware',
            desc: 'Importar resultados de equipos, corroborar alertas de rango y contrastar contra el historial clínico.'
        },
        {
            title: 'Control de Cadena de Custodia',
            desc: 'Garantizar que todas las muestras enviadas a desecho biológico o congelación tengan registradas sus firmas con PIN.'
        },
        {
            title: 'Cierre y Respaldo (Salida)',
            desc: 'Apagar o dejar en stand-by los analizadores, archivar logs del día y generar respaldo en la nube.'
        }
    ] : [
        {
            title: 'Start of Shift (Opening)',
            desc: 'Verify reagents, turn on analyzers, and run level 1 and 2 quality control (QC) samples.'
        },
        {
            title: 'Middleware Data Validation',
            desc: 'Import equipment results, corroborate range alerts, and contrast against patient clinical history.'
        },
        {
            title: 'Chain of Custody Control',
            desc: 'Ensure all samples sent to biological waste or freezing have their PIN-signed transfers recorded.'
        },
        {
            title: 'Closing & Backup (Exit)',
            desc: 'Turn off or put analyzers on stand-by, archive day logs, and run cloud backup.'
        }
    ];

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header banner */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-600 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                    <HelpCircle size={150} />
                </div>
                
                {/* Premium Language Selector Toggle */}
                <div className="absolute top-4 right-4 z-20 flex bg-indigo-900/60 rounded-lg p-0.5 border border-indigo-500/30">
                    <button 
                        onClick={() => setLang('es')} 
                        className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all flex items-center gap-1 ${lang === 'es' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-200 hover:text-white'}`}
                    >
                        ESP 🇪🇸
                    </button>
                    <button 
                        onClick={() => setLang('en')} 
                        className={`px-2 py-1 rounded text-[10px] font-extrabold transition-all flex items-center gap-1 ${lang === 'en' ? 'bg-indigo-600 text-white shadow-sm' : 'text-indigo-200 hover:text-white'}`}
                    >
                        ENG 🇺🇸
                    </button>
                </div>

                <div className="relative z-10 max-w-3xl">
                    <span className="bg-indigo-500/50 text-indigo-100 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">{t.supportCenter}</span>
                    <h2 className="text-3xl font-extrabold mt-2 tracking-tight">{t.howHelp}</h2>
                    <p className="text-indigo-100 mt-2 text-sm md:text-base leading-relaxed">
                        {t.helpDesc}
                    </p>
                </div>
            </div>

            {/* Quick Stats / Shortcuts */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600"><PlusCircle size={22} /></div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.statAccessioning}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{t.statAccessioningDesc}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-green-50 text-green-600"><Users size={22} /></div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.statCustody}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{t.statCustodyDesc}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-50 text-blue-600"><Cpu size={22} /></div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.statAnalyzers}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{t.statAnalyzersDesc}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600"><Activity size={22} /></div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.statQc}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">{t.statQcDesc}</p>
                    </div>
                </div>
            </div>

            {/* main section: guides search & troubleshooting */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left col: FAQ & manuals */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                            <Microscope className="text-indigo-600" /> {t.titleManuals}
                        </h3>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text"
                                placeholder={t.searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                            />
                        </div>

                        {/* Category filter buttons */}
                        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100">
                            {[
                                { id: 'all', label: t.categories.all },
                                { id: 'accessioning', label: t.categories.accessioning },
                                { id: 'custody', label: t.categories.custody },
                                { id: 'equipment', label: t.categories.equipment },
                                { id: 'qc', label: t.categories.qc },
                                { id: 'reports', label: t.categories.reports }
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    {cat.label}
                                </button>
                            ))}
                        </div>

                        {/* Accordion List */}
                        <div className="space-y-3 pt-2">
                            {filteredGuides.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <HelpCircle className="mx-auto w-12 h-12 text-slate-300 mb-2" />
                                    <p className="text-sm font-medium">{t.searchNoResults}</p>
                                    <p className="text-xs text-slate-400 mt-1">{t.searchNoResultsDesc}</p>
                                </div>
                            ) : (
                                filteredGuides.map((guide, idx) => {
                                    const isCurrentlyOpen = openIndex === idx;
                                    return (
                                        <div key={guide.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-sm transition-all hover:border-slate-200">
                                            <button 
                                                onClick={() => toggleAccordion(idx)}
                                                className={`w-full flex justify-between items-center p-4 text-left font-bold text-slate-700 hover:bg-slate-50 transition-colors ${isCurrentlyOpen ? 'bg-slate-50 border-b border-slate-100' : 'bg-white'}`}
                                            >
                                                <span className="flex items-center gap-2.5 text-sm">
                                                    <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shrink-0">{guide.categoryName}</span>
                                                    {guide.title}
                                                </span>
                                                {isCurrentlyOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                            </button>
                                            {isCurrentlyOpen && (
                                                <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed whitespace-pre-line border-t border-slate-50">
                                                    {guide.content}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* Right col: Interactive troubleshooting & Checklists */}
                <div className="space-y-6">
                    {/* Interactive Troubleshooting Simulator */}
                    <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 shadow-lg p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Sparkles size={100} />
                        </div>
                        <h3 className="text-lg font-bold flex items-center gap-2 border-b border-slate-800 pb-3 relative z-10">
                            <Sparkles size={20} className="text-yellow-400 animate-pulse" /> {t.titleTroubleshooting}
                        </h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                            {t.troubleDesc}
                        </p>

                        <div className="space-y-4 mt-6 relative z-10">
                            {/* Problem Area Selector */}
                            <div>
                                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.selectAreaLabel}</label>
                                <select 
                                    value={problemArea}
                                    onChange={(e) => {
                                        setProblemArea(e.target.value);
                                        setSpecificProblem('');
                                    }}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">{t.selectAreaPlaceholder}</option>
                                    <option value="ingreso">{lang === 'es' ? 'Ingreso de Muestras' : 'Sample Accessioning'}</option>
                                    <option value="custodia">{lang === 'es' ? 'Cadena de Custodia' : 'Chain of Custody'}</option>
                                    <option value="analizadores">{lang === 'es' ? 'Conexión de Analizadores' : 'Analyzer Connection'}</option>
                                    <option value="qc">{lang === 'es' ? 'Control de Calidad (QC)' : 'Quality Control (QC)'}</option>
                                    <option value="reportes">{lang === 'es' ? 'Validación e Informes' : 'Validation & Reports'}</option>
                                </select>
                            </div>

                            {/* Specific Problem Selector */}
                            {problemArea && (
                                <div className="animate-fade-in">
                                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{t.selectProblemLabel}</label>
                                    <select 
                                        value={specificProblem}
                                        onChange={(e) => setSpecificProblem(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">{t.selectProblemPlaceholder}</option>
                                        {specificProblemsMap[problemArea]?.map(prob => (
                                            <option key={prob.value} value={prob.value}>{prob.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Interactive Solution Box */}
                        {activeSolution && (
                            <div className="mt-6 bg-slate-800/80 rounded-xl p-4 border border-indigo-500/30 animate-fade-in text-xs space-y-3">
                                <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                                    <CheckCircle2 size={14} /> {t.solutionRecommended}
                                </h4>
                                <p className="font-medium text-slate-200 border-b border-slate-700/50 pb-2">{activeSolution.title}</p>
                                <ul className="space-y-2 text-slate-300 list-decimal pl-4 leading-relaxed">
                                    {activeSolution.steps.map((step, idx) => (
                                        <li key={idx}>{step}</li>
                                    ))}
                                </ul>
                                {activeSolution.alert && (
                                    <div className="mt-2 flex gap-2 items-start bg-red-950/50 border border-red-500/20 text-red-300 p-2.5 rounded-lg text-[10px]">
                                        <AlertTriangle size={14} className="shrink-0 text-red-400 mt-0.5" />
                                        <p>{activeSolution.alert}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Operational Checklists */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                            <Info size={16} className="text-indigo-600" /> {t.checklistTitle}
                        </h3>
                        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                            {checklistItems.map((item, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <input type="checkbox" className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" defaultChecked={idx === 0} />
                                    <div>
                                        <p className="font-bold text-slate-700">{item.title}</p>
                                        <p className="text-[10px] text-slate-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Operational Contacts */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-xs text-slate-600 space-y-2">
                        <p className="font-bold text-slate-800">{t.contactTitle}</p>
                        <p>{t.contactDesc}</p>
                        <p className="font-bold text-indigo-600 mt-2">{t.contactSupport}</p>
                        <p>{t.contactPhone}</p>
                        <p>{t.contactEmail}</p>
                    </div>
                </div>

            </div>
        </div>
    );
};
