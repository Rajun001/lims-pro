import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowLeft, PlusCircle, FileText, Trash2, CheckCircle, Sparkles, Search, Copy, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logAuditAction } from '../utils/audit';
import { lookupCivilRegistry } from '../utils/civilRegistry';
import { LIMSSystemId } from '../services/firebase';
import { extractOrderFromDocument } from '../services/aiService';

import cmqccrCatalog from '../data/cmqccr_catalog.json';

const BASE_ANALYSIS_CODES = [
    { code: 'RTA', name: 'Recuento Total Aeróbico' },
    { code: 'CT', name: 'Coliformes Totales' },
    { code: 'CF', name: 'Coliformes Fecales' },
    { code: 'EC', name: 'Escherichia coli' },
    { code: 'STA', name: 'Staphylococcus aureus' },
    { code: 'HL', name: 'Hongos y levaduras' },
    { code: 'SAL', name: 'Salmonella sp' },
    { code: 'LIS', name: 'Listeria sp' },
    { code: 'LMO', name: 'Listeria monocytogenes' },
    { code: 'EO', name: 'Escherichia coli O157' },
    { code: 'BC', name: 'Bacillus cereus' },
    { code: 'CP', name: 'Clostridium perfringens' },
    { code: 'CSR', name: 'Clostridium Sulfitos Reductores' },
    { code: 'CB', name: 'Clostridium botulinum' },
    { code: 'BAL', name: 'Bacterias Acido Lácticas' },
    { code: 'ENT', name: 'Enterobacterias' },
    { code: 'VI', name: 'Vibrio sp' },
    { code: 'CA', name: 'Campylobacter sp' },
    { code: 'CE', name: 'Confirmación de esterilidad' },
    { code: 'IB', name: 'Indicador Biológico' },
    { code: 'HIS', name: 'Histaminas' },
    { code: 'PSC', name: 'Psicrófilos' },
    { code: 'EMT', name: 'Esporulados Mesófilos Totales' },
    { code: 'ETT', name: 'Esporulados Termófilos Totales' },
    { code: 'VC', name: 'Vibrio cholerae' },
    { code: 'PS', name: 'Pseudomonas sp' },
    { code: 'PA', name: 'Pseudomonas aeroginosa' },
    { code: 'EN', name: 'Enterococcos' },
    { code: 'LE', name: 'Legionella sp' },
    { code: 'IB2', name: 'Identificación de bacterias' },
    { code: 'IH', name: 'Identificación de Hongos' },
    { code: 'TG', name: 'Tinción de Gram' },
    { code: 'EMA', name: 'Esporulados Mesófilos Aeróbicos' },
    { code: 'EMANA', name: 'Esporulados Mesófilos Anaeróbicos' },
    { code: 'ETA', name: 'Esporulados Termófilos Aeróbicos' },
    { code: 'ETANA', name: 'Esporulados Termófilos Anaeróbico' },
    { code: 'HTR', name: 'Hongos Termoresistentes' },
    { code: 'VU', name: 'Vida Útil' },
    { code: 'SET', name: 'Enterotoxina Staphylococcus SET' },
    { code: 'LEV', name: 'Levaduras' },
    { code: 'HM', name: 'Hongos miceliales' },
    { code: 'ME', name: 'Cuerpo o material extraño' },
    { code: 'IDI', name: 'Identificación de insectos' },
    { code: 'AFL', name: 'Aflatoxinas' },
    { code: 'CR', name: 'Cronobacter' },
    { code: 'TER', name: 'Termófilos' },
    { code: 'EMTR', name: 'Esporulados Mesófilos Termoresistentes' },
    { code: 'ETTR', name: 'Esporulados Termófilos Termoresistentes' }
];

const INDUSTRIAL_ANALYSIS_CODES = [
    { code: 'RTA', name: 'Recuento Total Aeróbico', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CT', name: 'Coliformes Totales', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CF', name: 'Coliformes Fecales', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EC', name: 'Escherichia coli', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'STA', name: 'Staphylococcus aureus', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'HL', name: 'Hongos y levaduras', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'SAL', name: 'Salmonella sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'LIS', name: 'Listeria sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'LMO', name: 'Listeria monocytogenes', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EO', name: 'Escherichia coli O157', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'BC', name: 'Bacillus cereus', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CP', name: 'Clostridium perfringens', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CSR', name: 'Clostridium Sulfitos Reductores', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CB', name: 'Clostridium botulinum', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'BAL', name: 'Bacterias Acido Lácticas', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ENT', name: 'Enterobacterias', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'VI', name: 'Vibrio sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CA', name: 'Campylobacter sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CE', name: 'Confirmación de esterilidad', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'IB', name: 'Indicador Biológico', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'HIS', name: 'Histaminas', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'PSC', name: 'Psicrófilos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EMT', name: 'Esporulados Mesófilos Totales', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ETT', name: 'Esporulados Termófilos Totales', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'VC', name: 'Vibrio cholerae', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'PS', name: 'Pseudomonas sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'PA', name: 'Pseudomonas aeroginosa', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EN', name: 'Enterococcos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'LE', name: 'Legionella sp', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'IB2', name: 'Identificación de bacterias', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'IH', name: 'Identificación de Hongos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'TG', name: 'Tinción de Gram', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EMA', name: 'Esporulados Mesófilos Aeróbicos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EMANA', name: 'Esporulados Mesófilos Anaeróbicos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ETA', name: 'Esporulados Termófilos Aeróbicos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ETANA', name: 'Esporulados Termófilos Anaeróbico', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'HTR', name: 'Hongos Termoresistentes', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'VU', name: 'Vida Útil', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'SET', name: 'Enterotoxina Staphylococcus SET', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'LEV', name: 'Levaduras', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'HM', name: 'Hongos miceliales', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ME', name: 'Cuerpo o material extraño', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'IDI', name: 'Identificación de insectos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'AFL', name: 'Aflatoxinas', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'CR', name: 'Cronobacter', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'TER', name: 'Termófilos', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'EMTR', name: 'Esporulados Mesófilos Termoresistentes', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'ETTR', name: 'Esporulados Termófilos Termoresistentes', category: 'Microbiología (Alimentos y Aguas)' },
    { code: 'FQ-PH', name: 'pH y Acidez Titulable', category: 'Físico-Químico (Aguas y Alimentos)' },
    { code: 'FQ-TURB', name: 'Turbidez', category: 'Físico-Químico (Aguas y Alimentos)' },
    { code: 'FQ-CL', name: 'Cloro Libre Residual', category: 'Físico-Químico (Aguas y Alimentos)' },
    { code: 'FQ-DBO', name: 'Demanda Bioquímica de Oxígeno (DBO5)', category: 'Físico-Químico (Aguas y Alimentos)' },
    { code: 'FQ-DQO', name: 'Demanda Química de Oxígeno (DQO)', category: 'Físico-Químico (Aguas y Alimentos)' },
    { code: 'CUSTOM', name: 'Otro Análisis Industrial', category: 'Otros Análisis' }
];

const CLINICAL_ANALYSIS_CODES = [
    ...cmqccrCatalog.map(item => ({
        code: item.code,
        name: item.name,
        isClinical: true,
        category: item.category || 'Química Clínica'
    })),
    { code: 'CUSTOM', name: 'Otro Análisis Clínico', category: 'Otros Análisis' }
];

const CLINICAL_SAMPLE_TYPES = [
    'Sangre Total (EDTA)',
    'Suero Sanguíneo',
    'Plasma Sanguíneo (Heparina / Citrato)',
    'Orina (Examen General / Sedimento)',
    'Orina (24 Horas)',
    'Heces / Materia Fecal',
    'Exudado Faríngeo / Hisopado Nasal',
    'Exudado Vaginal / Cervical',
    'Exudado Uretral',
    'Secreción / Absceso / Herida',
    'Esputo / Lavado Bronquial',
    'Líquido Cefalorraquídeo (LCR)',
    'Líquido Sinovial / Pleural / Ascítico',
    'Biopsia / Tejido',
    'Raspado de Uña / Piel / Pelo',
    'Muestra Biológica (Otro)'
];

const INDUSTRIAL_SAMPLE_TYPES = [
    'Alimento Procesado / Producto Terminado',
    'Lácteos y Derivados',
    'Cárnicos y Embutidos',
    'Agua Potable / Consumo Humano',
    'Agua Residual / Tratada',
    'Hielo para Consumo',
    'Materia Prima / Ingredientes',
    'Superficie Viva (Manipulador - Manos/Uñas)',
    'Superficie Inerte (Mesas / Equipos / Utensilios)',
    'Ambiente / Aire (Impactación)',
    'Ambiente / Aire (Sedimentación)',
    'Cosméticos y Farmacéuticos',
    'Muestra Industrial (Otro)'
];

const CLINICAL_METHOD_CODES = [
    { code: 'CM1', name: 'Analizador Automatizado (Química / Hematología)', category: '🏥 Métodos Clínicos' },
    { code: 'CM2', name: 'Microscopía Óptica / Tinción Directa (Gram, Sedimento)', category: '🏥 Métodos Clínicos' },
    { code: 'CM3', name: 'Cultivo Microbiológico & Antibiograma (Sensidiscos / CMI)', category: '🏥 Métodos Clínicos' },
    { code: 'CM4', name: 'Inmunoensayo / ELISA / Quimioluminiscencia', category: '🏥 Métodos Clínicos' },
    { code: 'CM5', name: 'Prueba Rápida / Inmunocromatografía', category: '🏥 Métodos Clínicos' },
    { code: 'CM6', name: 'Biología Molecular / PCR Tiempo Real', category: '🏥 Métodos Clínicos' },
    { code: 'CM7', name: 'Aglutinación en Látex / Turbidimetría', category: '🏥 Métodos Clínicos' },
    { code: 'CM8', name: 'Método Manual / Químico Húmedo', category: '🏥 Métodos Clínicos' },
    { code: 'CM9', name: 'Otro Método Clínico', category: '🏥 Métodos Clínicos' }
];

const INDUSTRIAL_METHOD_CODES = [
    { code: 'M4', name: 'Filtración por Membrana (MF) — Agua Potable / Baja Turbidez', category: '💧 Aguas e Hielo' },
    { code: 'M3', name: 'NMP (Tubos Múltiples) — Aguas Residuales / Crudas', category: '💧 Aguas e Hielo' },
    { code: 'M8', name: 'Colilert / Quanti-Tray (Sustrato Cromogénico)', category: '💧 Aguas e Hielo' },
    { code: 'M15', name: 'Presencia / Ausencia en 100 mL (P/A)', category: '💧 Aguas e Hielo' },
    { code: 'M16', name: 'Heterótrofos / Mesófilos en Placa (UFC/mL)', category: '💧 Aguas e Hielo' },
    { code: 'M1', name: 'Recuento en Placa Profundidad (UFC/g o mL)', category: '🥩 Alimentos y Bebidas' },
    { code: 'M2', name: 'Siembra en Espiral IUL Eddy Jet (UFC/g)', category: '🥩 Alimentos y Bebidas' },
    { code: 'M10', name: 'Placa Petrifilm Neogen/3M (UFC/g)', category: '🥩 Alimentos y Bebidas' },
    { code: 'M11', name: 'Petrifilm Express 24 hrs', category: '🥩 Alimentos y Bebidas' },
    { code: 'M17', name: 'NMP en Alimentos (NMP/g)', category: '🥩 Alimentos y Bebidas' },
    { code: 'M18', name: 'Enriquecimiento Selectivo P/A en 25g (Salmonella/Listeria)', category: '🥩 Alimentos y Bebidas' },
    { code: 'M19', name: 'Hisopado de Superficies / Placa RODAC (UFC/cm²)', category: '🧼 Superficies y Ambiente' },
    { code: 'M13', name: 'Impactación Ambiental — Muestreador de Aire CAMTU (UFC/m³)', category: '🧼 Superficies y Ambiente' },
    { code: 'M14', name: 'Sedimentación Pasiva en Placa (UFC/placa)', category: '🧼 Superficies y Ambiente' },
    { code: 'M5', name: 'ELISA / Inmunoensayo', category: '🔬 Métodos Moleculares y FQ' },
    { code: 'M6', name: 'PCR Tiempo Real (48 hrs)', category: '🔬 Métodos Moleculares y FQ' },
    { code: 'M7', name: 'PCR Tiempo Real Rápido (24 hrs)', category: '🔬 Métodos Moleculares y FQ' },
    { code: 'M9', name: 'Método Enzimático / Colorimétrico', category: '🔬 Métodos Moleculares y FQ' },
    { code: 'M12', name: 'Identificación Bioquímica API / Galerías', category: '🔬 Métodos Moleculares y FQ' },
    { code: 'M20', name: 'Potenciometría / Turbidimetría / Titulación DBO-DQO', category: '🔬 Métodos Moleculares y FQ' },
    { code: 'A', name: 'Otro Método / Criterio Específico', category: '🔬 Métodos Moleculares y FQ' }
];

// ===== PANELES RÁPIDOS =====
const CLINICAL_PANELS = [
    {
        id: 'lipid',
        name: 'Perfil Lipídico',
        emoji: '🩸',
        color: 'rose',
        items: [
            { analysisCode: '1170', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1750', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1490', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1550', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
        ]
    },
    {
        id: 'hepatic',
        name: 'Perfil Hepático',
        emoji: '🫀',
        color: 'amber',
        items: [
            { analysisCode: '1720', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1730', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1370', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1430', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1100', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1680', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
        ]
    },
    {
        id: 'renal',
        name: 'Perfil Renal',
        emoji: '🧪',
        color: 'blue',
        items: [
            { analysisCode: '1230', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1610', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1030', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '7190', sample: 'Orina (Examen General / Sedimento)', methodCode: 'CM2' },
        ]
    },
    {
        id: 'hemogram',
        name: 'Hemograma Completo',
        emoji: '🔬',
        color: 'indigo',
        items: [
            { analysisCode: '6230', sample: 'Sangre Total (EDTA)', methodCode: 'CM1' },
            { analysisCode: '6040', sample: 'Sangre Total (EDTA)', methodCode: 'CM1' },
            { analysisCode: '6400', sample: 'Sangre Total (EDTA)', methodCode: 'CM1' },
        ]
    },
    {
        id: 'thyroid',
        name: 'Perfil Tiroideo',
        emoji: '🦋',
        color: 'purple',
        items: [
            { analysisCode: '2130', sample: 'Suero Sanguíneo', methodCode: 'CM4' },
            { analysisCode: '2250', sample: 'Suero Sanguíneo', methodCode: 'CM4' },
            { analysisCode: '2260', sample: 'Suero Sanguíneo', methodCode: 'CM4' },
        ]
    },
    {
        id: 'urocultivo',
        name: 'Urocultivo',
        emoji: '🦠',
        color: 'emerald',
        items: [
            { analysisCode: '7340', sample: 'Orina (Examen General / Sedimento)', methodCode: 'CM3' },
            { analysisCode: '7190', sample: 'Orina (Examen General / Sedimento)', methodCode: 'CM2' },
        ]
    },
    {
        id: 'diabetes',
        name: 'Control Diabético',
        emoji: '📊',
        color: 'orange',
        items: [
            { analysisCode: '1450', sample: 'Suero Sanguíneo', methodCode: 'CM1' },
            { analysisCode: '1500', sample: 'Sangre Total (EDTA)', methodCode: 'CM1' },
            { analysisCode: '2160', sample: 'Suero Sanguíneo', methodCode: 'CM4' },
        ]
    },
];

const INDUSTRIAL_PANELS = [
    {
        id: 'inocuidad',
        name: 'Inocuidad Básica',
        emoji: '🥩',
        color: 'rose',
        items: [
            { analysisCode: 'RTA', sample: '', methodCode: 'M1' },
            { analysisCode: 'CT', sample: '', methodCode: 'M1' },
            { analysisCode: 'CF', sample: '', methodCode: 'M1' },
            { analysisCode: 'STA', sample: '', methodCode: 'M1' },
            { analysisCode: 'SAL', sample: '', methodCode: 'M18' },
            { analysisCode: 'HL', sample: '', methodCode: 'M1' },
        ]
    },
    {
        id: 'agua_potable',
        name: 'Agua Potable RTCA',
        emoji: '💧',
        color: 'blue',
        items: [
            { analysisCode: 'RTA', sample: 'Agua Potable / Consumo Humano', methodCode: 'M16' },
            { analysisCode: 'CT', sample: 'Agua Potable / Consumo Humano', methodCode: 'M4' },
            { analysisCode: 'CF', sample: 'Agua Potable / Consumo Humano', methodCode: 'M4' },
        ]
    },
    {
        id: 'agua_residual',
        name: 'Agua Residual',
        emoji: '🌊',
        color: 'teal',
        items: [
            { analysisCode: 'RTA', sample: 'Agua Residual / Tratada', methodCode: 'M3' },
            { analysisCode: 'CT', sample: 'Agua Residual / Tratada', methodCode: 'M3' },
            { analysisCode: 'CF', sample: 'Agua Residual / Tratada', methodCode: 'M3' },
            { analysisCode: 'FQ-DBO', sample: 'Agua Residual / Tratada', methodCode: 'M20' },
            { analysisCode: 'FQ-DQO', sample: 'Agua Residual / Tratada', methodCode: 'M20' },
        ]
    },
    {
        id: 'hisopado',
        name: 'Hisopado Superficies',
        emoji: '🧼',
        color: 'emerald',
        items: [
            { analysisCode: 'RTA', sample: 'Superficie Inerte (Mesas / Equipos / Utensilios)', methodCode: 'M19' },
            { analysisCode: 'CT', sample: 'Superficie Inerte (Mesas / Equipos / Utensilios)', methodCode: 'M19' },
            { analysisCode: 'STA', sample: 'Superficie Inerte (Mesas / Equipos / Utensilios)', methodCode: 'M19' },
        ]
    },
    {
        id: 'ambiente',
        name: 'Monitoreo Ambiental',
        emoji: '🌬️',
        color: 'sky',
        items: [
            { analysisCode: 'RTA', sample: 'Ambiente / Aire (Impactación)', methodCode: 'M13' },
            { analysisCode: 'HL', sample: 'Ambiente / Aire (Impactación)', methodCode: 'M13' },
            { analysisCode: 'RTA', sample: 'Ambiente / Aire (Sedimentación)', methodCode: 'M14' },
        ]
    },
    {
        id: 'lacteos',
        name: 'Panel Lácteos',
        emoji: '🥛',
        color: 'yellow',
        items: [
            { analysisCode: 'RTA', sample: 'Lácteos y Derivados', methodCode: 'M1' },
            { analysisCode: 'CT', sample: 'Lácteos y Derivados', methodCode: 'M1' },
            { analysisCode: 'STA', sample: 'Lácteos y Derivados', methodCode: 'M1' },
            { analysisCode: 'HL', sample: 'Lácteos y Derivados', methodCode: 'M1' },
            { analysisCode: 'SAL', sample: 'Lácteos y Derivados', methodCode: 'M18' },
            { analysisCode: 'LIS', sample: 'Lácteos y Derivados', methodCode: 'M18' },
        ]
    },
];

// ===== COMPONENTE: COMBOBOX DE BÚSQUEDA DE ANÁLISIS =====
const AnalysisSearchCombo = ({ value, onChange, catalog, placeholder }) => {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const selectedItem = useMemo(() => catalog.find(c => c.code === value), [value, catalog]);

    const filtered = useMemo(() => {
        if (!query.trim()) return catalog.slice(0, 40);
        const q = query.toLowerCase();
        return catalog.filter(c =>
            c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        ).slice(0, 30);
    }, [query, catalog]);

    const grouped = useMemo(() => {
        return filtered.reduce((acc, item) => {
            const cat = item.category || 'General';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(item);
            return acc;
        }, {});
    }, [filtered]);

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleSelect = (code) => {
        onChange(code);
        setQuery('');
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <div
                onClick={() => setOpen(v => !v)}
                className="w-full px-2 py-1.5 border border-slate-300 rounded bg-white focus-within:ring-2 focus-within:ring-indigo-500 cursor-pointer flex items-center justify-between gap-1 min-h-[34px]"
            >
                {open ? (
                    <input
                        autoFocus
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        placeholder="Buscar análisis..."
                        className="flex-1 text-sm outline-none bg-transparent font-medium text-slate-800"
                    />
                ) : (
                    <span className="flex-1 text-sm font-bold text-slate-800 truncate">
                        {selectedItem ? `${selectedItem.code} — ${selectedItem.name}` : <span className="text-slate-400 font-normal">{placeholder}</span>}
                    </span>
                )}
                <Search size={13} className="text-slate-400 flex-shrink-0" />
            </div>

            {open && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-indigo-200 rounded-xl shadow-2xl max-h-64 overflow-y-auto animate-fade-in">
                    {Object.keys(grouped).length === 0 ? (
                        <div className="p-3 text-xs text-slate-400 text-center">Sin resultados para "{query}"</div>
                    ) : (
                        Object.entries(grouped).map(([cat, items]) => (
                            <div key={cat}>
                                <div className="px-3 py-1 text-[10px] font-extrabold text-indigo-700 uppercase bg-indigo-50 sticky top-0">{cat}</div>
                                {items.map(item => (
                                    <div
                                        key={item.code}
                                        onClick={() => handleSelect(item.code)}
                                        className={`px-3 py-2 text-xs cursor-pointer flex items-center gap-2 transition-colors border-b border-slate-50 last:border-0 ${item.code === value ? 'bg-indigo-50 text-indigo-800 font-bold' : 'hover:bg-slate-50 text-slate-700'}`}
                                    >
                                        <span className="font-bold text-indigo-600 w-14 flex-shrink-0">{item.code}</span>
                                        <span className="truncate">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

// ===== COMPONENTE: ACORDEÓN DE SECCIÓN =====
const AccordionSection = ({ title, icon, badge, open, onToggle, children, accentColor = 'indigo' }) => {
    const colors = {
        indigo: { header: 'bg-indigo-600', badge: 'bg-indigo-100 text-indigo-800', border: 'border-indigo-200' },
        blue: { header: 'bg-blue-600', badge: 'bg-blue-100 text-blue-800', border: 'border-blue-200' },
        emerald: { header: 'bg-emerald-600', badge: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200' },
        slate: { header: 'bg-slate-700', badge: 'bg-slate-100 text-slate-800', border: 'border-slate-200' },
    };
    const c = colors[accentColor] || colors.indigo;

    return (
        <div className={`rounded-2xl border ${c.border} overflow-hidden shadow-sm`}>
            <button
                type="button"
                onClick={onToggle}
                className={`w-full flex items-center justify-between px-5 py-3.5 ${c.header} text-white transition-opacity hover:opacity-90`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-lg">{icon}</span>
                    <span className="font-extrabold text-sm tracking-wide">{title}</span>
                    {badge && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{badge}</span>}
                </div>
                {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {open && (
                <div className="p-5 bg-white animate-fade-in space-y-4">
                    {children}
                </div>
            )}
        </div>
    );
};

// ===== COMPONENTE: SELECTOR DE PANELES RÁPIDOS =====
const PanelPicker = ({ formMode, onApplyPanel }) => {
    const panels = formMode === 'clinical' ? CLINICAL_PANELS : INDUSTRIAL_PANELS;
    const [applied, setApplied] = useState(null);

    const colorMap = {
        rose: 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100',
        amber: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
        blue: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100',
        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100',
        purple: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
        orange: 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100',
        teal: 'bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100',
        sky: 'bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100',
        yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100',
    };

    const handleApply = (panel) => {
        onApplyPanel(panel);
        setApplied(panel.id);
        setTimeout(() => setApplied(null), 2000);
    };

    return (
        <div className={`p-4 rounded-xl border ${formMode === 'clinical' ? 'bg-indigo-50/60 border-indigo-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
            <div className="flex items-center gap-2 mb-3">
                <Zap size={15} className={formMode === 'clinical' ? 'text-indigo-600' : 'text-emerald-600'} />
                <span className={`text-xs font-extrabold uppercase tracking-wider ${formMode === 'clinical' ? 'text-indigo-800' : 'text-emerald-800'}`}>
                    Paneles Rápidos — 1 clic para agregar múltiples análisis
                </span>
            </div>
            <div className="flex flex-wrap gap-2">
                {panels.map(panel => (
                    <button
                        key={panel.id}
                        type="button"
                        onClick={() => handleApply(panel)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border rounded-lg transition-all ${applied === panel.id ? 'bg-green-100 border-green-400 text-green-800 scale-95' : colorMap[panel.color] || colorMap.indigo}`}
                    >
                        <span>{panel.emoji}</span>
                        <span>{panel.name}</span>
                        {applied === panel.id && <span className="ml-1">✓</span>}
                        <span className="ml-1 opacity-60 text-[10px]">{panel.items.length} análisis</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export const RequestForm = ({ db, user, navigateTo, clients, requests, labInfo }) => {
    const location = useLocation();

    // Form Mode: 'clinical' | 'industrial'
    const [formMode, setFormMode] = useState(location.state?.mode || 'industrial');

    // Sedes y Sucursales
    const branchesList = useMemo(() => {
        return labInfo?.branches?.filter(b => b.active !== false) || [
            {
                id: 'suc-guadalupe',
                code: 'GUA-01',
                name: 'Sede Central Guadalupe',
                type: 'Sede Matriz & Laboratorio Central',
                address: '75 metros norte del correo de Guadalupe, Goicoechea, San José, Costa Rica',
                telephones: '+506 22348837, +506 22345862, +506 22246541',
                whatsapp: '71382750',
                email: 'laboratorio@microlabscr.com',
                emailReports: 'resultados@microlabscr.com',
                emailBilling: 'fe@microlabscr.com',
                website: 'www.microlabscr.com',
                directorName: 'Dr. Roldan Ajún Chaverri',
                directorCode: '802'
            }
        ];
    }, [labInfo]);

    const [selectedBranchId, setSelectedBranchId] = useState(() => {
        const mainB = branchesList.find(b => b.isMain) || branchesList[0];
        return mainB ? mainB.id : 'suc-guadalupe';
    });

    const [clientName, setClientName] = useState('');
    const [selectedClientId, setSelectedClientId] = useState('');
    const [searchClientQuery, setSearchClientQuery] = useState('');
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 16));
    const [deliveryMethod, setDeliveryMethod] = useState('Email');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // CRM Contact State
    const [_selectedContact, _setSelectedContact] = useState(null);
    const [newClientEmail, setNewClientEmail] = useState('');

    // AI State
    const [isExtracting, setIsExtracting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('LIMS_GEMINI_API_KEY') || import.meta.env.VITE_GEMINI_API_KEY || '');

    // Accordion state — clinical: 3 sections, industrial: 2 sections
    const [accordionState, setAccordionState] = useState({ identity: true, contact: false, samples: false });
    const toggleAccordion = (key) => setAccordionState(prev => ({ ...prev, [key]: !prev[key] }));
    const openNextAccordion = (nextKey) => setAccordionState(prev => ({ ...prev, [nextKey]: true }));

    // --- CAMPOS CLÍNICOS ESTRUCTURADOS (PACIENTE) ---
    const [patientDNI, setPatientDNI] = useState('');
    const [isSearchingRegistry, setIsSearchingRegistry] = useState(false);
    const [patientFirstName, setPatientFirstName] = useState('');
    const [patientSecondName, setPatientSecondName] = useState('');
    const [patientFirstLastName, setPatientFirstLastName] = useState('');
    const [patientSecondLastName, setPatientSecondLastName] = useState('');
    const [patientName, setPatientName] = useState('');
    const [patientDOB, setPatientDOB] = useState('');
    const [patientGender, setPatientGender] = useState('Masculino');
    const [patientAddress, setPatientAddress] = useState('');

    const [patientPhoneMobile, setPatientPhoneMobile] = useState('');
    const [patientPhoneLandline, setPatientPhoneLandline] = useState('');
    const [patientPhoneEmergency, setPatientPhoneEmergency] = useState('');

    const [patientEmailResults, setPatientEmailResults] = useState('');
    const [patientEmailBilling, setPatientEmailBilling] = useState('');

    const [requesterName, setRequesterName] = useState('');
    const [doctorSpecialty, setDoctorSpecialty] = useState('');
    const [doctorEmail, setDoctorEmail] = useState('');
    const [doctorPhone, setDoctorPhone] = useState('');

    const [collectionDate, setCollectionDate] = useState('');
    const [collectionLocation, setCollectionLocation] = useState('');
    const [clinicalInfo, setClinicalInfo] = useState('');

    // --- CAMPOS INDUSTRIALES ESTRUCTURADOS ---
    const [companyLegalName, setCompanyLegalName] = useState('');
    const [companyCommercialName, setCompanyCommercialName] = useState('');
    const [companyTaxId, setCompanyTaxId] = useState('');
    const [receptionTemp, setReceptionTemp] = useState('');
    const [samplerName, setSamplerName] = useState('');

    const [qualityContactFirstName, setQualityContactFirstName] = useState('');
    const [qualityContactSecondName, _setQualityContactSecondName] = useState('');
    const [qualityContactFirstLastName, setQualityContactFirstLastName] = useState('');
    const [qualityContactSecondLastName, _setQualityContactSecondLastName] = useState('');
    const [qualityContactRole, setQualityContactRole] = useState('Jefe de Calidad e Inocuidad');
    const [qualityContactEmail, setQualityContactEmail] = useState('');
    const [qualityContactPhoneMobile, setQualityContactPhoneMobile] = useState('');
    const [qualityContactPhoneOffice, setQualityContactPhoneOffice] = useState('');

    const [accountingContactName, setAccountingContactName] = useState('');
    const [accountingContactEmail, setAccountingContactEmail] = useState('');
    const [accountingContactPhone, setAccountingContactPhone] = useState('');

    const [procurementContactEmail, setProcurementContactEmail] = useState('');

    // --- REFERIDOS ---
    const [_isReferredInbound, _setIsReferredInbound] = useState(location.state?.mode === 'referral');
    const [_referringLabName, _setReferringLabName] = useState(location.state?.referringLabName || '');
    const [_referringLabCode, _setReferringLabCode] = useState('');
    const [_referringLabOrderId, _setReferringLabOrderId] = useState('');
    const [_referringMicrobiologist, _setReferringMicrobiologist] = useState('');
    const [_referringLabEmail, _setReferringLabEmail] = useState('');
    const [_referringLabPhone, _setReferringLabPhone] = useState('');
    const [_referralColdChainCondition, _setReferralColdChainCondition] = useState('Refrigerada (2°C - 8°C)');
    const [_referralAcceptanceStatus, _setReferralAcceptanceStatus] = useState('Aceptada Conforme');
    const [_referralMatrixCategory, _setReferralMatrixCategory] = useState('clinical');

    // --- MEMORIA Y AUTOCOMPLETADO ---
    const [autoFilledInfo, setAutoFilledInfo] = useState(null);
    const [dniSuggestions, setDniSuggestions] = useState([]);
    const [nameSuggestions, setNameSuggestions] = useState([]);
    const [companySuggestions, setCompanySuggestions] = useState([]);
    const [doctorSuggestions, setDoctorSuggestions] = useState([]);

    const memoryBank = useMemo(() => {
        const list = [];
        const seenKeys = new Set();
        (clients || []).forEach(c => {
            if (!c.name) return;
            const isClin = c.type?.includes('Paciente') || c.type?.includes('Clínic') || c.type === 'paciente';
            const item = {
                id: c.id, source: 'CRM Registrado', type: isClin ? 'clinical' : 'industrial',
                name: c.name, document: c.document || '', firstName: c.firstName || '',
                secondName: c.secondName || '', firstLastName: c.firstLastName || '', secondLastName: c.secondLastName || '',
                birthDate: c.birthDate || '', gender: c.gender || 'Masculino', address: c.address || '',
                phoneMobile: c.contacts?.find(ct => ct.role?.includes('Resultados') || ct.phone)?.phone || c.phone || '',
                phoneLandline: c.contacts?.find(ct => ct.phoneLandline)?.phoneLandline || '',
                phoneEmergency: c.contacts?.find(ct => ct.phoneEmergency)?.phoneEmergency || '',
                emailResults: c.contacts?.find(ct => ct.role?.includes('Resultados') || ct.department === 'Paciente')?.email || c.email || '',
                emailBilling: c.contacts?.find(ct => ct.role?.includes('Facturación') || ct.department === 'Contabilidad')?.email || '',
                requesterName: c.contacts?.find(ct => ct.role?.includes('Médico'))?.name || '',
                doctorSpecialty: c.contacts?.find(ct => ct.role?.includes('Médico'))?.department || '',
                doctorEmail: c.contacts?.find(ct => ct.role?.includes('Médico'))?.email || '',
                doctorPhone: c.contacts?.find(ct => ct.role?.includes('Médico'))?.phone || '',
                companyLegalName: c.name, companyCommercialName: c.commercialName || '', companyTaxId: c.document || '',
                qualityContactFirstName: c.contacts?.find(ct => ct.role?.includes('Calidad'))?.name || '',
                qualityContactRole: c.contacts?.find(ct => ct.role?.includes('Calidad'))?.department || 'Aseguramiento de Calidad',
                qualityContactEmail: c.contacts?.find(ct => ct.role?.includes('Calidad'))?.email || c.email || '',
                qualityContactPhoneMobile: c.contacts?.find(ct => ct.role?.includes('Calidad'))?.phone || '',
                qualityContactPhoneOffice: c.contacts?.find(ct => ct.role?.includes('Calidad'))?.phoneOffice || '',
                accountingContactName: c.contacts?.find(ct => ct.role?.includes('Facturación'))?.name || '',
                accountingContactEmail: c.contacts?.find(ct => ct.role?.includes('Facturación'))?.email || '',
                accountingContactPhone: c.contacts?.find(ct => ct.role?.includes('Facturación'))?.phone || '',
                procurementContactEmail: c.contacts?.find(ct => ct.role?.includes('Compras'))?.email || '',
                lastDate: c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleDateString() : 'Directorio'
            };
            const key = `${item.type}-${(item.name || '').toLowerCase()}-${item.document}`;
            if (!seenKeys.has(key)) { seenKeys.add(key); list.push(item); }
        });
        (requests || []).forEach(r => {
            const clientN = r.clientName || r.patientName || r.companyLegalName;
            if (!clientN) return;
            const isClin = r.clientType === 'Clínica' || r.patientName || r.patientDNI;
            const item = {
                id: r.id, source: 'Historial de Órdenes', type: isClin ? 'clinical' : 'industrial',
                name: clientN, document: r.patientDNI || r.companyTaxId || '',
                firstName: r.patientFirstName || '', secondName: r.patientSecondName || '',
                firstLastName: r.patientFirstLastName || '', secondLastName: r.patientSecondLastName || '',
                birthDate: r.patientDOB || '', gender: r.patientGender || 'Masculino', address: r.patientAddress || '',
                phoneMobile: r.patientPhoneMobile || r.patientPhone || '', phoneLandline: r.patientPhoneLandline || '',
                phoneEmergency: r.patientPhoneEmergency || '', emailResults: r.patientEmailResults || r.email || '',
                emailBilling: r.patientEmailBilling || '', requesterName: r.requesterName || '',
                doctorSpecialty: r.doctorSpecialty || '', doctorEmail: r.doctorEmail || '', doctorPhone: r.doctorPhone || '',
                companyLegalName: r.companyLegalName || clientN, companyCommercialName: r.companyCommercialName || '',
                companyTaxId: r.companyTaxId || '',
                qualityContactFirstName: r.qualityContactFirstName || r.qualityContactName || '',
                qualityContactRole: r.qualityContactRole || '',
                qualityContactEmail: r.qualityContactEmail || r.email || '',
                qualityContactPhoneMobile: r.qualityContactPhoneMobile || r.qualityContactPhone || '',
                qualityContactPhoneOffice: r.qualityContactPhoneOffice || '',
                accountingContactName: r.accountingContactName || '', accountingContactEmail: r.accountingContactEmail || '',
                accountingContactPhone: r.accountingContactPhone || '', procurementContactEmail: r.procurementContactEmail || '',
                lastDate: r.requestDate ? new Date(r.requestDate).toLocaleDateString() : 'Orden Previa'
            };
            const key = `${item.type}-${(item.name || '').toLowerCase()}-${item.document}`;
            if (!seenKeys.has(key)) { seenKeys.add(key); list.push(item); }
        });
        return list;
    }, [clients, requests]);

    const doctorMemoryList = useMemo(() => {
        const docMap = new Map();
        memoryBank.forEach(m => {
            if (m.requesterName && m.requesterName.trim().length > 2) {
                const key = m.requesterName.toLowerCase().trim();
                if (!docMap.has(key)) docMap.set(key, { name: m.requesterName, specialty: m.doctorSpecialty || '', email: m.doctorEmail || '', phone: m.doctorPhone || '' });
            }
        });
        return Array.from(docMap.values());
    }, [memoryBank]);

    const applyMemoryProfile = (profile) => {
        if (!profile) return;
        if (profile.type === 'clinical' || formMode === 'clinical') {
            let fn = profile.firstName, sn = profile.secondName, fln = profile.firstLastName, sln = profile.secondLastName;
            if (!fn && profile.name) {
                const parts = profile.name.trim().split(' ');
                fn = parts[0] || '';
                if (parts.length === 2) { fln = parts[1] || ''; }
                else if (parts.length === 3) { fln = parts[1] || ''; sln = parts[2] || ''; }
                else if (parts.length >= 4) { sn = parts[1] || ''; fln = parts[2] || ''; sln = parts.slice(3).join(' ') || ''; }
            }
            setPatientFirstName(fn || ''); setPatientSecondName(sn || '');
            setPatientFirstLastName(fln || ''); setPatientSecondLastName(sln || '');
            setPatientName(profile.name); setPatientDNI(profile.document || '');
            setPatientDOB(profile.birthDate || ''); setPatientGender(profile.gender || 'Masculino');
            setPatientAddress(profile.address || '');
            setPatientPhoneMobile(profile.phoneMobile || ''); setPatientPhoneLandline(profile.phoneLandline || '');
            setPatientPhoneEmergency(profile.phoneEmergency || '');
            setPatientEmailResults(profile.emailResults || ''); setPatientEmailBilling(profile.emailBilling || '');
            if (profile.requesterName) setRequesterName(profile.requesterName);
            if (profile.doctorSpecialty) setDoctorSpecialty(profile.doctorSpecialty);
            if (profile.doctorEmail) setDoctorEmail(profile.doctorEmail);
            if (profile.doctorPhone) setDoctorPhone(profile.doctorPhone);
            setClientName(profile.name); setSearchClientQuery(profile.name); setSelectedClientId(profile.id || '');
            // Auto-advance accordion
            setAccordionState({ identity: false, contact: true, samples: false });
        } else {
            setCompanyLegalName(profile.companyLegalName || profile.name);
            setCompanyCommercialName(profile.companyCommercialName || '');
            setCompanyTaxId(profile.companyTaxId || profile.document || '');
            setQualityContactFirstName(profile.qualityContactFirstName || '');
            setQualityContactRole(profile.qualityContactRole || 'Jefe de Calidad');
            setQualityContactEmail(profile.qualityContactEmail || '');
            setQualityContactPhoneMobile(profile.qualityContactPhoneMobile || '');
            setQualityContactPhoneOffice(profile.qualityContactPhoneOffice || '');
            setAccountingContactName(profile.accountingContactName || '');
            setAccountingContactEmail(profile.accountingContactEmail || '');
            setAccountingContactPhone(profile.accountingContactPhone || '');
            setProcurementContactEmail(profile.procurementContactEmail || '');
            setClientName(profile.companyLegalName || profile.name);
            setSearchClientQuery(profile.companyLegalName || profile.name);
            setSelectedClientId(profile.id || '');
            setAccordionState({ identity: false, contact: false, samples: true });
        }
        setAutoFilledInfo({ name: profile.name, source: profile.source || 'Historial LIMS', date: profile.lastDate || 'Previo' });
        setDniSuggestions([]); setNameSuggestions([]); setCompanySuggestions([]);
    };

    const applyDoctorProfile = (doc) => {
        if (!doc) return;
        setRequesterName(doc.name);
        if (doc.specialty) setDoctorSpecialty(doc.specialty);
        if (doc.email) setDoctorEmail(doc.email);
        if (doc.phone) setDoctorPhone(doc.phone);
        setDoctorSuggestions([]);
    };

    const handleDniInputChange = (val) => {
        setPatientDNI(val);
        const query = val.replace(/\D/g, '');
        if (query.length >= 3) {
            const matches = memoryBank.filter(m => m.type === 'clinical' && (m.document || '').replace(/\D/g, '').includes(query));
            setDniSuggestions(matches.slice(0, 4));
        } else { setDniSuggestions([]); }
    };

    const handlePatientNameInputChange = (field, val) => {
        let fn = field === 'fn' ? val : patientFirstName;
        let sn = field === 'sn' ? val : patientSecondName;
        let fln = field === 'fln' ? val : patientFirstLastName;
        let sln = field === 'sln' ? val : patientSecondLastName;
        if (field === 'fn') setPatientFirstName(val);
        if (field === 'sn') setPatientSecondName(val);
        if (field === 'fln') setPatientFirstLastName(val);
        if (field === 'sln') setPatientSecondLastName(val);
        const fullName = [fn, sn, fln, sln].filter(Boolean).join(' ');
        setPatientName(fullName);
        if (formMode === 'clinical') { setClientName(fullName); setSearchClientQuery(fullName); }
        const searchTerms = val.toLowerCase().trim();
        if (searchTerms.length >= 2) {
            const matches = memoryBank.filter(m =>
                m.type === 'clinical' &&
                (m.name.toLowerCase().includes(searchTerms) || (m.firstName && m.firstName.toLowerCase().includes(searchTerms)) || (m.firstLastName && m.firstLastName.toLowerCase().includes(searchTerms)))
            );
            setNameSuggestions(matches.slice(0, 5));
        } else { setNameSuggestions([]); }
    };

    const handleCompanyInputChange = (field, val) => {
        if (field === 'legal') {
            setCompanyLegalName(val);
            if (formMode === 'industrial') { setClientName(val); setSearchClientQuery(val); }
            if (val.trim().length >= 2) {
                const matches = memoryBank.filter(m => m.type === 'industrial' && (m.name.toLowerCase().includes(val.toLowerCase()) || (m.companyTaxId && m.companyTaxId.includes(val))));
                setCompanySuggestions(matches.slice(0, 5));
            } else { setCompanySuggestions([]); }
        }
        if (field === 'commercial') setCompanyCommercialName(val);
        if (field === 'taxId') {
            setCompanyTaxId(val);
            if (val.trim().length >= 3) {
                const matches = memoryBank.filter(m => m.type === 'industrial' && (m.companyTaxId && m.companyTaxId.includes(val)));
                setCompanySuggestions(matches.slice(0, 5));
            } else { setCompanySuggestions([]); }
        }
    };

    const handleDoctorInputChange = (val) => {
        setRequesterName(val);
        if (val.trim().length >= 2) {
            const matches = doctorMemoryList.filter(d => d.name.toLowerCase().includes(val.toLowerCase()) || d.specialty.toLowerCase().includes(val.toLowerCase()));
            setDoctorSuggestions(matches.slice(0, 4));
        } else { setDoctorSuggestions([]); }
    };

    const defaultAnalysisCode = formMode === 'clinical' ? (CLINICAL_ANALYSIS_CODES[0]?.code || '1020') : 'RTA';
    const defaultMethodCode = formMode === 'clinical' ? 'CM1' : 'M4';

    const [samples, setSamples] = useState([
        { id: Date.now(), description: '', lot: '', other: '', analysisCode: defaultAnalysisCode, methodCode: defaultMethodCode }
    ]);

    const handleSwitchMode = (newMode) => {
        if (newMode === formMode) return;
        setFormMode(newMode);
        const newDefaultAnalysis = newMode === 'clinical' ? (CLINICAL_ANALYSIS_CODES[0]?.code || '1020') : 'RTA';
        const newDefaultMethod = newMode === 'clinical' ? 'CM1' : 'M4';
        setSamples(prev => prev.map(s => ({ ...s, analysisCode: newDefaultAnalysis, methodCode: newDefaultMethod })));
        setAccordionState({ identity: true, contact: false, samples: false });
    };

    useEffect(() => {
        if (location.state?.mode && location.state.mode !== formMode) handleSwitchMode(location.state.mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.state?.mode]);

    const activeAnalysisCatalog = useMemo(() => formMode === 'clinical' ? CLINICAL_ANALYSIS_CODES : INDUSTRIAL_ANALYSIS_CODES, [formMode]);
    const activeGroupedMethods = useMemo(() => {
        const methods = formMode === 'clinical' ? CLINICAL_METHOD_CODES : INDUSTRIAL_METHOD_CODES;
        return methods.reduce((acc, current) => {
            const cat = current.category || (formMode === 'clinical' ? '🏥 Métodos Clínicos' : '🔬 Métodos Generales');
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(current);
            return acc;
        }, {});
    }, [formMode]);

    const activeSampleTypeSuggestions = useMemo(() => formMode === 'clinical' ? CLINICAL_SAMPLE_TYPES : INDUSTRIAL_SAMPLE_TYPES, [formMode]);

    const filteredClients = useMemo(() => {
        if (!clients) return [];
        const query = searchClientQuery.toLowerCase();
        return clients.filter(c => {
            const matchesQuery = (c.name || '').toLowerCase().includes(query) || (c.email || '').toLowerCase().includes(query) || (c.document || '').toLowerCase().includes(query);
            if (!matchesQuery) return false;
            if (!query) {
                if (formMode === 'clinical') return c.type === 'Paciente (Clínico)' || c.type === 'paciente' || c.type === 'Médico / Clínica';
                else return c.type !== 'Paciente (Clínico)' && c.type !== 'paciente';
            }
            return true;
        });
    }, [clients, searchClientQuery, formMode]);

    const addRow = () => {
        if (samples.length >= 20) { alert('El formulario permite un máximo de 20 muestras por registro.'); return; }
        setSamples([...samples, { id: Date.now(), description: '', lot: '', other: '', analysisCode: defaultAnalysisCode, methodCode: defaultMethodCode }]);
    };

    const removeRow = (id) => {
        if (samples.length === 1) return;
        if (window.confirm('¿Está seguro de remover esta muestra?')) setSamples(samples.filter(s => s.id !== id));
    };

    const duplicateRow = (sample) => {
        if (samples.length >= 20) { alert('Máximo 20 muestras.'); return; }
        const newSample = { ...sample, id: Date.now(), analysisCode: defaultAnalysisCode };
        const idx = samples.findIndex(s => s.id === sample.id);
        const next = [...samples];
        next.splice(idx + 1, 0, newSample);
        setSamples(next);
    };

    const updateSample = (id, field, value) => {
        setSamples(samples.map(s => {
            if (s.id !== id) return s;
            const updated = { ...s, [field]: value };
            if (formMode === 'industrial') {
                if (field === 'description') {
                    const descLower = (value || '').toLowerCase();
                    if (descLower.includes('agua potable') || descLower.includes('agua consumo') || descLower.includes('hielo')) {
                        if (updated.methodCode === 'M1') updated.methodCode = 'M4';
                    } else if (descLower.includes('agua residual') || descLower.includes('agua cruda') || descLower.includes('efluente')) {
                        if (updated.methodCode === 'M1') updated.methodCode = 'M3';
                    }
                } else if (field === 'analysisCode') {
                    if (value.startsWith('FQ-')) updated.methodCode = 'M20';
                }
            }
            return updated;
        }));
    };

    // Aplicar panel rápido
    const handleApplyPanel = (panel) => {
        const catalog = formMode === 'clinical' ? CLINICAL_ANALYSIS_CODES : INDUSTRIAL_ANALYSIS_CODES;
        const newRows = panel.items.map((item, idx) => ({
            id: Date.now() + idx,
            description: item.sample || (samples[0]?.description || ''),
            lot: '',
            other: '',
            analysisCode: catalog.find(c => c.code === item.analysisCode) ? item.analysisCode : defaultAnalysisCode,
            methodCode: item.methodCode || defaultMethodCode
        }));
        const current = samples.filter(s => s.description.trim() !== '' || s.analysisCode !== defaultAnalysisCode);
        setSamples([...current, ...newRows]);
        setAccordionState(prev => ({ ...prev, samples: true }));
    };

    const handleExtractWithAI = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        let currentKey = geminiApiKey;
        if (!currentKey) {
            currentKey = prompt('✨ Extraer con IA: Por favor, pegue su API Key de Gemini (Google AI Studio):');
            if (currentKey) { currentKey = currentKey.trim(); localStorage.setItem('LIMS_GEMINI_API_KEY', currentKey); setGeminiApiKey(currentKey); }
            else return;
        }
        setIsExtracting(true);
        setUploadProgress('Leyendo documento con Inteligencia Artificial...');
        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
                reader.readAsDataURL(file);
            });
            const result = await extractOrderFromDocument(dataUrl, formMode);
            setUploadProgress('Aplicando datos al formulario...');
            if (result.tipoFormulario === 'clinico' || result.datosClinicos?.medicoSolicitante) {
                setFormMode('clinical');
                setPatientName(result.paciente_o_cliente?.nombre || '');
                setPatientDNI(result.paciente_o_cliente?.identificacion !== 'vacio' ? (result.paciente_o_cliente?.identificacion || '') : '');
                setRequesterName(result.datosClinicos?.medicoSolicitante || '');
                setPatientDOB(result.paciente_o_cliente?.fechaNacimiento !== 'vacio' ? (result.paciente_o_cliente?.fechaNacimiento || '') : '');
                let gender = result.paciente_o_cliente?.sexo || 'Masculino';
                if (gender === 'vacio') gender = 'Masculino';
                setPatientGender(gender);
                setPatientPhoneMobile(result.paciente_o_cliente?.telefono !== 'vacio' ? (result.paciente_o_cliente?.telefono || '') : '');
                setPatientAddress(result.paciente_o_cliente?.direccion !== 'vacio' ? (result.paciente_o_cliente?.direccion || '') : '');
                setClinicalInfo(result.datosClinicos?.informacionClinica !== 'vacio' ? (result.datosClinicos?.informacionClinica || '') : '');
                if (result.datosClinicos?.fechaTomaMuestra && result.datosClinicos.fechaTomaMuestra !== 'vacio') setCollectionDate(result.datosClinicos.fechaTomaMuestra);
            } else { setFormMode('industrial'); }
            if (result.paciente_o_cliente?.nombre) {
                const nameToSearch = result.paciente_o_cliente.nombre;
                const foundClient = clients?.find(c => c.name.toLowerCase() === nameToSearch.toLowerCase());
                if (foundClient) { setSelectedClientId(foundClient.id); setClientName(foundClient.name); setSearchClientQuery(foundClient.name); }
                else { setSelectedClientId('NEW_CLIENT'); setClientName(nameToSearch); setSearchClientQuery(nameToSearch); if (result.paciente_o_cliente?.telefono && result.paciente_o_cliente.telefono !== 'vacio') setPatientPhoneMobile(result.paciente_o_cliente.telefono); }
            }
            if (result.muestras && result.muestras.length > 0) {
                const newSamples = [];
                const isClin = result.tipoFormulario === 'clinico' || result.datosClinicos?.medicoSolicitante;
                const catalogToSearch = isClin ? CLINICAL_ANALYSIS_CODES : INDUSTRIAL_ANALYSIS_CODES;
                const defaultMethod = isClin ? 'CM1' : 'M1';
                result.muestras.forEach((m, idx) => {
                    const desc = (m.descripcion && m.descripcion !== 'vacio') ? m.descripcion : (isClin ? 'Muestra biológica (Sangre/Suero)' : 'Producto / Alimento');
                    const pruebas = m.pruebasSolicitadas || [];
                    if (pruebas.length === 0) {
                        newSamples.push({ id: Date.now() + idx, description: desc, lot: (m.lote && m.lote !== 'vacio') ? m.lote : '', other: (m.otrosDatos && m.otrosDatos !== 'vacio') ? m.otrosDatos : '', analysisCode: 'CUSTOM', methodCode: defaultMethod });
                    } else {
                        pruebas.forEach((p, pIdx) => {
                            const match = catalogToSearch.find(ac => ac.name.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(ac.name.toLowerCase()));
                            const aCode = match ? match.code : 'CUSTOM';
                            newSamples.push({ id: Date.now() + idx + pIdx, description: desc + (aCode === 'CUSTOM' ? ` (${p})` : ''), lot: (m.lote && m.lote !== 'vacio') ? m.lote : '', other: (m.otrosDatos && m.otrosDatos !== 'vacio') ? m.otrosDatos : '', analysisCode: aCode, methodCode: defaultMethod });
                        });
                    }
                });
                if (newSamples.length > 0) setSamples(newSamples);
            }
            setUploadProgress('¡Datos cargados con éxito!');
            setAccordionState({ identity: false, contact: true, samples: true });
        } catch (error) {
            console.error('AI Error:', error);
            setUploadProgress('Error al procesar el documento.');
        }
    };

    const handleRegistryLookup = async () => {
        if (!patientDNI.trim()) { alert('Por favor ingrese una cédula o número de identificación para consultar.'); return; }
        setIsSearchingRegistry(true);
        try {
            const result = await lookupCivilRegistry(patientDNI);
            setPatientFirstName(result.firstName || ''); setPatientSecondName(result.secondName || '');
            setPatientFirstLastName(result.firstLastName || ''); setPatientSecondLastName(result.secondLastName || '');
            setPatientName(result.name); setPatientDOB(result.birthDate); setPatientGender(result.gender);
            setPatientDNI(result.document); setClientName(result.name); setSearchClientQuery(result.name);
            // Auto-advance to contact section
            openNextAccordion('contact');
            setAccordionState(prev => ({ ...prev, identity: false, contact: true }));
        } catch (error) {
            alert('❌ Error de consulta: ' + error.message);
        } finally { setIsSearchingRegistry(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const finalClientName = formMode === 'clinical'
            ? (patientName || [patientFirstName, patientSecondName, patientFirstLastName, patientSecondLastName].filter(Boolean).join(' ') || clientName || searchClientQuery)
            : (companyLegalName || clientName || searchClientQuery);
        if (!finalClientName.trim()) {
            alert(formMode === 'clinical' ? 'Por favor ingrese el nombre del paciente.' : 'Por favor seleccione o ingrese el nombre / razón social de la empresa.');
            return;
        }
        const emptySample = samples.find(s => !s.description.trim());
        if (emptySample) { alert('Por favor complete la descripción o tipo de todas las muestras agregadas.'); return; }
        if (formMode === 'clinical') {
            if (!patientFirstName || !patientFirstLastName) { alert('Por favor complete al menos el Primer Nombre y Primer Apellido del paciente.'); return; }
            if (!requesterName || !collectionDate) { alert('Por favor complete el Médico/Clínica solicitante y la Fecha/Hora de toma de muestra.'); return; }
            if (patientDOB) { const dobDate = new Date(patientDOB); if (dobDate > new Date()) { alert('La fecha de nacimiento no puede ser una fecha futura.'); return; } }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (patientEmailResults && !emailRegex.test(patientEmailResults)) { alert('El correo para envío de resultados tiene un formato inválido.'); return; }
            if (patientEmailBilling && !emailRegex.test(patientEmailBilling)) { alert('El correo de facturación electrónica tiene un formato inválido.'); return; }
            if (doctorEmail && !emailRegex.test(doctorEmail)) { alert('El correo del médico tratante tiene un formato inválido.'); return; }
        } else {
            if (!companyLegalName.trim() && !finalClientName.trim()) { alert('Por favor ingrese la Razón Social o Empresa.'); return; }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (qualityContactEmail && !emailRegex.test(qualityContactEmail)) { alert('El correo del departamento de calidad tiene un formato inválido.'); return; }
            if (accountingContactEmail && !emailRegex.test(accountingContactEmail)) { alert('El correo de contabilidad/facturación tiene un formato inválido.'); return; }
            if (procurementContactEmail && !emailRegex.test(procurementContactEmail)) { alert('El correo de compras/cotizaciones tiene un formato inválido.'); return; }
        }
        setIsSubmitting(true);
        try {
            let actualClientId = selectedClientId;
            if (selectedClientId === 'NEW_CLIENT' || !selectedClientId) {
                const clientData = {
                    name: finalClientName,
                    type: formMode === 'clinical' ? 'Paciente (Clínico)' : 'Industria',
                    email: formMode === 'clinical' ? (patientEmailResults || patientEmailBilling || newClientEmail) : (qualityContactEmail || accountingContactEmail || newClientEmail),
                    contacts: [], status: 'Activo',
                    createdAt: user?.uid === 'offline-user' ? { seconds: Math.floor(Date.now() / 1000) } : serverTimestamp()
                };
                if (formMode === 'clinical') {
                    clientData.birthDate = patientDOB; clientData.gender = patientGender; clientData.document = patientDNI;
                    clientData.firstName = patientFirstName; clientData.secondName = patientSecondName;
                    clientData.firstLastName = patientFirstLastName; clientData.secondLastName = patientSecondLastName;
                    clientData.address = patientAddress;
                    clientData.contacts = [
                        ...(patientEmailResults || patientPhoneMobile ? [{ name: finalClientName, role: 'Resultados / Consultas', email: patientEmailResults || '', phone: patientPhoneMobile || '', phoneLandline: patientPhoneLandline || '', phoneEmergency: patientPhoneEmergency || '', department: 'Paciente' }] : []),
                        ...(patientEmailBilling ? [{ name: finalClientName, role: 'Facturación Electrónica', email: patientEmailBilling, phone: patientPhoneMobile || patientPhoneLandline || '', department: 'Contabilidad' }] : []),
                        ...(requesterName || doctorEmail ? [{ name: requesterName, role: 'Médico Tratante', email: doctorEmail || '', phone: doctorPhone || '', department: doctorSpecialty || 'Médico' }] : [])
                    ];
                } else {
                    clientData.document = companyTaxId; clientData.commercialName = companyCommercialName;
                    clientData.contacts = [
                        ...(qualityContactEmail || qualityContactFirstName ? [{ name: [qualityContactFirstName, qualityContactSecondName, qualityContactFirstLastName, qualityContactSecondLastName].filter(Boolean).join(' ') || 'Encargado de Calidad', role: 'Calidad / Informes Técnicos', email: qualityContactEmail || '', phone: qualityContactPhoneMobile || qualityContactPhoneOffice || '', phoneOffice: qualityContactPhoneOffice || '', department: qualityContactRole || 'Aseguramiento de Calidad' }] : []),
                        ...(accountingContactEmail || accountingContactName ? [{ name: accountingContactName || 'Contabilidad', role: 'Facturación / Contabilidad', email: accountingContactEmail || '', phone: accountingContactPhone || '', department: 'Finanzas' }] : []),
                        ...(procurementContactEmail ? [{ name: 'Compras / Cotizaciones', role: 'Compras / Cotizaciones', email: procurementContactEmail, phone: '', department: 'Adquisiciones' }] : [])
                    ];
                }
                if (user?.uid === 'offline-user') {
                    const localClients = JSON.parse(localStorage.getItem('lims_local_clients') || '[]');
                    clientData.id = `client-local-${Date.now()}`; localClients.unshift(clientData);
                    localStorage.setItem('lims_local_clients', JSON.stringify(localClients)); actualClientId = clientData.id;
                } else {
                    const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/clients`), clientData);
                    actualClientId = docRef.id;
                }
            }

            const buildRequestData = (sample, isOffline) => {
                const catalog = formMode === 'clinical' ? CLINICAL_ANALYSIS_CODES : INDUSTRIAL_ANALYSIS_CODES;
                const analysisName = catalog.find(a => a.code === sample.analysisCode)?.name || 'Análisis no especificado';
                let sampleCategory = 'Alimentos';
                if (formMode === 'clinical') { sampleCategory = 'Clínica'; }
                else {
                    const desc = sample.description.toLowerCase();
                    if (sample.methodCode === 'M3' || sample.methodCode === 'M4' || desc.includes('agua') || desc.includes('hielo')) sampleCategory = 'Agua / Hielo';
                    else if (sample.methodCode === 'M13' || sample.methodCode === 'M14' || desc.includes('superficie') || desc.includes('aire') || desc.includes('ambiente')) sampleCategory = 'Aire / Ambiental';
                    else sampleCategory = 'Alimentos';
                }
                const methodObj = (formMode === 'clinical' ? CLINICAL_METHOD_CODES : INDUSTRIAL_METHOD_CODES).find(m => m.code === sample.methodCode);
                const platingMethodStr = methodObj ? methodObj.name : sample.methodCode;
                const activeBranch = branchesList.find(b => b.id === selectedBranchId) || branchesList[0] || {};
                return {
                    clientName: finalClientName, clientId: actualClientId,
                    clientType: formMode === 'clinical' ? 'Clínica' : 'Industria',
                    sampleType: formMode === 'clinical' ? 'Clínica' : sampleCategory,
                    sampleDescription: sample.description,
                    sampleLot: formMode === 'clinical' ? null : sample.lot,
                    sampleOther: sample.other,
                    requestDate: isOffline ? new Date(entryDate).toISOString() : serverTimestamp(),
                    analysisRequested: analysisName, analysisCode: sample.analysisCode,
                    methodCode: sample.methodCode, expectedPlatingMethod: platingMethodStr, deliveryMethod,
                    branchId: activeBranch.id, branchName: activeBranch.name, branchCode: activeBranch.code,
                    branchAddress: activeBranch.address, branchPhones: activeBranch.telephones || activeBranch.whatsapp || '',
                    branchDirectorName: activeBranch.directorName || '', branchDirectorCode: activeBranch.directorCode || '',
                    ...(formMode === 'clinical' ? {
                        patientFirstName, patientSecondName, patientFirstLastName, patientSecondLastName,
                        patientName: finalClientName, patientDNI, patientDOB, patientGender, patientAddress,
                        patientPhoneMobile, patientPhoneLandline, patientPhoneEmergency,
                        patientPhone: patientPhoneMobile || patientPhoneLandline || patientPhoneEmergency,
                        patientEmailResults, patientEmailBilling,
                        email: patientEmailResults || patientEmailBilling || newClientEmail,
                        requesterName, doctorSpecialty, doctorEmail, doctorPhone,
                        collectionDate: collectionDate ? new Date(collectionDate).toISOString() : null,
                        collectionLocation, clinicalInfo
                    } : {
                        companyLegalName: finalClientName, companyCommercialName, companyTaxId, receptionTemp, samplerName,
                        qualityContactFirstName, qualityContactSecondName, qualityContactFirstLastName, qualityContactSecondLastName,
                        qualityContactName: [qualityContactFirstName, qualityContactSecondName, qualityContactFirstLastName, qualityContactSecondLastName].filter(Boolean).join(' '),
                        qualityContactRole, qualityContactEmail, qualityContactPhoneMobile, qualityContactPhoneOffice,
                        qualityContactPhone: qualityContactPhoneMobile || qualityContactPhoneOffice,
                        accountingContactName, accountingContactEmail, accountingContactPhone, procurementContactEmail,
                        email: qualityContactEmail || accountingContactEmail || newClientEmail
                    }),
                    analysisIds: [], results: {}, status: 'Pendiente',
                    createdAt: isOffline ? { seconds: Math.floor(Date.now() / 1000) } : serverTimestamp(),
                    createdBy: isOffline ? 'offline-user' : (user?.uid || 'anon')
                };
            };

            if (user?.uid === 'offline-user') {
                const localRequests = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                samples.forEach((sample, idx) => {
                    const newRequest = { id: `MC-LOCAL-${Date.now()}-${idx}`, ...buildRequestData(sample, true) };
                    localRequests.unshift(newRequest);
                });
                localStorage.setItem('lims_local_requests', JSON.stringify(localRequests));
                window.dispatchEvent(new Event('lims_local_data_updated'));
            } else {
                await Promise.all(samples.map(sample => addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/requests`), buildRequestData(sample, false))));
                await logAuditAction(db, user?.uid, 'CREAR_SOLICITUD_LOTE', `Se registraron ${samples.length} muestras en bloque para ${finalClientName} (${formMode === 'clinical' ? 'Clínico' : 'Industrial'})`);
            }

            alert(`✅ Se registraron con éxito ${samples.length} muestras bajo la solicitud para ${finalClientName}.`);
            navigateTo('dashboard');
        } catch {
            alert('Ocurrió un error al guardar las solicitudes.');
            setIsSubmitting(false);
        }
    };

    // ============================================================
    // RENDER
    // ============================================================
    const isClinical = formMode === 'clinical';

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-12">
            <button onClick={() => navigateTo('dashboard')} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors font-medium">
                <ArrowLeft size={18} className="mr-2" /> Volver a Solicitudes
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                {/* ===== SELECTOR DE MODO ===== */}
                <div className={`flex flex-col sm:flex-row ${isClinical ? 'bg-gradient-to-r from-indigo-700 to-indigo-900' : 'bg-gradient-to-r from-slate-700 to-slate-900'} transition-all duration-300`}>
                    <button
                        type="button"
                        onClick={() => handleSwitchMode('clinical')}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 px-6 transition-all font-bold ${isClinical ? 'bg-white/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <span className="text-2xl">🏥</span>
                        <span className="text-sm font-extrabold">Módulo Clínico</span>
                        <span className="text-[11px] font-normal opacity-80">Pacientes · Análisis Clínicos</span>
                    </button>
                    <div className="w-px bg-white/10 hidden sm:block" />
                    <button
                        type="button"
                        onClick={() => handleSwitchMode('industrial')}
                        className={`flex-1 flex flex-col items-center justify-center gap-1 py-4 px-6 transition-all font-bold ${!isClinical ? 'bg-white/20 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                    >
                        <span className="text-2xl">🏭</span>
                        <span className="text-sm font-extrabold">Módulo Industrial</span>
                        <span className="text-[11px] font-normal opacity-80">Alimentos · Aguas · Monitoreo</span>
                    </button>
                </div>

                {/* ===== BANNER DE MODO ===== */}
                <div className={`px-6 py-3 flex items-center justify-between ${isClinical ? 'bg-indigo-50 border-b border-indigo-100' : 'bg-slate-50 border-b border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm ${isClinical ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                            <FileText size={16} />
                        </div>
                        <div>
                            <h2 className={`font-extrabold text-base ${isClinical ? 'text-indigo-950' : 'text-slate-800'}`}>
                                {isClinical ? 'Ingreso de Solicitud Clínica' : 'Ingreso de Muestras Industriales'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isClinical ? 'Registro de pacientes, médicos y pruebas clínicas (CMQCCR)' : 'Alimentos, aguas, superficies y control microbiológico ambiental'}
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <img src="https://www.microlabscr.com/s/misc/logo.jpg" alt="Logo" className="h-10 opacity-80 mix-blend-multiply" onError={(e) => e.target.style.display='none'} />
                    </div>
                </div>

                <div className="p-6 space-y-4">

                    {/* ===== AI EXTRACTOR ===== */}
                    <div className={`p-4 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 border ${
                        isClinical ? 'bg-violet-50 border-violet-100' : 'bg-emerald-50 border-emerald-100'
                    }`}>
                        <div>
                            <h3 className={`text-sm font-bold flex items-center gap-2 ${
                                isClinical ? 'text-violet-900' : 'text-emerald-900'
                            }`}>
                                <Sparkles size={15} className={isClinical ? 'text-violet-600' : 'text-emerald-600'} />
                                {isClinical ? '✨ Autocompletar con IA — Orden Médica' : '🤖 Autocompletar con IA — Solicitud Industrial'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {isClinical
                                    ? 'Sube una orden médica, boleta clínica o solicitud de análisis para extraer datos del paciente y pruebas automáticamente.'
                                    : 'Sube una solicitud de análisis, ficha técnica o remisión de muestras para pre-cargar empresa, producto y parámetros.'
                                }
                            </p>
                        </div>
                        <label className={`flex items-center gap-2 bg-white border text-sm cursor-pointer px-4 py-2 rounded-lg font-bold shadow-sm transition-colors ${
                            isExtracting
                                ? 'opacity-50 cursor-not-allowed border-slate-200 text-slate-400'
                                : isClinical
                                    ? 'hover:bg-violet-50 border-violet-200 text-violet-800'
                                    : 'hover:bg-emerald-50 border-emerald-200 text-emerald-800'
                        }`}>
                            {isExtracting
                                ? <Sparkles size={15} className={`animate-pulse ${isClinical ? 'text-violet-600' : 'text-emerald-600'}`} />
                                : <PlusCircle size={15} />
                            }
                            {isExtracting
                                ? 'Procesando con IA...'
                                : isClinical ? 'Subir Orden Médica / Boleta' : 'Subir Solicitud / Remisión'
                            }
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleExtractWithAI} disabled={isExtracting} />
                        </label>
                    </div>

                    {uploadProgress && (
                        <div className={`p-3 text-center text-sm font-bold rounded-lg animate-pulse ${uploadProgress.includes('éxito') ? 'bg-emerald-600 text-white' : uploadProgress.includes('Error') ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'}`}>
                            {uploadProgress}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* ===== CABECERA: CRM + SUCURSAL + FECHA + ENTREGA ===== */}
                        <div className={`p-5 rounded-xl border space-y-4 ${isClinical ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {/* Buscador CRM */}
                                <div className="space-y-1.5 relative col-span-1">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">
                                        {isClinical ? 'Buscar Paciente (CRM / Historial)' : 'Buscar Empresa / Cliente (CRM)'}
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={isClinical ? '🔍 Nombre o cédula...' : '🔍 Empresa o cédula jurídica...'}
                                        value={searchClientQuery}
                                        onChange={e => { setSearchClientQuery(e.target.value); setIsClientDropdownOpen(true); if (selectedClientId !== 'NEW_CLIENT') setSelectedClientId(''); }}
                                        onFocus={() => setIsClientDropdownOpen(true)}
                                        onBlur={() => setTimeout(() => setIsClientDropdownOpen(false), 250)}
                                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-bold text-slate-800"
                                    />
                                    {isClientDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            {filteredClients.map((client) => (
                                                <div key={client.id} onClick={() => {
                                                    setSelectedClientId(client.id); setClientName(client.name); setSearchClientQuery(client.name); setIsClientDropdownOpen(false);
                                                    if (client.type === 'Paciente (Clínico)' || client.type === 'paciente') {
                                                        const parts = (client.name || '').split(' ');
                                                        if (client.firstName) { setPatientFirstName(client.firstName || ''); setPatientSecondName(client.secondName || ''); setPatientFirstLastName(client.firstLastName || ''); setPatientSecondLastName(client.secondLastName || ''); }
                                                        else if (parts.length >= 2) { setPatientFirstName(parts[0] || ''); setPatientFirstLastName(parts[1] || ''); if (parts.length >= 3) setPatientSecondLastName(parts[2] || ''); }
                                                        setPatientName(client.name); setPatientDNI(client.document || ''); setPatientDOB(client.birthDate || ''); setPatientGender(client.gender || 'Masculino'); setPatientAddress(client.address || '');
                                                        const resultsContact = client.contacts?.find(c => c.role?.includes('Resultados') || c.department === 'Paciente') || client.contacts?.[0];
                                                        const billingContact = client.contacts?.find(c => c.role?.includes('Facturación') || c.department === 'Contabilidad');
                                                        const doctorContact = client.contacts?.find(c => c.role?.includes('Médico') || c.department?.includes('Médico'));
                                                        if (resultsContact) { setPatientEmailResults(resultsContact.email || client.email || ''); setPatientPhoneMobile(resultsContact.phone || ''); setPatientPhoneLandline(resultsContact.phoneLandline || ''); setPatientPhoneEmergency(resultsContact.phoneEmergency || ''); } else { setPatientEmailResults(client.email || ''); }
                                                        if (billingContact) setPatientEmailBilling(billingContact.email || '');
                                                        if (doctorContact) { setRequesterName(doctorContact.name || ''); setDoctorEmail(doctorContact.email || ''); setDoctorPhone(doctorContact.phone || ''); setDoctorSpecialty(doctorContact.department || ''); }
                                                        setAccordionState({ identity: false, contact: true, samples: false });
                                                    } else {
                                                        setCompanyLegalName(client.name || ''); setCompanyCommercialName(client.commercialName || ''); setCompanyTaxId(client.document || '');
                                                        const qualityC = client.contacts?.find(c => c.role?.includes('Calidad') || c.department?.includes('Calidad')) || client.contacts?.[0];
                                                        const billingC = client.contacts?.find(c => c.role?.includes('Facturación') || c.department?.includes('Finanzas') || c.department?.includes('Contabilidad'));
                                                        const procC = client.contacts?.find(c => c.role?.includes('Compras'));
                                                        if (qualityC) { setQualityContactFirstName(qualityC.name || ''); setQualityContactRole(qualityC.department || 'Jefe de Calidad'); setQualityContactEmail(qualityC.email || client.email || ''); setQualityContactPhoneMobile(qualityC.phone || ''); setQualityContactPhoneOffice(qualityC.phoneOffice || ''); } else { setQualityContactEmail(client.email || ''); }
                                                        if (billingC) { setAccountingContactName(billingC.name || ''); setAccountingContactEmail(billingC.email || ''); setAccountingContactPhone(billingC.phone || ''); }
                                                        if (procC) setProcurementContactEmail(procC.email || '');
                                                        setAccordionState({ identity: false, contact: false, samples: true });
                                                    }
                                                }} className="px-4 py-3 hover:bg-indigo-50 text-slate-700 text-sm cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-800">{client.name}</span>
                                                        <span className="text-[11px] text-slate-400">{client.type || 'Cliente'} {client.document ? `• ${client.document}` : ''}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            <div onClick={() => { setSelectedClientId('NEW_CLIENT'); setClientName(''); setNewClientEmail(''); setSearchClientQuery('Nuevo Registro'); setIsClientDropdownOpen(false); }}
                                                className="px-4 py-3 hover:bg-slate-100 text-indigo-600 text-sm cursor-pointer italic font-bold border-t border-slate-100">
                                                ➕ Registrar Nuevo {isClinical ? 'Paciente' : 'Cliente Industrial'}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Sucursal */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">🏥 Sucursal / Sede</label>
                                    <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800">
                                        {branchesList.map(b => (<option key={b.id} value={b.id}>{b.name} ({b.code}) {b.isMain ? '★' : ''}</option>))}
                                    </select>
                                </div>

                                {/* Fecha recepción */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Fecha de Recepción <span className="text-red-500">*</span></label>
                                    <input type="datetime-local" value={entryDate} onChange={e => setEntryDate(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                                </div>

                                {/* Entrega */}
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-600 uppercase">Vía de Entrega</label>
                                    <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold text-slate-800">
                                        <option value="Email">Correo Electrónico</option>
                                        <option value="WhatsApp">WhatsApp / Móvil</option>
                                        <option value="Físico">Físico / Impreso</option>
                                        <option value="Portal">Portal Web</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* ===== AVISO DE MEMORIA ===== */}
                        {autoFilledInfo && (
                            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between animate-fade-in text-xs font-bold text-emerald-900 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-extrabold tracking-wide">✨ MEMORIA LIMS</span>
                                    <span>Datos de <strong>{autoFilledInfo.name}</strong> ({autoFilledInfo.source} · {autoFilledInfo.date})</span>
                                </div>
                                <button type="button" onClick={() => setAutoFilledInfo(null)} className="text-emerald-700 hover:text-emerald-950 underline font-semibold cursor-pointer border-0 bg-transparent">Descartar</button>
                            </div>
                        )}

                        {/* ============================================================ */}
                        {/* MODO CLÍNICO — ACORDEÓN 3 SECCIONES                         */}
                        {/* ============================================================ */}
                        {isClinical && (
                            <div className="space-y-3">
                                {/* PASO 1: IDENTIFICACIÓN DEL PACIENTE */}
                                <AccordionSection
                                    title="Paso 1 — Identificación del Paciente"
                                    icon="👤"
                                    badge={patientFirstName && patientFirstLastName ? `✓ ${patientFirstName} ${patientFirstLastName}` : 'Requerido'}
                                    open={accordionState.identity}
                                    onToggle={() => toggleAccordion('identity')}
                                    accentColor="indigo"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        {/* Cédula + TSE */}
                                        <div className="space-y-1.5 relative">
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Cédula / DNI / Pasaporte</label>
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="Ej. 1-1234-1234" value={patientDNI} onChange={e => handleDniInputChange(e.target.value)} className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
                                                <button type="button" onClick={handleRegistryLookup} disabled={isSearchingRegistry} title="Consultar padrón nacional TSE"
                                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1 transition-colors disabled:opacity-50 border-0">
                                                    {isSearchingRegistry ? (<div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<Search size={13} />)}
                                                    <span>TSE</span>
                                                </button>
                                            </div>
                                            {dniSuggestions.length > 0 && (
                                                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-indigo-200 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto animate-fade-in">
                                                    <div className="text-[10px] font-extrabold text-indigo-700 uppercase px-2 py-1">💡 Coincidencias en memoria:</div>
                                                    {dniSuggestions.map((m, idx) => (
                                                        <div key={`dni-${m.id}-${idx}`} onClick={() => applyMemoryProfile(m)} className="p-2 hover:bg-indigo-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0">
                                                            <div className="flex flex-col"><span className="font-bold text-slate-800 text-xs">{m.name}</span><span className="text-[10px] text-slate-500">{m.document} {m.phoneMobile ? `• 📱 ${m.phoneMobile}` : ''}</span></div>
                                                            <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">⚡ Cargar</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Nombres */}
                                        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="relative">
                                                <label className="block text-xs font-bold text-slate-700 uppercase">Primer Nombre <span className="text-red-500">*</span></label>
                                                <input type="text" required value={patientFirstName} onChange={e => handlePatientNameInputChange('fn', e.target.value)} placeholder="Ej. Juan" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold mt-1" />
                                                {nameSuggestions.length > 0 && (
                                                    <div className="absolute z-50 left-0 w-80 mt-1 bg-white border border-indigo-200 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto animate-fade-in">
                                                        <div className="text-[10px] font-extrabold text-indigo-700 uppercase px-2 py-1">💡 Pacientes en memoria:</div>
                                                        {nameSuggestions.map((m, idx) => (
                                                            <div key={`name-${m.id}-${idx}`} onClick={() => applyMemoryProfile(m)} className="p-2 hover:bg-indigo-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0">
                                                                <div className="flex flex-col"><span className="font-bold text-slate-800 text-xs">{m.name}</span><span className="text-[10px] text-slate-500">{m.document ? `Céd: ${m.document}` : ''} {m.phoneMobile ? `• 📱 ${m.phoneMobile}` : ''}</span></div>
                                                                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">⚡ Cargar</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase">Segundo Nombre</label>
                                                <input type="text" value={patientSecondName} onChange={e => handlePatientNameInputChange('sn', e.target.value)} placeholder="Ej. Carlos" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase">Primer Apellido <span className="text-red-500">*</span></label>
                                                <input type="text" required value={patientFirstLastName} onChange={e => handlePatientNameInputChange('fln', e.target.value)} placeholder="Ej. Pérez" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold mt-1" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 uppercase">Segundo Apellido</label>
                                                <input type="text" value={patientSecondLastName} onChange={e => handlePatientNameInputChange('sln', e.target.value)} placeholder="Ej. Gómez" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold mt-1" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Fecha de Nacimiento</label>
                                            <input type="date" value={patientDOB} onChange={e => setPatientDOB(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold mt-1" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Sexo Biológico</label>
                                            <select value={patientGender} onChange={e => setPatientGender(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold mt-1">
                                                <option>Masculino</option><option>Femenino</option><option>Otro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 uppercase">Dirección de Residencia</label>
                                            <input type="text" value={patientAddress} onChange={e => setPatientAddress(e.target.value)} placeholder="Provincia, Cantón, Distrito..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm mt-1" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button type="button" onClick={() => setAccordionState({ identity: false, contact: true, samples: false })}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors flex items-center gap-2">
                                            Siguiente: Contacto y Médico <ChevronDown size={15} />
                                        </button>
                                    </div>
                                </AccordionSection>

                                {/* PASO 2: CONTACTO Y MÉDICO */}
                                <AccordionSection
                                    title="Paso 2 — Contacto, Correos y Médico Tratante"
                                    icon="📞"
                                    badge={requesterName ? `🩺 Dr. ${requesterName.split(' ')[0]}` : 'Requerido'}
                                    open={accordionState.contact}
                                    onToggle={() => toggleAccordion('contact')}
                                    accentColor="blue"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Teléfonos */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">📱 Teléfonos del Paciente</h4>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Celular / WhatsApp <span className="text-emerald-600 font-normal normal-case">(Avisos inmediatos)</span></label>
                                                <input type="tel" value={patientPhoneMobile} onChange={e => setPatientPhoneMobile(e.target.value)} placeholder="+506 8888-8888" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Teléfono Fijo <span className="text-slate-400 font-normal normal-case">(Casa / Trabajo)</span></label>
                                                <input type="tel" value={patientPhoneLandline} onChange={e => setPatientPhoneLandline(e.target.value)} placeholder="2222-2222" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">🆘 Teléfono de Emergencia / Familiar</label>
                                                <input type="tel" value={patientPhoneEmergency} onChange={e => setPatientPhoneEmergency(e.target.value)} placeholder="8999-9999 (Nombre y parentesco)" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                            </div>
                                        </div>

                                        {/* Correos */}
                                        <div className="space-y-3">
                                            <h4 className="text-xs font-extrabold text-slate-700 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">📧 Correos y Enrutamiento</h4>
                                            <div>
                                                <label className="block text-[11px] font-bold text-indigo-900 uppercase mb-1">📩 Correo para Resultados / Informes</label>
                                                <input type="email" value={patientEmailResults} onChange={e => setPatientEmailResults(e.target.value)} placeholder="paciente@correo.com" className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-semibold text-indigo-950" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">💳 Correo de Facturación Electrónica</label>
                                                <input type="email" value={patientEmailBilling} onChange={e => setPatientEmailBilling(e.target.value)} placeholder="facturacion@correo.com" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Médico Tratante */}
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                        <h4 className="text-xs font-extrabold text-blue-900 uppercase flex items-center gap-1.5 mb-3">🩺 Médico Tratante / Clínica Solicitante</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="relative">
                                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Médico Solicitante <span className="text-red-500">*</span></label>
                                                <input type="text" required value={requesterName} onChange={e => handleDoctorInputChange(e.target.value)} placeholder="Dr. / Dra. Nombre Completo" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-bold" />
                                                {doctorSuggestions.length > 0 && (
                                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-blue-200 rounded-xl shadow-2xl p-2 max-h-52 overflow-y-auto animate-fade-in">
                                                        <div className="text-[10px] font-extrabold text-blue-700 uppercase px-2 py-1">🩺 Médicos en memoria:</div>
                                                        {doctorSuggestions.map((doc, idx) => (
                                                            <div key={`doc-${idx}`} onClick={() => applyDoctorProfile(doc)} className="p-2 hover:bg-blue-50 rounded-lg cursor-pointer flex justify-between items-center transition-colors border-b border-slate-50 last:border-0">
                                                                <div className="flex flex-col"><span className="font-bold text-slate-800 text-xs">{doc.name}</span><span className="text-[10px] text-slate-500">{doc.specialty || 'Médico'} {doc.email ? `• ${doc.email}` : ''}</span></div>
                                                                <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">⚡ Usar</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Especialidad / Código</label>
                                                <input type="text" value={doctorSpecialty} onChange={e => setDoctorSpecialty(e.target.value)} placeholder="Ej. Medicina Interna / 1234" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-blue-900 uppercase mb-1">📧 Correo Médico</label>
                                                <input type="email" value={doctorEmail} onChange={e => setDoctorEmail(e.target.value)} placeholder="medico@clinica.com" className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">📞 Teléfono Médico</label>
                                                <input type="tel" value={doctorPhone} onChange={e => setDoctorPhone(e.target.value)} placeholder="2500-0000" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Fecha y Hora de Toma de Muestra <span className="text-red-500">*</span></label>
                                                <input type="datetime-local" value={collectionDate} onChange={e => setCollectionDate(e.target.value)} required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm font-semibold" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Lugar de Extracción</label>
                                                <input type="text" value={collectionLocation} onChange={e => setCollectionLocation(e.target.value)} placeholder="Ej. Laboratorio Central, Domicilio..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Diagnóstico / Tratamiento Previo</label>
                                                <input type="text" value={clinicalInfo} onChange={e => setClinicalInfo(e.target.value)} placeholder="Ej. Antibioticoterapia, ayuno 12h..." className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button type="button" onClick={() => setAccordionState({ identity: false, contact: false, samples: true })}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors flex items-center gap-2">
                                            Siguiente: Muestras y Análisis <ChevronDown size={15} />
                                        </button>
                                    </div>
                                </AccordionSection>

                                {/* PASO 3: MUESTRAS */}
                                <AccordionSection
                                    title={`Paso 3 — Muestras y Análisis (${samples.length} muestra${samples.length !== 1 ? 's' : ''})`}
                                    icon="🧬"
                                    badge={samples.length > 1 ? `${samples.length} muestras` : undefined}
                                    open={accordionState.samples}
                                    onToggle={() => toggleAccordion('samples')}
                                    accentColor="indigo"
                                >
                                    <PanelPicker formMode="clinical" onApplyPanel={handleApplyPanel} />
                                    {renderSamplesTable()}
                                </AccordionSection>
                            </div>
                        )}

                        {/* ============================================================ */}
                        {/* MODO INDUSTRIAL — ACORDEÓN 2 SECCIONES                      */}
                        {/* ============================================================ */}
                        {!isClinical && (
                            <div className="space-y-3">
                                {/* SECCIÓN 1: EMPRESA Y CONTACTOS */}
                                <AccordionSection
                                    title="Empresa, Contactos y Condiciones de Muestreo"
                                    icon="🏢"
                                    badge={companyLegalName ? companyLegalName.slice(0, 30) + (companyLegalName.length > 30 ? '…' : '') : 'Requerido'}
                                    open={accordionState.identity}
                                    onToggle={() => toggleAccordion('identity')}
                                    accentColor="slate"
                                >
                                    {/* Datos de empresa */}
                                    <div className="bg-slate-900 text-white p-5 rounded-xl space-y-4">
                                        <h3 className="font-extrabold text-white text-sm flex items-center gap-2">🏢 Datos de la Empresa / Razón Social</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="relative">
                                                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Razón Social / Empresa <span className="text-red-400">*</span></label>
                                                <input type="text" required value={companyLegalName} onChange={e => handleCompanyInputChange('legal', e.target.value)} placeholder="Ej. Distribuidora del Norte S.A." className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-bold text-white placeholder-slate-500" />
                                                {companySuggestions.length > 0 && (
                                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-indigo-500 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto animate-fade-in text-white">
                                                        <div className="text-[10px] font-extrabold text-indigo-300 uppercase px-2 py-1">🏢 Empresas en memoria:</div>
                                                        {companySuggestions.map((m, idx) => (
                                                            <div key={`comp-${m.id}-${idx}`} onClick={() => applyMemoryProfile(m)} className="p-2 hover:bg-slate-800 rounded-lg cursor-pointer flex justify-between items-center transition-colors border-b border-slate-800 last:border-0">
                                                                <div className="flex flex-col"><span className="font-bold text-white text-xs">{m.name}</span><span className="text-[10px] text-slate-400">ID: {m.companyTaxId || 'N/A'}</span></div>
                                                                <span className="text-[10px] bg-indigo-500 text-white font-bold px-2 py-0.5 rounded-full">⚡ Cargar</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Nombre Comercial / Planta</label>
                                                <input type="text" value={companyCommercialName} onChange={e => handleCompanyInputChange('commercial', e.target.value)} placeholder="Ej. Planta Láctea San Isidro" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm text-white placeholder-slate-500" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">Cédula Jurídica / Tax ID</label>
                                                <input type="text" value={companyTaxId} onChange={e => handleCompanyInputChange('taxId', e.target.value)} placeholder="Ej. 3-101-123456" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none text-sm font-bold text-white placeholder-slate-500" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Calidad & Contabilidad */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-200 space-y-3">
                                            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                                                <h4 className="font-extrabold text-emerald-950 text-xs flex items-center gap-2">🧪 Dpto. Calidad & Inocuidad</h4>
                                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Informes / COA</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Nombre Responsable</label>
                                                    <input type="text" value={qualityContactFirstName} onChange={e => setQualityContactFirstName(e.target.value)} placeholder="Ej. Laura" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Apellidos</label>
                                                    <input type="text" value={qualityContactFirstLastName} onChange={e => setQualityContactFirstLastName(e.target.value)} placeholder="Ej. Gómez Chaves" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Cargo / Área</label>
                                                <input type="text" value={qualityContactRole} onChange={e => setQualityContactRole(e.target.value)} placeholder="Ej. Jefa de Calidad e Inocuidad" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-emerald-950 uppercase mb-1">📧 Correo de Calidad (Reportes y COA) <span className="text-red-500">*</span></label>
                                                <input type="email" value={qualityContactEmail} onChange={e => setQualityContactEmail(e.target.value)} placeholder="calidad@empresa.com" className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-emerald-950" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">📱 Celular Calidad</label>
                                                    <input type="tel" value={qualityContactPhoneMobile} onChange={e => setQualityContactPhoneMobile(e.target.value)} placeholder="8888-0000" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">☎️ Tel. Planta / Ext.</label>
                                                    <input type="tel" value={qualityContactPhoneOffice} onChange={e => setQualityContactPhoneOffice(e.target.value)} placeholder="2222-0000 Ext. 104" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-200 space-y-3">
                                            <div className="flex items-center justify-between border-b border-amber-200 pb-2">
                                                <h4 className="font-extrabold text-amber-950 text-xs flex items-center gap-2">💳 Dpto. Contabilidad & Facturación</h4>
                                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Facturas / XML</span>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Contacto Cuentas por Pagar</label>
                                                <input type="text" value={accountingContactName} onChange={e => setAccountingContactName(e.target.value)} placeholder="Ej. Lic. Carlos Morales (Tesorería)" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1">📧 Correo para Facturación Electrónica</label>
                                                <input type="email" value={accountingContactEmail} onChange={e => setAccountingContactEmail(e.target.value)} placeholder="facturas@empresa.com" className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm font-bold text-amber-950" />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">☎️ Teléfono Contabilidad</label>
                                                <input type="tel" value={accountingContactPhone} onChange={e => setAccountingContactPhone(e.target.value)} placeholder="2222-0000 Ext. 201" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                            </div>
                                            <div className="border-t border-amber-200 pt-3">
                                                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">📑 Correo de Compras / Cotizaciones</label>
                                                <input type="email" value={procurementContactEmail} onChange={e => setProcurementContactEmail(e.target.value)} placeholder="compras@empresa.com" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Condiciones de muestreo */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">🌡️ Temperatura de Recepción (°C)</label>
                                            <input type="number" step="0.1" value={receptionTemp} onChange={e => setReceptionTemp(e.target.value)} placeholder="Ej. 4.2" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-bold" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">📦 Responsable de Muestreo</label>
                                            <input type="text" value={samplerName} onChange={e => setSamplerName(e.target.value)} placeholder="Ej. Muestreador LIMS / Personal de Planta" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm" />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button type="button" onClick={() => setAccordionState(prev => ({ ...prev, identity: false, samples: true }))}
                                            className="bg-slate-700 hover:bg-slate-800 text-white text-sm font-bold px-5 py-2 rounded-lg transition-colors flex items-center gap-2">
                                            Siguiente: Muestras y Análisis <ChevronDown size={15} />
                                        </button>
                                    </div>
                                </AccordionSection>

                                {/* SECCIÓN 2: MUESTRAS INDUSTRIALES */}
                                <AccordionSection
                                    title={`Muestras y Análisis (${samples.length} muestra${samples.length !== 1 ? 's' : ''})`}
                                    icon="🧪"
                                    badge={samples.length > 1 ? `${samples.length} registros` : undefined}
                                    open={accordionState.samples}
                                    onToggle={() => toggleAccordion('samples')}
                                    accentColor="emerald"
                                >
                                    <PanelPicker formMode="industrial" onApplyPanel={handleApplyPanel} />
                                    {renderSamplesTable()}
                                </AccordionSection>
                            </div>
                        )}

                        {/* ===== PANEL DE ENRUTAMIENTO ===== */}
                        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 rounded-2xl shadow-md space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">⚡ Enrutamiento Inteligente de Información</span>
                                <span className="text-[11px] bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-400/30">Despacho Automático</span>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="font-bold text-emerald-400 flex items-center gap-1">📊 Informes / COA</div>
                                    <div className="text-slate-300 mt-1 truncate">➡️ {isClinical ? (patientEmailResults || 'Email del Paciente') : (qualityContactEmail || 'Email Calidad')}</div>
                                </div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="font-bold text-amber-400 flex items-center gap-1">💳 Facturación</div>
                                    <div className="text-slate-300 mt-1 truncate">➡️ {isClinical ? (patientEmailBilling || patientEmailResults || 'Email Facturación') : (accountingContactEmail || 'Email Contabilidad')}</div>
                                </div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="font-bold text-sky-400 flex items-center gap-1">💬 WhatsApp / SMS</div>
                                    <div className="text-slate-300 mt-1 truncate">➡️ {isClinical ? (patientPhoneMobile || 'Móvil Paciente') : (qualityContactPhoneMobile || 'Móvil Planta')}</div>
                                </div>
                                <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                                    <div className="font-bold text-rose-400 flex items-center gap-1">🚨 Alertas Críticas</div>
                                    <div className="text-slate-300 mt-1 truncate">➡️ {isClinical ? (doctorEmail || 'Médico Tratante') : (qualityContactEmail || 'Jefe de Calidad')}</div>
                                </div>
                            </div>
                        </div>

                        {/* ===== BOTÓN SUBMIT ===== */}
                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium">{samples.length} muestra{samples.length !== 1 ? 's' : ''} en esta solicitud</span>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-md transition-all disabled:opacity-70 text-white ${isClinical ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200' : 'bg-slate-800 hover:bg-slate-900 hover:shadow-slate-300'} hover:shadow-lg`}
                            >
                                <CheckCircle size={20} />
                                {isSubmitting ? 'Procesando...' : `Registrar Solicitud ${isClinical ? 'Clínica' : 'Industrial'}`}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    // ===== TABLA DE MUESTRAS (compartida entre modos) =====
    function renderSamplesTable() {
        return (
            <div>
                <datalist id="sample-type-options">
                    {activeSampleTypeSuggestions.map(st => (<option key={st} value={st} />))}
                </datalist>

                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">
                        {isClinical ? 'Muestras Biológicas y Exámenes' : 'Muestras / Productos a Analizar'}
                    </h3>
                    <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded">{samples.length} / 20</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className={isClinical ? 'bg-indigo-900 text-white' : 'bg-slate-800 text-white'}>
                            <tr>
                                <th className="p-3 w-8 text-center font-bold text-xs">#</th>
                                <th className="p-3 font-bold text-xs">{isClinical ? 'TIPO DE MUESTRA BIOLÓGICA' : 'PRODUCTO / MUESTRA'} <span className="text-red-400">*</span></th>
                                {!isClinical && <th className="p-3 font-bold text-xs w-28">LOTE</th>}
                                {!isClinical && <th className="p-3 font-bold text-xs w-28">CONDICIONES</th>}
                                <th className="p-3 font-bold text-xs w-64">{isClinical ? 'ANÁLISIS / PRUEBA' : 'ANÁLISIS'}</th>
                                <th className="p-3 font-bold text-xs w-48">MÉTODO</th>
                                <th className="p-3 w-16 text-center text-xs">ACCIONES</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                            {samples.map((sample, index) => (
                                <tr key={sample.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-2 text-center font-bold text-slate-400 text-xs">{index + 1}</td>
                                    <td className="p-2">
                                        <input
                                            type="text"
                                            required
                                            list="sample-type-options"
                                            placeholder={isClinical ? 'Ej. Sangre Total, Suero, Orina...' : 'Ej. Carne Molida, Leche, Agua...'}
                                            value={sample.description}
                                            onChange={(e) => updateSample(sample.id, 'description', e.target.value)}
                                            className="w-full min-w-[160px] px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                        />
                                    </td>
                                    {!isClinical && (
                                        <td className="p-2">
                                            <input type="text" placeholder="Lote..." value={sample.lot} onChange={(e) => updateSample(sample.id, 'lot', e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </td>
                                    )}
                                    {!isClinical && (
                                        <td className="p-2">
                                            <input type="text" placeholder="Temp, cond..." value={sample.other} onChange={(e) => updateSample(sample.id, 'other', e.target.value)} className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                                        </td>
                                    )}
                                    <td className="p-2">
                                        <AnalysisSearchCombo
                                            value={sample.analysisCode}
                                            onChange={(code) => updateSample(sample.id, 'analysisCode', code)}
                                            catalog={activeAnalysisCatalog}
                                            placeholder="Buscar análisis..."
                                        />
                                    </td>
                                    <td className="p-2">
                                        <select
                                            value={sample.methodCode}
                                            onChange={(e) => updateSample(sample.id, 'methodCode', e.target.value)}
                                            className={`w-full px-2 py-1.5 border rounded focus:ring-2 outline-none text-xs font-bold ${
                                                isClinical
                                                    ? 'border-indigo-200 focus:ring-indigo-500 text-indigo-950 bg-indigo-50/70'
                                                    : 'border-emerald-200 focus:ring-emerald-500 text-emerald-950 bg-emerald-50/60'
                                            }`}
                                        >
                                            {Object.entries(activeGroupedMethods).map(([category, items]) => (
                                                <optgroup key={category} label={category}>
                                                    {items.map(mc => (<option key={mc.code} value={mc.code}>{mc.code} — {mc.name}</option>))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => duplicateRow(sample)}
                                                title="Duplicar muestra (mismo tipo, otro análisis)"
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                            >
                                                <Copy size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeRow(sample.id)}
                                                disabled={samples.length === 1}
                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-30"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-3">
                    <button
                        type="button"
                        onClick={addRow}
                        className={`flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-lg transition-colors border ${
                            isClinical
                                ? 'text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border-indigo-200'
                                : 'text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                        }`}
                    >
                        <PlusCircle size={15} />
                        {isClinical ? '➕ Añadir Prueba / Muestra Biológica' : '➕ Añadir Muestra / Producto Industrial'}
                    </button>
                </div>
            </div>
        );
    }
};
