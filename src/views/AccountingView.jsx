import React, { useState } from 'react';
import { Wallet, Download, PlusCircle, TrendingUp, CreditCard, Lock } from 'lucide-react';

export const AccountingView = ({ userRole, navigateTo }) => {
    const [activeTab, setActiveTab] = useState('resumen');
    const [activeCurrency, setActiveCurrency] = useState('CRC');

    if (userRole !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
                <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Lock size={48} />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Acceso Restringido</h2>
                <p className="text-slate-500 max-w-md mx-auto mb-8">El módulo contable contiene información financiera confidencial. Necesitas privilegios de Administrador para acceder.</p>
                <button onClick={() => navigateTo('home')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-md">
                    Volver al Inicio
                </button>
            </div>
        );
    }

    const globalRates = {
        USD: 1,
        CRC: 510,
        EUR: 0.92
    };

    const formatCurrency = (baseAmountUSD, manualRate = null, targetCurrency = activeCurrency) => {
        let rate = manualRate ? manualRate : globalRates[targetCurrency];
        let converted = Math.abs(baseAmountUSD) * rate; // Format handles absolute value, sign is prepended later if needed

        let formatted = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: targetCurrency,
            minimumFractionDigits: 2
        }).format(converted);

        // Custom symbol correction for CRC if needed, though Intl usually handles it well (CRC -> CRC 100.00, we might want ¢)
        if (targetCurrency === 'CRC') {
            formatted = formatted.replace('CRC', '¢').replace(/\s/g, '');
        }

        return baseAmountUSD < 0 ? `-${formatted}` : formatted;
    };

    // rawAmount is internally stored in USD (base currency)
    const mockInvoices = [
        { id: 'FAC-26-001', client: 'Hospital Central', rawAmount: 1250.00, date: '01/05/2026', status: 'Pagada', manualRate: null },
        { id: 'FAC-26-002', client: 'Empresa Soya S.A.', rawAmount: 3400.00, date: '03/05/2026', status: 'Pendiente', manualRate: null },
        { id: 'FAC-26-003', client: 'Lácteos del Sur', rawAmount: 850.00, date: '10/04/2026', status: 'Vencida', manualRate: { CRC: 550 } }, // Caso especial: tasa manual para CRC
    ];

    const mockTransactions = [
        { id: 'TRX-101', date: '05/05/2026', desc: 'Reactivos Sigma Aldrich', category: 'Insumos', type: 'Egreso', rawAmount: -450.00 },
        { id: 'TRX-102', date: '06/05/2026', desc: 'Pago Factura FAC-26-001', category: 'Servicios', type: 'Ingreso', rawAmount: 1250.00 },
        { id: 'TRX-103', date: '07/05/2026', desc: 'Mantenimiento Equipos', category: 'Operativa', type: 'Egreso', rawAmount: -200.00 },
    ];

    const totalsUSD = {
        ingresos: 12450.00,
        egresos: -4230.00,
        porCobrar: 5300.00
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Wallet className="text-indigo-600" /> Contabilidad y Finanzas</h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de ingresos, egresos y facturación del laboratorio.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto items-center">
                    <select
                        value={activeCurrency}
                        onChange={(e) => setActiveCurrency(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-lg hover:border-indigo-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold shadow-sm transition-all"
                        title="Seleccionar Moneda"
                    >
                        <option value="CRC">CRC (¢)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                    </select>
                    <button className="flex-1 sm:flex-none justify-center bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium shadow-sm flex items-center gap-2 transition-colors">
                        <Download size={18} /> Exportar
                    </button>
                    <button className="flex-1 sm:flex-none justify-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium shadow-sm flex items-center gap-2 transition-colors">
                        <PlusCircle size={18} /> Transacción
                    </button>
                </div>
            </div>

            <div className="flex bg-white rounded-lg shadow-sm p-1 gap-2 border border-slate-200 w-full sm:w-fit">
                <button onClick={() => setActiveTab('resumen')} className={`flex-1 sm:px-6 py-2 font-medium rounded-md transition-colors ${activeTab === 'resumen' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Resumen</button>
                <button onClick={() => setActiveTab('facturas')} className={`flex-1 sm:px-6 py-2 font-medium rounded-md transition-colors ${activeTab === 'facturas' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Facturas</button>
                <button onClick={() => setActiveTab('caja')} className={`flex-1 sm:px-6 py-2 font-medium rounded-md transition-colors ${activeTab === 'caja' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}>Caja</button>
            </div>

            {activeTab === 'resumen' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp size={24} /></div>
                                <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full border border-green-200">+12% vs mes ant.</span>
                            </div>
                            <p className="text-slate-500 font-medium">Ingresos Totales (Mes)</p>
                            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalsUSD.ingresos)}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-rose-50 text-rose-500 rounded-xl"><TrendingUp size={24} className="rotate-180" /></div>
                            </div>
                            <p className="text-slate-500 font-medium">Egresos Operativos</p>
                            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{formatCurrency(Math.abs(totalsUSD.egresos))}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><CreditCard size={24} /></div>
                            </div>
                            <p className="text-slate-500 font-medium">Cuentas por Cobrar</p>
                            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalsUSD.porCobrar)}</h3>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'facturas' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800">Cuentas por Cobrar y Facturas</h3>
                        <button className="text-sm bg-white border border-slate-200 font-bold text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 shadow-sm w-full sm:w-auto">Generar Factura</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 font-bold">Nº Factura</th>
                                    <th className="p-4 font-bold">Cliente</th>
                                    <th className="p-4 font-bold">Fecha</th>
                                    <th className="p-4 font-bold text-right">Monto</th>
                                    <th className="p-4 font-bold">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mockInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-mono font-bold text-indigo-600 cursor-pointer">{inv.id}</td>
                                        <td className="p-4 font-bold text-slate-800">{inv.client}</td>
                                        <td className="p-4 text-slate-500">{inv.date}</td>
                                        <td className="p-4 font-medium text-slate-800 text-right">
                                            {formatCurrency(inv.rawAmount, inv.manualRate?.[activeCurrency])}
                                            {inv.manualRate?.[activeCurrency] && <span className="ml-1 text-[10px] text-orange-500 font-bold" title="Tasa de cambio manual aplicada">*</span>}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${inv.status === 'Pagada' ? 'bg-green-100 text-green-700 border border-green-200' : inv.status === 'Pendiente' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'caja' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800">Historial de Transacciones</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="p-4 font-bold">ID TRX</th>
                                    <th className="p-4 font-bold">Fecha</th>
                                    <th className="p-4 font-bold">Descripción</th>
                                    <th className="p-4 font-bold">Categoría</th>
                                    <th className="p-4 font-bold text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {mockTransactions.map(trx => (
                                    <tr key={trx.id} className="hover:bg-slate-50">
                                        <td className="p-4 font-mono text-slate-500">{trx.id}</td>
                                        <td className="p-4 text-slate-500">{trx.date}</td>
                                        <td className="p-4 font-medium text-slate-800">{trx.desc}</td>
                                        <td className="p-4 text-slate-600">{trx.category}</td>
                                        <td className={`p-4 font-bold text-right ${trx.type === 'Ingreso' ? 'text-green-600' : 'text-slate-800'}`}>{trx.amount > 0 ? '+' : ''}{formatCurrency(trx.rawAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
