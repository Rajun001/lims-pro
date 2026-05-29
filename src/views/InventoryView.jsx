import React, { useState, useEffect } from 'react';
import { Package, PlusCircle, AlertTriangle, Megaphone, Trash2, ShieldAlert, CheckCircle2, Download } from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { FormInput } from '../components/UI';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';
import { exportToCSV } from '../utils/exportUtils';

export const InventoryView = ({ db, user, navigateTo }) => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', lot: '', expiration: '', quantity: 1, unit: 'Unidades' });
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    useEffect(() => {
        const unsub = onSnapshot(collection(db, `artifacts/${LIMSSystemId}/public/data/inventory`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Order by expiration ascending (expiring sooner at the top)
            data.sort((a, b) => new Date(a.expiration) - new Date(b.expiration));
            setItems(data);
        });
        return () => unsub();
    }, [db]);

    const calculateStatus = (expirationDateStr) => {
        if (!expirationDateStr) return { status: 'Activo', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 size={14} /> };
        
        const expDate = new Date(expirationDateStr);
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        if (expDate < today) {
            return { status: 'Vencido', color: 'bg-red-100 text-red-700 border-red-200', icon: <ShieldAlert size={14} /> };
        } else if (expDate <= thirtyDaysFromNow) {
            return { status: 'Por Vencer', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertTriangle size={14} /> };
        }
        return { status: 'Activo', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 size={14} /> };
    };

    const addItem = async (e) => {
        e.preventDefault();
        if (!newItem.name || !newItem.lot || !newItem.expiration) return;
        setIsSaving(true);
        try {
            const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/inventory`), { 
                name: newItem.name, 
                lot: newItem.lot, 
                expiration: newItem.expiration,
                quantity: parseFloat(newItem.quantity) || 1,
                unit: newItem.unit || 'Unidades',
                createdAt: serverTimestamp() 
            });
            await logAuditAction(db, user?.uid, 'AGREGAR_INVENTARIO', `Reactivo agregado: ${newItem.name} (Lote: ${newItem.lot})`, docRef.id);
            addNotification('Insumo registrado exitosamente.', 'success');
            setNewItem({ name: '', lot: '', expiration: '', quantity: 1, unit: 'Unidades' });
        } catch (error) {
            console.error("Error adding inventory item:", error);
            addNotification('Error al agregar el insumo al inventario.', 'error');
        }
        setIsSaving(false);
    };

    const deleteItem = async (id) => {
        const itemToDelete = items.find(item => item.id === id);
        if (!itemToDelete) return;
        
        let confirmMsg = `¿Seguro que deseas eliminar este reactivo/insumo (${itemToDelete.name}) del inventario?`;
        
        if (itemToDelete.quantity && itemToDelete.quantity > 0) {
            confirmMsg = `Este insumo (${itemToDelete.name}) aún tiene existencias (Stock: ${itemToDelete.quantity} ${itemToDelete.unit || 'Unidades'}). ¿Está completamente seguro de eliminarlo del sistema de forma irreversible?`;
        }

        if (window.confirm(confirmMsg)) {
            try {
                await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/inventory`, id));
                await logAuditAction(db, user?.uid, 'ELIMINAR_INVENTARIO', `Reactivo eliminado: ${itemToDelete.name} (Lote: ${itemToDelete.lot || 'N/A'})`, id);
                addNotification('Insumo eliminado del inventario exitosamente.', 'success');
            } catch (error) {
                console.error("Error deleting inventory item:", error);
                addNotification('Error al eliminar el insumo del inventario.', 'error');
            }
        }
    };

    const handleCreateCampaign = (itemName) => {
        alert(`Iniciando Campaña Promocional (20% OFF) en CRM para análisis que usan: ${itemName}`);
        navigateTo('crm');
    };

    const handleExportCSV = () => {
        if (!items.length) {
            addNotification('No hay datos para exportar', 'warning');
            return;
        }
        const exportData = items.map(item => {
            const { status } = calculateStatus(item.expiration);
            return {
                ID: item.id,
                Reactivo: item.name,
                Cantidad: `${item.quantity || 1} ${item.unit || 'Unidades'}`,
                Lote: item.lot,
                Vencimiento: item.expiration ? new Date(item.expiration).toLocaleDateString() : 'N/A',
                Estado: status
            };
        });
        exportToCSV(exportData, `Inventario_LIMS_${new Date().toISOString().slice(0,10)}`);
        addNotification('Inventario exportado a CSV exitosamente.', 'success');
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Package className="text-emerald-600" /> Inventario y Reactivos</h2>
                    <p className="text-slate-500 text-sm mt-1">Control inteligente de lotes, existencias y caducidades cruzadas con CRM.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PlusCircle size={18} className="text-emerald-600" /> Registrar Insumo</h3>
                    <form onSubmit={addItem} className="space-y-4">
                        <FormInput label="Nombre del Reactivo" name="name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} required placeholder="Ej. Ácido Sulfúrico" />
                        <div className="grid grid-cols-2 gap-2">
                            <FormInput type="number" label="Cantidad" name="quantity" value={newItem.quantity} onChange={e => setNewItem({ ...newItem, quantity: e.target.value })} required />
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Unidad</label>
                                <select 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                                    value={newItem.unit} onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                >
                                    <option value="Unidades">Unidades (Kits)</option>
                                    <option value="ml">Mililitros (ml)</option>
                                    <option value="g">Gramos (g)</option>
                                </select>
                            </div>
                        </div>
                        <FormInput label="Número de Lote" name="lot" value={newItem.lot} onChange={e => setNewItem({ ...newItem, lot: e.target.value })} required placeholder="Ej. LT-2026-001" />
                        <FormInput type="date" label="Fecha de Vencimiento" name="expiration" value={newItem.expiration} onChange={e => setNewItem({ ...newItem, expiration: e.target.value })} required />
                        
                        <button type="submit" disabled={isSaving} className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 mt-2">
                            {isSaving ? 'Guardando...' : 'Agregar al Inventario'}
                        </button>
                    </form>
                </div>
                
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                        <h3 className="font-bold text-slate-800">Existencias Actuales ({items.length})</h3>
                        <button onClick={handleExportCSV} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-bold flex items-center gap-2 transition-colors border border-indigo-200">
                            <Download size={16} /> Exportar CSV
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-white border-b border-slate-100 text-slate-500 sticky top-0 shadow-sm z-10">
                                <tr>
                                    <th className="p-4 font-bold">Reactivo / Insumo</th>
                                    <th className="p-4 font-bold">Stock</th>
                                    <th className="p-4 font-bold">Lote</th>
                                    <th className="p-4 font-bold">Vencimiento</th>
                                    <th className="p-4 font-bold">Estado</th>
                                    <th className="p-4 font-bold">Acciones / Promoción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.length > 0 ? items.map(item => {
                                    const { status, color, icon } = calculateStatus(item.expiration);
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                            <td className="p-4 text-emerald-700 font-bold bg-emerald-50/50 rounded-lg">
                                                {item.quantity || 1} <span className="text-xs text-slate-500 font-normal">{item.unit || 'Unidades'}</span>
                                            </td>
                                            <td className="p-4 font-mono text-slate-600">{item.lot}</td>
                                            <td className="p-4 text-slate-600 font-medium">{item.expiration ? new Date(item.expiration).toLocaleDateString() : 'N/A'}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center w-fit gap-1.5 ${color}`}>
                                                    {icon} {status}
                                                </span>
                                            </td>
                                            <td className="p-4 flex gap-2">
                                                {status === 'Por Vencer' && (
                                                    <button
                                                        onClick={() => handleCreateCampaign(item.name)}
                                                        className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-indigo-200 hover:border-transparent shadow-sm"
                                                        title="Crear campaña para agotar stock"
                                                    >
                                                        <Megaphone size={14} /> Vender Rápido
                                                    </button>
                                                )}
                                                <button onClick={() => deleteItem(item.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar Registro">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }) : (
                                    <tr>
                                        <td colSpan="5" className="p-10 text-center text-slate-500">
                                            <Package size={40} className="mx-auto text-slate-300 mb-3" />
                                            <p className="font-medium text-lg text-slate-600">El inventario está vacío</p>
                                            <p className="text-sm">Registra tu primer reactivo utilizando el formulario lateral.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
