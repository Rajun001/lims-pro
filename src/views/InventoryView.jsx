import React, { useState, useEffect } from 'react';
import { Package, PlusCircle, AlertTriangle, Megaphone, Trash2, ShieldAlert, CheckCircle2, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { collection, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { FormInput } from '../components/UI';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import { useNotification } from '../contexts/NotificationContext';
import { exportToCSV } from '../utils/exportUtils';
import { formatToCRDate } from '../utils/dateFormatter.js';
import { getApiUrl } from '../utils/api.js';

const API_URL = getApiUrl();

export const InventoryView = ({ db, user, navigateTo }) => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ name: '', lot: '', expiration: '', quantity: 1, unit: 'Unidades' });
    const [isSaving, setIsSaving] = useState(false);
    const { addNotification } = useNotification();

    // QuickBooks Import States
    const [showQbImportModal, setShowQbImportModal] = useState(false);
    const [qbParsedItems, setQbParsedItems] = useState([]);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        if (user?.uid === 'offline-user') {
            const loadLocalInventory = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/inventory`);
                    if (res.ok) {
                        const data = await res.json();
                        const mapped = data.map(x => ({
                            id: x.id,
                            name: x.name,
                            lot: x.lot,
                            expiration: x.expiration,
                            quantity: x.stock,
                            unit: x.unit
                        }));
                        mapped.sort((a, b) => new Date(a.expiration) - new Date(b.expiration));
                        setItems(mapped);
                    } else {
                        throw new Error();
                    }
                } catch {
                    let localInv = localStorage.getItem('lims_local_inventory');
                    if (!localInv) {
                        const defaultInventory = [
                            { id: 'inv-1', name: 'Agar Sangre 5%', quantity: 12, unit: 'Unidades', lot: 'L-AS-2026-11', expiration: '2026-08-30' },
                            { id: 'inv-2', name: 'Agar MacConkey', quantity: 5, unit: 'Unidades', lot: 'L-MC-2026-04', expiration: '2026-06-15' },
                            { id: 'inv-3', name: 'Reactivo de Kovac', quantity: 150, unit: 'ml', lot: 'L-RK-2025-09', expiration: '2026-04-10' }
                        ];
                        localStorage.setItem('lims_local_inventory', JSON.stringify(defaultInventory));
                        localInv = JSON.stringify(defaultInventory);
                    }
                    const data = JSON.parse(localInv);
                    data.sort((a, b) => new Date(a.expiration) - new Date(b.expiration));
                    setItems(data);
                }
            };
            loadLocalInventory();
            window.addEventListener('lims_local_data_updated', loadLocalInventory);
            return () => window.removeEventListener('lims_local_data_updated', loadLocalInventory);
        }

        if (!db) return;
        const unsub = onSnapshot(collection(db, `artifacts/${LIMSSystemId}/public/data/inventory`), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Order by expiration ascending (expiring sooner at the top)
            data.sort((a, b) => new Date(a.expiration) - new Date(b.expiration));
            setItems(data);
        });
        return () => unsub();
    }, [db, user]);

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
            const itemData = {
                name: newItem.name, 
                lot: newItem.lot, 
                expiration: newItem.expiration,
                quantity: parseFloat(newItem.quantity) || 1,
                unit: newItem.unit || 'Unidades'
            };

            if (user?.uid === 'offline-user') {
                try {
                    const res = await fetch(`${API_URL}/api/inventory`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: itemData.name,
                            lot: itemData.lot,
                            expiration: itemData.expiration,
                            stock: itemData.quantity,
                            unit: itemData.unit
                        })
                    });
                    if (!res.ok) throw new Error("API failed");
                    window.dispatchEvent(new Event('lims_local_data_updated'));
                    await logAuditAction(db, user?.uid, 'AGREGAR_INVENTARIO', `Reactivo agregado (API local): ${newItem.name} (Lote: ${newItem.lot})`, 'api-inv');
                    addNotification('Insumo registrado en la base de datos local exitosamente.', 'success');
                    setNewItem({ name: '', lot: '', expiration: '', quantity: 1, unit: 'Unidades' });
                } catch {
                    // Fallback to localStorage
                    const localInv = localStorage.getItem('lims_local_inventory')
                        ? JSON.parse(localStorage.getItem('lims_local_inventory'))
                        : [];
                    const newId = 'inv-' + Date.now();
                    const newRecord = { id: newId, ...itemData, createdAt: new Date().toISOString() };
                    localInv.push(newRecord);
                    localStorage.setItem('lims_local_inventory', JSON.stringify(localInv));
                    window.dispatchEvent(new Event('lims_local_data_updated'));
                    
                    await logAuditAction(db, user?.uid, 'AGREGAR_INVENTARIO', `Reactivo agregado (Offline): ${newItem.name} (Lote: ${newItem.lot})`, newId);
                    addNotification('Insumo registrado en localstorage (offline).', 'success');
                    setNewItem({ name: '', lot: '', expiration: '', quantity: 1, unit: 'Unidades' });
                }
            } else {
                const docRef = await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/inventory`), { 
                    ...itemData,
                    createdAt: serverTimestamp() 
                });
                await logAuditAction(db, user?.uid, 'AGREGAR_INVENTARIO', `Reactivo agregado: ${newItem.name} (Lote: ${newItem.lot})`, docRef.id);
                addNotification('Insumo registrado exitosamente.', 'success');
                setNewItem({ name: '', lot: '', expiration: '', quantity: 1, unit: 'Unidades' });
            }
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
                if (user?.uid === 'offline-user') {
                    try {
                        const isNumericId = !isNaN(parseInt(id)) && !id.toString().startsWith('inv-');
                        if (isNumericId) {
                            const res = await fetch(`${API_URL}/api/inventory/${id}`, { method: 'DELETE' });
                            if (!res.ok) throw new Error();
                        } else {
                            const localInv = JSON.parse(localStorage.getItem('lims_local_inventory') || '[]');
                            const filtered = localInv.filter(item => item.id !== id);
                            localStorage.setItem('lims_local_inventory', JSON.stringify(filtered));
                        }
                        window.dispatchEvent(new Event('lims_local_data_updated'));
                        await logAuditAction(db, user?.uid, 'ELIMINAR_INVENTARIO', `Reactivo eliminado: ${itemToDelete.name} (Lote: ${itemToDelete.lot || 'N/A'})`, id);
                        addNotification('Insumo eliminado exitosamente.', 'success');
                    } catch {
                        const localInv = JSON.parse(localStorage.getItem('lims_local_inventory') || '[]');
                        const filtered = localInv.filter(item => item.id !== id);
                        localStorage.setItem('lims_local_inventory', JSON.stringify(filtered));
                        window.dispatchEvent(new Event('lims_local_data_updated'));
                        
                        await logAuditAction(db, user?.uid, 'ELIMINAR_INVENTARIO', `Reactivo eliminado (Offline): ${itemToDelete.name} (Lote: ${itemToDelete.lot || 'N/A'})`, id);
                        addNotification('Insumo eliminado del localstorage.', 'success');
                    }
                } else {
                    await deleteDoc(doc(db, `artifacts/${LIMSSystemId}/public/data/inventory`, id));
                    await logAuditAction(db, user?.uid, 'ELIMINAR_INVENTARIO', `Reactivo eliminado: ${itemToDelete.name} (Lote: ${itemToDelete.lot || 'N/A'})`, id);
                    addNotification('Insumo eliminado del inventario exitosamente.', 'success');
                }
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
                Vencimiento: item.expiration ? formatToCRDate(item.expiration) : 'N/A',
                Estado: status
            };
        });
        exportToCSV(exportData, `Inventario_LIMS_${new Date().toISOString().slice(0,10)}`);
        addNotification('Inventario exportado a CSV exitosamente.', 'success');
    };

    // Parse QuickBooks Inventory Item CSV files
    const parseQbInventoryCsv = (text) => {
        const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };

        const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lines.length <= 1) {
            addNotification("El archivo está vacío o no contiene filas.", "warning");
            return;
        }

        const headers = parseCSVLine(lines[0]);
        
        const findColIndex = (names) => {
            return headers.findIndex(h => 
                names.some(name => h.toLowerCase().replace(/[\s_-]/g, '').includes(name.toLowerCase()))
            );
        };

        const nameIdx = findColIndex(['item', 'product', 'nombre', 'name', 'articulo', 'descripcion', 'description']);
        const qtyIdx = findColIndex(['qty', 'quantity', 'cantidad', 'onhand', 'on-hand', 'existencia']);
        const unitIdx = findColIndex(['unit', 'unidad', 'uom', 'medida']);

        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        const defaultExpDate = oneYearFromNow.toISOString().split('T')[0];

        const parsed = lines.slice(1).map(line => {
            const values = parseCSVLine(line);
            
            let nameVal = '';
            if (nameIdx !== -1) nameVal = values[nameIdx];
            else nameVal = values[0];
            
            if (!nameVal) return null;

            nameVal = nameVal.replace(/^"|"$/g, '').trim();

            const qtyVal = qtyIdx !== -1 ? parseFloat((values[qtyIdx] || '').replace(/[^0-9.-]/g, '')) || 0 : 1;
            const unitVal = unitIdx !== -1 ? (values[unitIdx] || '').replace(/^"|"$/g, '').trim() : 'Unidades';

            return {
                name: nameVal,
                quantity: qtyVal,
                unit: unitVal,
                lot: 'QB-IMPORT',
                expiration: defaultExpDate
            };
        }).filter(Boolean);

        setQbParsedItems(parsed);
    };

    // Import parsed items into the database
    const handleImportQbItems = async () => {
        if (qbParsedItems.length === 0) return;
        setIsImporting(true);
        const isOffline = user?.uid === 'offline-user';
        let successCount = 0;

        try {
            const localInv = isOffline ? JSON.parse(localStorage.getItem('lims_local_inventory') || '[]') : [];

            for (const item of qbParsedItems) {
                const exists = items.some(i => i.name.toLowerCase() === item.name.toLowerCase() && i.lot === item.lot) ||
                               (isOffline && localInv.some(i => i.name.toLowerCase() === item.name.toLowerCase() && i.lot === item.lot));
                if (exists) {
                    continue; // Skip exact duplicates
                }

                const itemPayload = {
                    name: item.name,
                    lot: item.lot,
                    expiration: item.expiration,
                    quantity: item.quantity,
                    unit: item.unit
                };

                if (isOffline) {
                    const newId = 'inv-' + Date.now() + Math.random().toString(36).substring(2, 5);
                    localInv.push({ id: newId, ...itemPayload, createdAt: new Date().toISOString() });
                } else {
                    itemPayload.createdAt = serverTimestamp();
                    await addDoc(collection(db, `artifacts/${LIMSSystemId}/public/data/inventory`), itemPayload);
                }
                successCount++;
            }

            if (isOffline) {
                localStorage.setItem('lims_local_inventory', JSON.stringify(localInv));
                window.dispatchEvent(new Event('lims_local_data_updated'));
            }

            await logAuditAction(db, user?.uid, 'IMPORTAR_INVENTARIO_QUICKBOOKS', `Importación QuickBooks: ${successCount} insumos importados.`, 'qb-import-inv');
            addNotification(`Importación completada: ${successCount} insumos importados exitosamente.`, "success");
            setShowQbImportModal(false);
            setQbParsedItems([]);
        } catch (error) {
            console.error("Error al importar inventario:", error);
            addNotification("Ocurrió un error al importar los insumos.", "error");
        } finally {
            setIsImporting(false);
        }
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
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setQbParsedItems([]);
                                    setShowQbImportModal(true);
                                }}
                                className="text-sm bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-100 font-bold flex items-center gap-2 transition-colors border border-emerald-200 cursor-pointer"
                            >
                                <FileSpreadsheet size={16} /> Importar QuickBooks (CSV)
                            </button>
                            <button onClick={handleExportCSV} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-bold flex items-center gap-2 transition-colors border border-indigo-200 cursor-pointer">
                                <Download size={16} /> Exportar CSV
                            </button>
                        </div>
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
                                            <td className="p-4 text-slate-600 font-medium">{item.expiration ? formatToCRDate(item.expiration) : 'N/A'}</td>
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

            {showQbImportModal && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Importar Insumos / Artículos desde QuickBooks</h3>
                                    <p className="text-xs text-slate-500">Cargue un archivo CSV de sus productos o reactivos.</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowQbImportModal(false); setQbParsedItems([]); }} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm text-slate-600 space-y-2">
                                <h5 className="font-bold text-slate-700">💡 Instrucciones de exportación en QuickBooks:</h5>
                                <ol className="list-decimal pl-5 space-y-1">
                                    <li>En QuickBooks, vaya al menú <strong>Productos y servicios</strong> (o Item List / Inventory).</li>
                                    <li>Haga clic en el botón de exportar/Excel y guárdelo como <strong>CSV (delimitado por comas)</strong>.</li>
                                    <li>El sistema detectará las columnas de Nombre y Existencia (Stock). Podrá ingresar el Lote y Fecha de Vencimiento manualmente abajo.</li>
                                </ol>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Archivo CSV de QuickBooks</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".csv"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    parseQbInventoryCsv(event.target.result);
                                                };
                                                reader.readAsText(file);
                                            }}
                                            className="hidden"
                                            id="qb-inv-csv-file"
                                        />
                                        <label
                                            htmlFor="qb-inv-csv-file"
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 border border-dashed border-indigo-300 rounded-xl cursor-pointer hover:bg-indigo-100/50 text-indigo-700 font-bold transition-all text-sm"
                                        >
                                            <Upload size={16} /> Subir archivo CSV de Inventario
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {qbParsedItems.length > 0 && (
                                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center text-sm">
                                        <span>Artículos detectados ({qbParsedItems.length})</span>
                                        <span className="text-xs text-slate-500 font-normal">Edite lote y fecha antes de importar</span>
                                    </div>
                                    <div className="max-h-72 overflow-y-auto">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold sticky top-0">
                                                <tr>
                                                    <th className="p-3">Nombre</th>
                                                    <th className="p-3">Cantidad</th>
                                                    <th className="p-3">Unidad</th>
                                                    <th className="p-3">Número de Lote</th>
                                                    <th className="p-3">Fecha de Vencimiento</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {qbParsedItems.map((c, i) => (
                                                    <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                                        <td className="p-3 font-semibold text-slate-800 max-w-[200px] truncate" title={c.name}>{c.name}</td>
                                                        <td className="p-3">
                                                            <input
                                                                type="number"
                                                                value={c.quantity}
                                                                onChange={(e) => {
                                                                    const updated = [...qbParsedItems];
                                                                    updated[i].quantity = parseFloat(e.target.value) || 0;
                                                                    setQbParsedItems(updated);
                                                                }}
                                                                className="px-2 py-1 border border-slate-300 rounded outline-none text-xs font-semibold text-slate-700 w-16"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <select
                                                                value={c.unit}
                                                                onChange={(e) => {
                                                                    const updated = [...qbParsedItems];
                                                                    updated[i].unit = e.target.value;
                                                                    setQbParsedItems(updated);
                                                                }}
                                                                className="px-2 py-1 bg-white border border-slate-300 rounded outline-none text-xs font-semibold text-slate-700 cursor-pointer"
                                                            >
                                                                <option value="Unidades">Unidades (Kits)</option>
                                                                <option value="ml">Mililitros (ml)</option>
                                                                <option value="g">Gramos (g)</option>
                                                            </select>
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="text"
                                                                value={c.lot}
                                                                onChange={(e) => {
                                                                    const updated = [...qbParsedItems];
                                                                    updated[i].lot = e.target.value;
                                                                    setQbParsedItems(updated);
                                                                }}
                                                                className="px-2 py-1 border border-slate-300 rounded outline-none text-xs font-semibold text-slate-700 w-28"
                                                                placeholder="Lote"
                                                            />
                                                        </td>
                                                        <td className="p-3">
                                                            <input
                                                                type="date"
                                                                value={c.expiration}
                                                                onChange={(e) => {
                                                                    const updated = [...qbParsedItems];
                                                                    updated[i].expiration = e.target.value;
                                                                    setQbParsedItems(updated);
                                                                }}
                                                                className="px-2 py-1 border border-slate-300 rounded outline-none text-xs font-semibold text-slate-700 cursor-pointer"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowQbImportModal(false);
                                    setQbParsedItems([]);
                                }}
                                className="px-6 py-2 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer transition-colors text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={handleImportQbItems}
                                disabled={isImporting || qbParsedItems.length === 0}
                                className="px-6 py-2 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer disabled:opacity-50 transition-colors flex items-center gap-2 text-sm"
                            >
                                {isImporting ? 'Importando...' : `Confirmar e Importar (${qbParsedItems.length})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
