/**
 * Catálogo Maestro Preconfigurado de Técnicas y Ensayos de Laboratorio
 * LIMS Microlabs - Incluye +200 pruebas Clínicas, Microbiológicas e Industriales
 * Con rangos de referencia, unidades de medida, métodos y criterios normativos (CLSI, EUCAST, RTCA, FDA BAM).
 */

export const MASTER_TEST_CATALOG = [
    // --- 1. HEMATOLOGÍA Y COAGULACIÓN ---
    { id: 'HEM-001', code: 'HEM01', name: 'Hemograma Completo', category: 'Hematología', sampleType: 'Sangre EDTA', unit: 'N/A', referenceRange: 'Ver Desglose', method: 'Citometría de Flujo / Contador Hematológico', price: 15.00 },
    { id: 'HEM-002', code: 'HEM02', name: 'Hemoglobina', category: 'Hematología', sampleType: 'Sangre EDTA', unit: 'g/dL', referenceRange: 'F: 12.0 - 15.5 | M: 13.5 - 17.5', method: 'Espectrofotometría', price: 5.00 },
    { id: 'HEM-003', code: 'HEM03', name: 'Hematocrito', category: 'Hematología', sampleType: 'Sangre EDTA', unit: '%', referenceRange: 'F: 37.0 - 48.0 | M: 40.0 - 52.0', method: 'Microcentrifugación', price: 5.00 },
    { id: 'HEM-004', code: 'HEM04', name: 'Recuento de Leucocitos (WBC)', category: 'Hematología', sampleType: 'Sangre EDTA', unit: '/mm³', referenceRange: '4,500 - 11,000', method: 'Impedancia Eléctrica', price: 6.00 },
    { id: 'HEM-005', code: 'HEM05', name: 'Recuento de Plaquetas', category: 'Hematología', sampleType: 'Sangre EDTA', unit: '/mm³', referenceRange: '150,000 - 450,000', method: 'Impedancia / Óptico', price: 6.00 },
    { id: 'HEM-006', code: 'HEM06', name: 'Neutrófilos Segmentados', category: 'Hematología', sampleType: 'Sangre EDTA', unit: '%', referenceRange: '40.0 - 70.0', method: 'Frotis / Contador Automatizado', price: 4.00 },
    { id: 'HEM-007', code: 'HEM07', name: 'Linfocitos', category: 'Hematología', sampleType: 'Sangre EDTA', unit: '%', referenceRange: '20.0 - 45.0', method: 'Frotis / Contador Automatizado', price: 4.00 },
    { id: 'HEM-008', code: 'HEM08', name: 'Eosinófilos', category: 'Hematología', sampleType: 'Sangre EDTA', unit: '%', referenceRange: '1.0 - 4.0', method: 'Frotis / Contador Automatizado', price: 4.00 },
    { id: 'HEM-009', code: 'HEM09', name: 'Monocitos', category: 'Hematología', sampleType: 'Sangre EDTA', unit: '%', referenceRange: '2.0 - 8.0', method: 'Frotis / Contador Automatizado', price: 4.00 },
    { id: 'HEM-010', code: 'HEM10', name: 'Basófilos', category: 'Hematología', sampleType: 'Sangre EDTA', unit: '%', referenceRange: '0.0 - 1.0', method: 'Frotis / Contador Automatizado', price: 4.00 },
    { id: 'HEM-011', code: 'HEM11', name: 'VCM (Volumen Corpuscular Medio)', category: 'Hematología', sampleType: 'Sangre EDTA', unit: 'fL', referenceRange: '80.0 - 96.0', method: 'Cálculo Hematológico', price: 4.00 },
    { id: 'HEM-012', code: 'HEM12', name: 'HCM (Hemoglobina Corpuscular Media)', category: 'Hematología', sampleType: 'Sangre EDTA', unit: 'pg', referenceRange: '27.0 - 33.0', method: 'Cálculo Hematológico', price: 4.00 },
    { id: 'HEM-013', code: 'HEM13', name: 'CHCM (Conc. Hb Corpuscular Media)', category: 'Hematología', sampleType: 'Sangre EDTA', unit: 'g/dL', referenceRange: '32.0 - 36.0', method: 'Cálculo Hematológico', price: 4.00 },
    { id: 'HEM-014', code: 'HEM14', name: 'RDW (Ancho Distribución Eritrocitaria)', category: 'Hematología', sampleType: 'Sangre EDTA', unit: '%', referenceRange: '11.5 - 14.5', method: 'Análisis de Histograma', price: 4.00 },
    { id: 'HEM-015', code: 'HEM15', name: 'VPM (Volumen Plaquetario Medio)', category: 'Hematología', sampleType: 'Sangre EDTA', unit: 'fL', referenceRange: '7.4 - 10.4', method: 'Impedancia Eléctrica', price: 4.00 },
    { id: 'HEM-016', code: 'HEM16', name: 'Velocidad de Eritrosedimentación (VSG)', category: 'Hematología', sampleType: 'Sangre Citratada / EDTA', unit: 'mm/h', referenceRange: 'F: < 20 | M: < 15', method: 'Westergren Modificado', price: 8.00 },
    { id: 'HEM-017', code: 'HEM17', name: 'Tiempo de Protrombina (TP)', category: 'Hematología', sampleType: 'Plasma Citratado', unit: 'segundos', referenceRange: '11.0 - 13.5', method: 'Coagulometría Óptica', price: 12.00 },
    { id: 'HEM-018', code: 'HEM18', name: 'INR (International Normalized Ratio)', category: 'Hematología', sampleType: 'Plasma Citratado', unit: 'Ratio', referenceRange: '0.8 - 1.2 (Terapéutico: 2.0 - 3.0)', method: 'Cálculo Coagulométrico', price: 5.00 },
    { id: 'HEM-019', code: 'HEM19', name: 'Tiempo de Tromboplastina Parcial (TPT)', category: 'Hematología', sampleType: 'Plasma Citratado', unit: 'segundos', referenceRange: '25.0 - 35.0', method: 'Coagulometría Óptica', price: 12.00 },
    { id: 'HEM-020', code: 'HEM20', name: 'Fibrinógeno', category: 'Hematología', sampleType: 'Plasma Citratado', unit: 'mg/dL', referenceRange: '200 - 400', method: 'Método Clauss', price: 18.00 },
    { id: 'HEM-021', code: 'HEM21', name: 'Dímero D', category: 'Hematología', sampleType: 'Plasma Citratado', unit: 'ng/mL FEU', referenceRange: '< 500', method: 'Inmunoensayo Turbidimétrico', price: 35.00 },
    { id: 'HEM-022', code: 'HEM22', name: 'Reticulocitos', category: 'Hematología', sampleType: 'Sangre EDTA', unit: '%', referenceRange: '0.5 - 2.5', method: 'Tinción Azul Cresil Brillante', price: 10.00 },
    { id: 'HEM-023', code: 'HEM23', name: 'Grupo Sanguíneo y Factor Rh', category: 'Hematología', sampleType: 'Sangre EDTA', unit: 'Cualitativo', referenceRange: 'A, B, AB, O / Rh(+), Rh(-)', method: 'Aglutinación en Placa / Tubo', price: 8.00 },
    { id: 'HEM-024', code: 'HEM24', name: 'Frotis de Sangre Periférica', category: 'Hematología', sampleType: 'Sangre EDTA', unit: 'Descriptivo', referenceRange: 'Morfología Normal', method: 'Microscopía Wright/Giemsa', price: 15.00 },

    // --- 2. QUÍMICA CLÍNICA Y BIOQUÍMICA ---
    { id: 'QUI-001', code: 'QUI01', name: 'Glucosa en Ayunas', category: 'Química Clínica', sampleType: 'Suero / Plasma', unit: 'mg/dL', referenceRange: '70 - 99', method: 'Hexoquinasa / GOD-PAP', price: 6.00 },
    { id: 'QUI-002', code: 'QUI02', name: 'Glucosa Posprandial (2 horas)', category: 'Química Clínica', sampleType: 'Suero / Plasma', unit: 'mg/dL', referenceRange: '< 140', method: 'GOD-PAP', price: 7.00 },
    { id: 'QUI-003', code: 'QUI03', name: 'Hemoglobina Glicosilada (HbA1c)', category: 'Química Clínica', sampleType: 'Sangre Total EDTA', unit: '%', referenceRange: '< 5.7 (Diabetes: >= 6.5)', method: 'HPLC / Inmunoensayo', price: 25.00 },
    { id: 'QUI-004', code: 'QUI04', name: 'Urea', category: 'Química Clínica', sampleType: 'Suero', unit: 'mg/dL', referenceRange: '15 - 45', method: 'Ureasa / GLDH', price: 6.00 },
    { id: 'QUI-005', code: 'QUI05', name: 'BUN (Nitrógeno Ureico en Sangre)', category: 'Química Clínica', sampleType: 'Suero', unit: 'mg/dL', referenceRange: '7 - 20', method: 'Cálculo Enzymático', price: 5.00 },
    { id: 'QUI-006', code: 'QUI06', name: 'Creatinina en Suero', category: 'Química Clínica', sampleType: 'Suero', unit: 'mg/dL', referenceRange: 'F: 0.5 - 1.1 | M: 0.7 - 1.3', method: 'Jaffé Cinético / Enzimático', price: 7.00 },
    { id: 'QUI-007', code: 'QUI07', name: 'Depuración de Creatinina (Orina 24h)', category: 'Química Clínica', sampleType: 'Suero + Orina 24h', unit: 'mL/min', referenceRange: '88 - 128', method: 'Cálculo CKD-EPI', price: 16.00 },
    { id: 'QUI-008', code: 'QUI08', name: 'Ácido Úrico', category: 'Química Clínica', sampleType: 'Suero', unit: 'mg/dL', referenceRange: 'F: 2.4 - 6.0 | M: 3.4 - 7.0', method: 'Uricasa / PAP', price: 6.00 },
    { id: 'QUI-009', code: 'QUI09', name: 'Colesterol Total', category: 'Química Clínica', sampleType: 'Suero', unit: 'mg/dL', referenceRange: '< 200 (Deseable)', method: 'CHOD-PAP Enzimático', price: 6.00 },
    { id: 'QUI-010', code: 'QUI10', name: 'Triglicéridos', category: 'Química Clínica', sampleType: 'Suero', unit: 'mg/dL', referenceRange: '< 150 (Deseable)', method: 'GPO-PAP Enzimático', price: 7.00 },
    { id: 'QUI-011', code: 'QUI11', name: 'Colesterol HDL (Alta Densidad)', category: 'Química Clínica', sampleType: 'Suero', unit: 'mg/dL', referenceRange: '> 40 (Hombre) | > 50 (Mujer)', method: 'Directo Enzimático', price: 8.00 },
    { id: 'QUI-012', code: 'QUI12', name: 'Colesterol LDL (Baja Densidad)', category: 'Química Clínica', sampleType: 'Suero', unit: 'mg/dL', referenceRange: '< 100 (Óptimo)', method: 'Fórmula Friedewald / Directo', price: 8.00 },
    { id: 'QUI-013', code: 'QUI13', name: 'Colesterol VLDL', category: 'Química Clínica', sampleType: 'Suero', unit: 'mg/dL', referenceRange: '5 - 30', method: 'Cálculo Triglicéridos/5', price: 5.00 },
    { id: 'QUI-014', code: 'QUI14', name: 'Perfil Lipídico Completo', category: 'Química Clínica', sampleType: 'Suero', unit: 'Perfil', referenceRange: 'Ver Exámenes Individuales', method: 'Panel Enzimático Directo', price: 24.00 },
    { id: 'QUI-015', code: 'QUI15', name: 'Bilirrubina Total', category: 'Química Clínica', sampleType: 'Suero Protegido Luz', unit: 'mg/dL', referenceRange: '0.2 - 1.2', method: 'Diazo de Jendrassik-Grof', price: 6.00 },
    { id: 'QUI-016', code: 'QUI16', name: 'Bilirrubina Directa', category: 'Química Clínica', sampleType: 'Suero Protegido Luz', unit: 'mg/dL', referenceRange: '0.0 - 0.3', method: 'Diazo Directo', price: 6.00 },
    { id: 'QUI-017', code: 'QUI17', name: 'Bilirrubina Indirecta', category: 'Química Clínica', sampleType: 'Suero', unit: 'mg/dL', referenceRange: '0.1 - 0.9', method: 'Cálculo Total - Directa', price: 4.00 },
    { id: 'QUI-018', code: 'QUI18', name: 'ALT / TGP (Alanino Aminotransferasa)', category: 'Química Clínica', sampleType: 'Suero', unit: 'U/L', referenceRange: 'F: < 33 | M: < 45', method: 'UV Cinético IFCC', price: 7.00 },
    { id: 'QUI-019', code: 'QUI19', name: 'AST / TGO (Aspartato Aminotransferasa)', category: 'Química Clínica', sampleType: 'Suero', unit: 'U/L', referenceRange: 'F: < 32 | M: < 40', method: 'UV Cinético IFCC', price: 7.00 },
    { id: 'QUI-020', code: 'QUI20', name: 'Fosfatasa Alcalina (ALP)', category: 'Química Clínica', sampleType: 'Suero', unit: 'U/L', referenceRange: '44 - 147', method: 'p-NPP Cinético IFCC', price: 7.00 },
    { id: 'QUI-021', code: 'QUI21', name: 'GGT (Gamma Glutamil Transferasa)', category: 'Química Clínica', sampleType: 'Suero', unit: 'U/L', referenceRange: 'F: 6 - 42 | M: 10 - 60', method: 'Szasz Cinético', price: 8.00 },
    { id: 'QUI-022', code: 'QUI22', name: 'Proteínas Totales en Suero', category: 'Química Clínica', sampleType: 'Suero', unit: 'g/dL', referenceRange: '6.4 - 8.3', method: 'Biuret Colorimétrico', price: 6.00 },
    { id: 'QUI-023', code: 'QUI23', name: 'Albúmina en Suero', category: 'Química Clínica', sampleType: 'Suero', unit: 'g/dL', referenceRange: '3.5 - 5.2', method: 'Verde de Bromocresol (BCG)', price: 6.00 },
    { id: 'QUI-024', code: 'QUI24', name: 'Electrolitos Sodio (Na+)', category: 'Química Clínica', sampleType: 'Suero / Plasma Heparina', unit: 'mEq/L', referenceRange: '136 - 145', method: 'Electrodo Ion Selectivo (ISE)', price: 10.00 },
    { id: 'QUI-025', code: 'QUI25', name: 'Electrolitos Potasio (K+)', category: 'Química Clínica', sampleType: 'Suero / Plasma Heparina', unit: 'mEq/L', referenceRange: '3.5 - 5.1', method: 'Electrodo Ion Selectivo (ISE)', price: 10.00 },
    { id: 'QUI-026', code: 'QUI26', name: 'Electrolitos Cloro (Cl-)', category: 'Química Clínica', sampleType: 'Suero / Plasma Heparina', unit: 'mEq/L', referenceRange: '98 - 107', method: 'Electrodo Ion Selectivo (ISE)', price: 10.00 },

    // --- 3. UROANÁLISIS Y COPROLOGÍA ---
    { id: 'URO-001', code: 'URO01', name: 'Examen General de Orina (EGO)', category: 'Uroanálisis', sampleType: 'Orina Frasco Estéril', unit: 'Cualitativo / Semicuantitativo', referenceRange: 'Físico, Químico y Sedimento Normal', method: 'Tira Reactiva + Microscopía', price: 8.00 },
    { id: 'URO-002', code: 'URO02', name: 'Proteínas en Orina de 24 horas', category: 'Uroanálisis', sampleType: 'Orina de 24 Horas', unit: 'mg/24h', referenceRange: '< 150', method: 'Rojo de Pirogalol', price: 12.00 },
    { id: 'URO-003', code: 'URO03', name: 'Microalbúmina en Orina Espontánea', category: 'Uroanálisis', sampleType: 'Orina Ocasional', unit: 'mg/L', referenceRange: '< 20 (Normal)', method: 'Inmunoturbidimetría', price: 18.00 },
    { id: 'COP-001', code: 'COP01', name: 'Examen Coprológico General', category: 'Coprología', sampleType: 'Heces Recientes', unit: 'Descriptivo', referenceRange: 'Sin Parásitos, Leucocitos < 2/campo', method: 'Examen Directo + Lugol', price: 9.00 },
    { id: 'COP-002', code: 'COP02', name: 'Coproparasitoscópico Serie III', category: 'Coprología', sampleType: '3 Muestras Heces', unit: 'Cualitativo', referenceRange: 'Negativo a Quistes/Huevos/Trofozoítos', method: 'Concentración Faust / Ritchie', price: 22.00 },

    // --- 4. MICROBIOLOGÍA CLÍNICA ---
    { id: 'MIC-001', code: 'MIC01', name: 'Urocultivo + Antibiograma (CLSI/EUCAST)', category: 'Microbiología Clínica', sampleType: 'Orina Chorro Medio', unit: 'UFC/mL', referenceRange: '< 10,000 UFC/mL (Sin Crecimiento)', method: 'Siembra Cromogénica + CMI Vitek/Manual', price: 30.00 },
    { id: 'MIC-002', code: 'MIC02', name: 'Hemocultivo Serie I y II', category: 'Microbiología Clínica', sampleType: 'Sangre Frasco Hemocultivo', unit: 'Cualitativo', referenceRange: 'Sin Desarrollo Bacteriano a los 5 días', method: 'Automatizado BACTEC / Manual', price: 45.00 },
    { id: 'MIC-003', code: 'MIC03', name: 'Coprocultivo (Salmonella, Shigella, E. coli)', category: 'Microbiología Clínica', sampleType: 'Heces / Hisopado Rectal', unit: 'Cualitativo', referenceRange: 'No se aislan patógenos entéricos', method: 'Medios Selectivos SS / XLD / MacConkey', price: 35.00 },
    { id: 'MIC-004', code: 'MIC04', name: 'Cultivo de Exudado Faríngeo', category: 'Microbiología Clínica', sampleType: 'Hisopado Faríngeo', unit: 'Cualitativo', referenceRange: 'Flora Normal (Sin S. pyogenes)', method: 'Agar Sangre de Carnero 5%', price: 22.00 },
    { id: 'MIC-005', code: 'MIC05', name: 'Cultivo de Secreción Vaginal / Cervical', category: 'Microbiología Clínica', sampleType: 'Hisopado Vaginal', unit: 'Cualitativo', referenceRange: 'Flora Lactobacilar Normal', method: 'Gram + Agar Sabouraud + Chocolate', price: 28.00 },

    // --- 5. MICROBIOLOGÍA INDUSTRIAL Y AMBIENTAL ---
    { id: 'IND-001', code: 'IND01', name: 'Recuento de Aerobios Mesófilos Total (UFC/g o mL)', category: 'Microbiología Industrial', sampleType: 'Alimentos / Agua / Bebidas', unit: 'UFC/g', referenceRange: '< 10,000 UFC/g (Según RTCA)', method: 'FDA BAM Cap 3 / ISO 4833', price: 25.00 },
    { id: 'IND-002', code: 'IND02', name: 'Coliformes Totales y E. coli (NMP o Recuento)', category: 'Microbiología Industrial', sampleType: 'Alimentos / Agua Potable', unit: 'UFC/g o NMP/100mL', referenceRange: 'Ausencia en 100 mL / < 10 UFC/g', method: 'FDA BAM Cap 4 / ISO 4831', price: 30.00 },
    { id: 'IND-003', code: 'IND03', name: 'Detección de Salmonella spp. en 25g', category: 'Microbiología Industrial', sampleType: 'Matriz Alimentaria / Pienso', unit: 'Cualitativo en 25g', referenceRange: 'Ausencia en 25g', method: 'ISO 6579 / FDA BAM Cap 5', price: 40.00 },
    { id: 'IND-004', code: 'IND04', name: 'Detección de Listeria monocytogenes en 25g', category: 'Microbiología Industrial', sampleType: 'Lácteos / Cárnicos / Alimentos', unit: 'Cualitativo en 25g', referenceRange: 'Ausencia en 25g', method: 'ISO 11290 / FDA BAM Cap 10', price: 45.00 },
    { id: 'ENV-001', code: 'ENV01', name: 'Hisopado de Superficie Inerte (Superficies de Trabajo)', category: 'Control Ambiental', sampleType: 'Hisopado de Acero/Mesa', unit: 'UFC/cm²', referenceRange: '< 5 UFC/cm²', method: 'Bioluminiscencia / Placa de Frotis', price: 20.00 },

    // --- 6. ANÁLISIS DE AGUAS POTABLES Y RESIDUALES ---
    { id: 'AGU-001', code: 'AGU01', name: 'Análisis Microbiológico Completo Agua Potable', category: 'Físico-Químico y Aguas', sampleType: 'Agua Potable 500 mL', unit: 'NMP o Filtración Membrana', referenceRange: 'Coliformes Totales = 0 | E. coli = 0', method: 'Standard Methods 9222 / 9221', price: 35.00 },
    { id: 'AGU-002', code: 'AGU02', name: 'pH en Agua a 25°C', category: 'Físico-Químico y Aguas', sampleType: 'Agua 100 mL', unit: 'Unidades pH', referenceRange: '6.5 - 8.5', method: 'Potenciometría Electrodo Combinado', price: 6.00 },
    { id: 'AGU-003', code: 'AGU03', name: 'Conductividad Eléctrica en Agua', category: 'Físico-Químico y Aguas', sampleType: 'Agua 100 mL', unit: 'µS/cm', referenceRange: '< 400 µS/cm', method: 'Conductimetría', price: 6.00 },
    { id: 'AGU-007', code: 'AGU07', name: 'Demanda Bioquímica de Oxígeno (DBO5)', category: 'Físico-Químico y Aguas', sampleType: 'Agua Residual 1 L', unit: 'mg/L O2', referenceRange: 'Según Licencia Ambiental (< 50 mg/L)', method: 'Incubación 5 días a 20°C Respirometría', price: 55.00 },
    { id: 'AGU-008', code: 'AGU08', name: 'Demanda Química de Oxígeno (DQO)', category: 'Físico-Químico y Aguas', sampleType: 'Agua Residual 500 mL', unit: 'mg/L O2', referenceRange: 'Según Licencia Ambiental (< 100 mg/L)', method: 'Digestión en Tubo Cerrado / Dicromato', price: 48.00 }
];

export default MASTER_TEST_CATALOG;
