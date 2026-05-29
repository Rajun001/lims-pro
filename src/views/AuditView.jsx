import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { RestrictedAccess } from '../components/UI';

export const AuditView = ({ db, userRole, navigateTo }) => {
    const [logs, setLogs] = useState([]);
    useEffect(() => {
        if (userRole !== 'admin' || !db) return;
        const q = query(collection(db, `artifacts/${LIMSSystemId}/public/data/audit_logs`), orderBy('timestamp', 'desc'), limit(50));
        const unsub = onSnapshot(q, (snapshot) => { setLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); });
        return () => unsub();
    }, [db, userRole]);

    if (userRole !== 'admin') {
        return <RestrictedAccess navigateTo={navigateTo} />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Audit Trail (Trazabilidad)</h2>
                <button onClick={() => navigateTo('dashboard')} className="text-slate-500 hover:text-indigo-600">Volver</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Fecha</th><th className="p-4">Acción</th><th className="p-4">Detalles</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="p-4 font-mono text-slate-500">{log.timestamp?.toDate().toLocaleString()}</td>
                                <td className="p-4 font-bold text-blue-700">{log.action}</td>
                                <td className="p-4 text-slate-600">{log.details}</td>
                            </tr>
                        ))}
                        {logs.length === 0 && <tr><td colSpan="3" className="p-8 text-center text-slate-400">Sin registros.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
