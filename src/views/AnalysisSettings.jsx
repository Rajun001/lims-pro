import React, { useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { collection, addDoc, doc, deleteDoc } from 'firebase/firestore';
import { FormInput, RestrictedAccess } from '../components/UI';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';

export const AnalysisSettings = ({ db, analyses, userRole, user, navigateTo }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [analysis, setAnalysis] = useState({ name: '', code: '', type: 'clinical', unit: '', equipmentMappings: [], minRange: '', maxRange: '' });
    const [newEqName, setNewEqName] = useState('');
    const [newEqCode, setNewEqCode] = useState('');
    const { addNotification } = useNotification();

    if (userRole !== 'admin') {
        return <RestrictedAccess navigateTo={navigateTo} />;
    }

    const handleDeleteAnalysis = async (id, name) => {
        if (window.confirm(`¿Está seguro de eliminar este Análisis (${name}) del catálogo? Las órdenes pasadas que lo contengan no se verán afectadas, pero no podrá volver a seleccionarse en nuevas órdenes.`)) {
            try {
                await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/analyses`, id));
                await logAuditAction(db, user?.uid, 'ELIMINAR_ANALISIS', `Análisis eliminado del catálogo: ${name}`, id);
                addNotification('Análisis eliminado exitosamente.', 'success');
            } catch (error) {
                console.error("Error al eliminar análisis:", error);
                addNotification('Error al eliminar el análisis.', 'error');
            }
        }
    };

    const handleAddEquipment = () => {
        if (newEqName && newEqCode) {
            setAnalysis({
                ...analysis,
                equipmentMappings: [...analysis.equipmentMappings, { equipment: newEqName, code: newEqCode }]
            });
            setNewEqName('');
            setNewEqCode('');
        }
    };

    const handleRemoveEquipment = (index) => {
        const newMappings = [...analysis.equipmentMappings];
        newMappings.splice(index, 1);
        setAnalysis({ ...analysis, equipmentMappings: newMappings });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/analyses`), analysis);
            await logAuditAction(db, user?.uid, 'CREAR_ANALISIS', `Análisis creado: ${analysis.name} (${analysis.code})`, docRef.id);
            addNotification('Análisis registrado exitosamente.', 'success');
            setIsEditing(false);
            setAnalysis({ name: '', code: '', type: 'clinical', unit: '', equipmentMappings: [], minRange: '', maxRange: '' });
        } catch (error) {
            console.error("Error al registrar análisis:", error);
            addNotification('Error al registrar el análisis. Inténtelo de nuevo.', 'error');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex justify-between items-center"><h2 className="text-2xl font-extrabold text-slate-800">Directorio de Análisis (QC)</h2>
                <div className="flex gap-2"><button onClick={() => navigateTo('dashboard')} className="text-slate-500 hover:text-indigo-600 mr-2 font-bold">Volver</button><button onClick={() => setIsEditing(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm hover:bg-indigo-700 transition-colors"><PlusCircle size={18} /> Nuevo Análisis</button></div></div>
            {isEditing && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-4">
                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput label="Nombre de la Prueba" value={analysis.name} onChange={e => setAnalysis({ ...analysis, name: e.target.value })} required placeholder="Ej. Glucosa Sanguínea" />
                            <FormInput label="Código LIMS" value={analysis.code} onChange={e => setAnalysis({ ...analysis, code: e.target.value })} required placeholder="Ej. GLU-001" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="block text-sm font-bold text-slate-700">Tipo de Muestra</label>
                                <select value={analysis.type} onChange={e => setAnalysis({ ...analysis, type: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"><option value="clinical">Clínico</option><option value="industrial">Industrial</option></select>
                            </div>
                            <FormInput label="Unidad de Medida" value={analysis.unit || ''} onChange={e => setAnalysis({ ...analysis, unit: e.target.value })} placeholder="Ej. mg/dL" />
                            <FormInput label="Rango Mínimo (Referencia)" type="number" value={analysis.minRange} onChange={e => setAnalysis({ ...analysis, minRange: e.target.value })} placeholder="Ej. 70" />
                            <FormInput label="Rango Máximo (Referencia)" type="number" value={analysis.maxRange} onChange={e => setAnalysis({ ...analysis, maxRange: e.target.value })} placeholder="Ej. 100" />
                        </div>
                        
                        {/* Equipment Mapping Section */}
                        <div className="border-t pt-4 mt-4">
                            <h4 className="text-sm font-bold text-slate-700 mb-2">Mapeo de Analizadores (HL7)</h4>
                            <div className="flex gap-2 mb-3">
                                <input type="text" placeholder="Equipo (Ej. Fuji NX6000)" className="flex-1 px-3 py-2 border rounded-lg text-sm" value={newEqName} onChange={e => setNewEqName(e.target.value)} />
                                <input type="text" placeholder="Cód. Equipo (Ej. GLU-03)" className="flex-1 px-3 py-2 border rounded-lg text-sm" value={newEqCode} onChange={e => setNewEqCode(e.target.value)} />
                                <button type="button" onClick={handleAddEquipment} className="px-3 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold">Agregar</button>
                            </div>
                            {analysis.equipmentMappings.length > 0 && (
                                <ul className="space-y-1 mb-4">
                                    {analysis.equipmentMappings.map((eq, i) => (
                                        <li key={i} className="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-md text-sm border border-slate-100">
                                            <span><strong>{eq.equipment}:</strong> {eq.code}</span>
                                            <button type="button" onClick={() => handleRemoveEquipment(i)} className="text-red-500 font-bold hover:text-red-700">X</button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Guardar</button></div>
                    </form>
                </div>
            )}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Nombre</th><th className="p-4">Código LIMS</th><th className="p-4">Rangos Normales</th><th className="p-4">Mapeo Equipos</th><th className="p-4"></th></tr></thead>
                    <tbody className="divide-y">{analyses.map(a => (
                        <tr key={a.id}>
                            <td className="p-4 font-medium">{a.name}</td>
                            <td className="p-4 font-mono text-blue-600 font-bold">{a.code}</td>
                            <td className="p-4 text-slate-600">
                                {a.minRange && a.maxRange ? `[${a.minRange} - ${a.maxRange}] ${a.unit || ''}` : <span className="text-slate-400 text-xs italic">N/A</span>}
                            </td>
                            <td className="p-4">
                                {a.equipmentMappings?.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {a.equipmentMappings.map((eq, i) => (
                                            <span key={i} className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded font-mono">
                                                {eq.equipment}: <strong>{eq.code}</strong>
                                            </span>
                                        ))}
                                    </div>
                                ) : <span className="text-slate-400 text-xs italic">Sin mapeo</span>}
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => handleDeleteAnalysis(a.id, a.name)} 
                                    className="text-slate-300 hover:text-red-500 transition-colors p-1" 
                                    title="Eliminar Análisis"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );
};
