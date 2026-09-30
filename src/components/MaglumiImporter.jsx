import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, Upload, Cpu, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export const MaglumiImporter = ({ onImport, onClose }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [parsedData, setParsedData] = useState([]);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) processFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) processFile(selectedFile);
    };

    const processFile = async (fileToProcess) => {
        setFile(fileToProcess);
        setError(null);

        try {
            const dataBuffer = await fileToProcess.arrayBuffer();
            const workbook = XLSX.read(dataBuffer, { type: 'array' });

            // Maglumi X3 suele exportar datos en sheet2 o sheet1
            let targetSheetName = workbook.SheetNames[0];
            if (workbook.SheetNames.length > 1 && workbook.SheetNames[1].toLowerCase().includes('sheet2')) {
                targetSheetName = workbook.SheetNames[1];
            }

            const worksheet = workbook.Sheets[targetSheetName];
            const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (!rawRows || rawRows.length === 0) {
                throw new Error("El archivo de Maglumi X3 no contiene datos legibles.");
            }

            const results = [];
            // Recorremos las filas para detectar estructura Maglumi
            // Estructura típica: Sample ID en col 0, Test en col 1, RLU, Conc, Unit, Flag
            for (let i = 0; i < rawRows.length; i++) {
                const row = rawRows[i];
                if (!row || row.length < 2) continue;

                const firstCol = String(row[0] || '').trim();
                const secondCol = String(row[1] || '').trim();

                // Saltar cabeceras conocidas
                if (firstCol.toLowerCase().includes('sample') || firstCol.toLowerCase().includes('dil') || firstCol.toLowerCase().includes('id') && secondCol.toLowerCase().includes('test')) {
                    continue;
                }

                // Identificar muestra y analito
                if (firstCol && secondCol && !firstCol.startsWith('Mean:') && !firstCol.startsWith('SD:')) {
                    const sampleId = firstCol;
                    const testName = secondCol;
                    
                    // Buscar valor numérico de concentración en las columnas siguientes
                    let conc = null;
                    let unit = '';
                    let rlu = null;
                    let flag = '';

                    for (let c = 2; c < row.length; c++) {
                        const cellVal = row[c];
                        if (typeof cellVal === 'number') {
                            if (rlu === null && cellVal > 1000) {
                                rlu = cellVal;
                            } else if (conc === null) {
                                conc = cellVal;
                            }
                        } else if (typeof cellVal === 'string') {
                            const str = cellVal.trim();
                            if (str.includes('/') || str.includes('IU') || str.includes('mIU') || str.includes('ng') || str.includes('pg') || str.includes('AU')) {
                                unit = str;
                            } else if (str === '>' || str === '<' || str.includes(';')) {
                                flag = str;
                            } else if (!isNaN(parseFloat(str)) && conc === null) {
                                conc = parseFloat(str);
                            }
                        }
                    }

                    if (conc !== null || rlu !== null) {
                        results.push({
                            id: `maglumi-${Date.now()}-${i}`,
                            equipment: 'Snibe Maglumi X3',
                            barcode: sampleId,
                            tests: [testName],
                            timestamp: 'Maglumi Export',
                            status: 'pending',
                            rawData: {
                                [testName]: conc !== null ? conc : rlu,
                                'Concentration': conc,
                                'RLU': rlu,
                                'Unit': unit,
                                'Flag': flag
                            }
                        });
                    }
                }
            }

            if (results.length === 0) {
                throw new Error("No se detectaron muestras con resultados en el archivo. Verifique el formato Maglumi X3 / 600.");
            }

            setParsedData(results);
        } catch (err) {
            console.error("Error al procesar archivo Maglumi:", err);
            setError(err.message || "Error al interpretar el archivo de Maglumi X3.");
        }
    };

    const handleConfirmImport = () => {
        if (parsedData.length > 0 && onImport) {
            onImport(parsedData);
            setParsedData([]);
            setFile(null);
            if (onClose) onClose();
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Cpu size={20} />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-800 text-sm">
                            Importador Automatizado SNIBE Maglumi X3 / 600
                        </h3>
                        <p className="text-xs text-slate-500">
                            Cargue archivos exportados (.xlsx, .xls) con concentraciones hormonales, quimioluminiscencia y RLUs.
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button 
                        type="button" 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-sm p-1 cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {/* Zona de arrastrar y soltar */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging 
                        ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]' 
                        : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-indigo-100/60 text-indigo-700 rounded-full">
                        <UploadCloud size={28} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-700 text-sm">
                            {file ? file.name : "Haga clic para seleccionar o arrastre el archivo de Maglumi X3 aquí"}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Soporta archivos Excel (.xlsx, .xls) generados por el analizador
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                    <AlertTriangle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {parsedData.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <CheckCircle2 size={16} className="text-emerald-600" />
                            Se detectaron {parsedData.length} resultados listos para inyección:
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                            Equipo: Snibe Maglumi X3 / 600
                        </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y text-xs">
                        {parsedData.map((item, idx) => (
                            <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                                <div>
                                    <span className="font-mono font-bold text-slate-900">{item.barcode}</span>
                                    <span className="mx-2 text-slate-300">|</span>
                                    <span className="font-semibold text-indigo-600">{item.tests[0]}</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono">
                                    <span className="font-bold text-slate-800">
                                        {item.rawData.Concentration !== null ? item.rawData.Concentration : item.rawData.RLU}
                                    </span>
                                    <span className="text-[10px] text-slate-500">{item.rawData.Unit}</span>
                                    {item.rawData.Flag && (
                                        <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded font-bold">
                                            {item.rawData.Flag}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => { setParsedData([]); setFile(null); }}
                            className="px-4 py-2 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmImport}
                            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                            <Upload size={14} />
                            <span>Inyectar {parsedData.length} Resultados al LIMS</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
