import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Upload } from 'lucide-react';

export const FlashAndGoImporter = ({ onImport }) => {
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

    const processFile = (file) => {
        setFile(file);
        setError(null);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split('\n');
                const results = [];
                
                // Ignoramos la cabecera, asumiendo estructura: SampleID,Dilution,Count,ResultUFC
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const [sampleId, dilution, count, resultUfc] = line.split(',');
                    
                    if (sampleId) {
                        results.push({
                            id: `flashgo-${Date.now()}-${i}`,
                            equipment: 'IUL Flash & Go',
                            barcode: sampleId.trim(),
                            tests: ['Recuento UFC'],
                            timestamp: 'Recién importado',
                            status: 'pending',
                            rawData: {
                                'UFC': resultUfc ? parseFloat(resultUfc.trim()) : 0,
                                'Dilution': dilution ? dilution.trim() : '0',
                                'Count': count ? parseFloat(count.trim()) : 0
                            }
                        });
                    }
                }
                
                if (results.length === 0) {
                    setError("El archivo parece estar vacío o no tiene el formato correcto.");
                } else {
                    setParsedData(results);
                }
            } catch {
                setError("Error procesando el archivo CSV. Asegúrese de que provenga del equipo Flash & Go.");
            }
        };
        reader.readAsText(file);
    };

    const handleConfirmImport = () => {
        if (onImport && parsedData.length > 0) {
            onImport(parsedData);
            setFile(null);
            setParsedData([]);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                <div className="bg-indigo-100 text-indigo-700 p-2 rounded-lg">
                    <UploadCloud size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Importador IUL Flash & Go</h3>
                    <p className="text-slate-500 text-sm">Arrastre el archivo CSV/TXT exportado por el contador automático.</p>
                </div>
            </div>

            {!file ? (
                <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
                        isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".csv,.txt"
                        onChange={handleFileSelect}
                    />
                    <Upload size={32} className={`mx-auto mb-3 ${isDragging ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <p className="font-bold text-slate-700">Arrastre su archivo aquí o haga clic para explorar</p>
                    <p className="text-sm text-slate-500 mt-1">Soporta archivos CSV de exportación estándar Flash&Go</p>
                </div>
            ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                            <FileText size={24} className="text-indigo-600" />
                            <div>
                                <p className="font-bold text-slate-800">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setFile(null); setParsedData([]); setError(null); }}
                            className="text-slate-400 hover:text-red-500 transition-colors text-sm font-bold"
                        >
                            Cancelar
                        </button>
                    </div>

                    {error ? (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
                            <AlertTriangle size={18} /> {error}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
                                <CheckCircle2 size={18} /> {parsedData.length} resultados listos para importar al buzón
                            </div>
                            
                            <button 
                                onClick={handleConfirmImport}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                <UploadCloud size={18} /> Enviar al Buzón de Analizadores
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
