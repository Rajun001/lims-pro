import React from 'react';
import { Receipt, PlusCircle, DollarSign, FileText, Mail, Send } from 'lucide-react';
import BillingAPI from '../services/BillingAPI';

export const BillingView = () => {
    const mockInvoices = [
        { id: 'FAC-26-001', client: 'Hospital Central', amount: 450000, date: '10/04/2026', dueDate: '10/05/2026', status: 'Vencida', daysOverdue: 27 },
        { id: 'FAC-26-008', client: 'Lácteos del Sur', amount: 125000, date: '25/04/2026', dueDate: '25/05/2026', status: 'Pendiente', daysOverdue: 0 },
        { id: 'FAC-26-015', client: 'Empresa Soya S.A.', amount: 80000, date: '01/05/2026', dueDate: '01/06/2026', status: 'Pagada', daysOverdue: 0 }
    ];

    const generateStatement = (invoice) => {
        alert(`Generando Estado de Cuenta PDF para ${invoice.client}...`);
    };

    const emitElectronicInvoice = async (invoice) => {
        try {
            const reqData = {
                total: invoice.amount,
                items: [{ name: 'Servicios Analíticos de Laboratorio', price: invoice.amount, qty: 1 }]
            };
            const clientData = { name: invoice.client, taxId: '123456789' };
            const result = await BillingAPI.issueInvoice(reqData, clientData);
            if (result.success) {
                alert(`Factura Electrónica emitida con éxito. Clave Fiscal: ${result.invoiceNumber}\nXML y PDF disponibles para descarga.`);
            }
        } catch (e) {
            console.error(e);
            alert("Error al emitir factura electrónica.");
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Receipt className="text-orange-600" /> Cuentas por Cobrar</h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de facturación, cobros y antigüedad de saldos.</p>
                </div>
                <button className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-orange-700 shadow-sm flex items-center gap-2">
                    <PlusCircle size={18} /> Nueva Factura
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-bold uppercase mb-1">Total por Cobrar</div>
                    <div className="text-2xl font-extrabold text-slate-800">¢575,000</div>
                </div>
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
                    <div className="text-red-500 text-sm font-bold uppercase mb-1">1-30 Días Vencido</div>
                    <div className="text-2xl font-extrabold text-red-700">¢450,000</div>
                </div>
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                    <div className="text-orange-500 text-sm font-bold uppercase mb-1">31-60 Días Vencido</div>
                    <div className="text-2xl font-extrabold text-orange-700">¢0</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-sm font-bold uppercase mb-1">&gt; 60 Días Vencido</div>
                    <div className="text-2xl font-extrabold text-slate-700">¢0</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">Directorio de Facturas</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <tr>
                                <th className="p-4 font-bold">Nº Factura</th>
                                <th className="p-4 font-bold">Cliente</th>
                                <th className="p-4 font-bold">Monto</th>
                                <th className="p-4 font-bold">Vencimiento</th>
                                <th className="p-4 font-bold">Estado</th>
                                <th className="p-4 font-bold">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {mockInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono font-bold text-indigo-600">{inv.id}</td>
                                    <td className="p-4 font-bold text-slate-800">{inv.client}</td>
                                    <td className="p-4 font-mono text-slate-600">¢{inv.amount.toLocaleString()}</td>
                                    <td className="p-4 text-slate-600">{inv.dueDate}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${inv.status === 'Vencida' ? 'bg-red-100 text-red-700 border-red-200' : inv.status === 'Pagada' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                            {inv.status} {inv.daysOverdue > 0 && `(${inv.daysOverdue} días)`}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center gap-2">
                                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Registrar Pago"><DollarSign size={16} /></button>
                                        <button onClick={() => generateStatement(inv)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors" title="Estado de Cuenta Interno"><FileText size={16} /></button>
                                        <button onClick={() => emitElectronicInvoice(inv)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Emitir Factura Electrónica (Ministerio de Hacienda)"><Send size={16} /></button>
                                        <button className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="Enviar Recordatorio"><Mail size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
