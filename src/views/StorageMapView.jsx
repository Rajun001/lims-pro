import React, { useState, useEffect } from 'react';
import { Snowflake, Package, Save, Inbox, Search } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { useNotification } from '../contexts/NotificationContext';
import { logAuditAction } from '../utils/audit';

export const StorageMapView = ({ db, user, requests }) => {
    const [selectedBox, setSelectedBox] = useState('box_1');
    const [boxName, setBoxName] = useState('Freezer 1 - Rack A - Caja 1');
    const [positions, setPositions] = useState(Array(25).fill(null));
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const { addNotification } = useNotification();

    // Load from Firestore
    useEffect(() => {
        if (!db) return;
        const unsub = onSnapshot(doc(db, `artifacts/${LIMSSystemId}/public/data/biobank`, selectedBox), (docSnap) => {
            if (docSnap.exists()) {
                setPositions(docSnap.data().positions || Array(25).fill(null));
            } else {
                // Initial mock state if not exists
                const initial = Array(25).fill(null);
                if (requests && requests.length > 0) {
                    initial[2] = { id: requests[0].id, type: requests[0].sampleType || 'Clínico' };
                    if (requests.length > 1) {
                        initial[5] = { id: requests[1].id, type: requests[1].sampleType || 'Agua' };
                    }
                }
                setPositions(initial);
            }
        });
        return () => unsub();
    }, [db, selectedBox, requests]);

    const handleAssign = (index) => {
        if (positions[index]) {
            if (window.confirm('¿Desea retirar esta muestra de la posición?')) {
                const newPos = [...positions];
                newPos[index] = null;
                setPositions(newPos);
            }
            return;
        }

        const sampleId = prompt('Escanee o ingrese el ID de la Muestra (Ej. MC-2026-001):');
        if (sampleId) {
            // Check if exists in requests to get type
            const foundReq = requests?.find(r => r.id.toLowerCase().includes(sampleId.toLowerCase()));
            const type = foundReq ? (foundReq.sampleType || 'Clínico') : 'Clínico';

            const newPos = [...positions];
            newPos[index] = { id: sampleId.toUpperCase(), type };
            setPositions(newPos);
        }
    };

    const handleSave = async () => {
        if (!db) return;
        setIsSaving(true);
        try {
            await setDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/biobank`, selectedBox), {
                positions,
                name: boxName,
                updatedAt: new Date()
            }, { merge: true });
            
            await logAuditAction(db, user?.uid, 'GUARDAR_BIOBANCO', `Actualizó caja de biobanco: ${boxName}`);
            addNotification("Mapa físico guardado exitosamente.", "success");
        } catch (error) {
            console.error("Error saving biobank:", error);
            addNotification("Error al guardar en el biobanco.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            setSearchResult(null);
            return;
        }
        
        const index = positions.findIndex(p => p && p.id.toLowerCase().includes(query));
        if (index !== -1) {
            const row = String.fromCharCode(65 + Math.floor(index / 5));
            const col = (index % 5) + 1;
            setSearchResult({ found: true, message: `Muestra encontrada en ${boxName}, Posición: ${row}${col}` });
        } else {
            setSearchResult({ found: false, message: 'La muestra no se encuentra en la caja actual.' });
        }
    };

    const getSampleColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'clínico': return 'bg-indigo-500 border-indigo-600';
            case 'agua': return 'bg-cyan-500 border-cyan-600';
            case 'alimento': return 'bg-amber-500 border-amber-600';
            case 'hisopado': return 'bg-pink-500 border-pink-600';
            default: return 'bg-slate-500 border-slate-600';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <Snowflake className="text-cyan-600" /> Módulo de Biobanco (Freezers)
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión gráfica y trazabilidad de muestras criogenizadas o almacenadas.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <form onSubmit={handleSearch} className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar muestra por ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                        />
                        <button type="submit" className="hidden">Buscar</button>
                    </form>
                    {searchResult && (
                        <div className={`text-sm font-bold px-4 py-2 rounded-lg ${searchResult.found ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {searchResult.message}
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Panel Lateral - Jerarquía */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Inbox size={18} /> Estructura</h3>
                    <div className="space-y-2 text-sm">
                        <div className="font-bold text-cyan-700 bg-cyan-50 p-2 rounded-lg border border-cyan-100 flex items-center gap-2">
                            <Snowflake size={16}/> Freezer 1 (-80°C)
                        </div>
                        <div className="ml-4 border-l-2 border-slate-200 pl-4 space-y-2">
                            <div className="font-bold text-slate-700">Rack A</div>
                            <div className="ml-4 space-y-1">
                                <button onClick={() => { setSelectedBox('box_1'); setBoxName('Freezer 1 - Rack A - Caja 1'); }} className={`w-full text-left p-2 rounded text-xs transition-colors font-bold ${selectedBox === 'box_1' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>Caja 1 {selectedBox === 'box_1' && '(Actual)'}</button>
                                <button onClick={() => { setSelectedBox('box_2'); setBoxName('Freezer 1 - Rack A - Caja 2'); }} className={`w-full text-left p-2 rounded text-xs transition-colors font-bold ${selectedBox === 'box_2' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'text-slate-600 hover:bg-slate-50 border border-transparent'}`}>Caja 2 {selectedBox === 'box_2' && '(Actual)'}</button>
                            </div>
                            <div className="font-bold text-slate-700 mt-2">Rack B</div>
                        </div>
                        <div className="font-bold text-slate-600 p-2 flex items-center gap-2 mt-4">
                            <Snowflake size={16}/> Cámara Fría (2-8°C)
                        </div>
                    </div>
                </div>

                {/* Cuadrícula Visual */}
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <div className="w-full flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-slate-800">{boxName}</h3>
                        <div className="flex gap-4 text-xs font-bold text-slate-500">
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-100 border border-slate-300 rounded-sm"></div> Vacío</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> Clínico</span>
                            <span className="flex items-center gap-1"><div className="w-3 h-3 bg-cyan-500 rounded-sm"></div> Ambiental</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3 sm:gap-4 mb-8 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-inner w-full max-w-2xl relative">
                        {positions.map((pos, i) => {
                            const row = String.fromCharCode(65 + Math.floor(i / 5)); // A, B, C, D, E
                            const col = (i % 5) + 1;
                            const isOccupied = pos !== null;
                            const isHighlighted = searchResult?.found && pos?.id.toLowerCase().includes(searchQuery.trim().toLowerCase());

                            return (
                                <button 
                                    key={i} 
                                    onClick={() => handleAssign(i)}
                                    className={`relative aspect-square rounded-full sm:rounded-xl border-2 flex flex-col items-center justify-center transition-all group ${
                                        isOccupied 
                                        ? `${getSampleColor(pos.type)} text-white shadow-md hover:opacity-80` 
                                        : 'bg-white border-dashed border-slate-300 text-slate-400 hover:border-cyan-400 hover:bg-cyan-50 hover:text-cyan-600'
                                    } ${isHighlighted ? 'ring-4 ring-yellow-400 scale-110 z-10' : ''}`}
                                    title={isOccupied ? `Muestra: ${pos.id} | Tipo: ${pos.type}` : 'Posición Vacía'}
                                >
                                    <span className={`text-[10px] sm:text-xs font-black absolute top-1 sm:top-2 left-2 ${isOccupied ? 'text-white/60' : 'text-slate-300 group-hover:text-cyan-300'}`}>
                                        {row}{col}
                                    </span>
                                    {isOccupied ? (
                                        <>
                                            <Package size={24} className="mb-1 hidden sm:block opacity-90" />
                                            <span className="text-[10px] sm:text-xs font-bold truncate w-full px-1 sm:px-2 text-center drop-shadow-md">{pos.id.substring(0,8)}</span>
                                        </>
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-cyan-300 transition-colors"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="w-full flex justify-end">
                        <button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50">
                            <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Mapa Físico'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
