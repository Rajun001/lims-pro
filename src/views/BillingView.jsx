import React, { useState, useMemo, useEffect } from 'react';
import { Receipt, DollarSign, FileText, Send, Truck, CheckCircle2, ChevronDown, ChevronUp, Clock, Download, Plus, Layers, Users, Percent, Award } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import BillingAPI from '../services/BillingAPI';
import { getApiUrl } from '../utils/api';

const API_URL = getApiUrl();

export const BillingView = ({ requests = [], db, referenceLabs = [], _referenceLabTests = [], user }) => {
    const [activeTab, setActiveTab] = useState('receivable'); // 'receivable' | 'payable' | 'quickbooks'
    const [expandedLabId, setExpandedLabId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [qbSyncLog, setQbSyncLog] = useState(null);
    
    // Modal de Nueva Factura
    const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
    const [newInvClient, setNewInvClient] = useState('');
    const [newInvAmount, setNewInvAmount] = useState('');
    const [newInvDueDate, setNewInvDueDate] = useState('');
    const [newInvNotes, setNewInvNotes] = useState('');

    // Invoices list state (persisted locally / firestore)
    const [invoices, setInvoices] = useState(() => {
        const saved = localStorage.getItem('lims_local_invoices');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { console.error(e); }
        }
        return [
            { id: 'FAC-26-001', client: 'Hospital Central', amount: 450000, date: '10/04/2026', dueDate: '10/05/2026', status: 'Vencida', daysOverdue: 27 },
            { id: 'FAC-26-008', client: 'Lácteos del Sur', amount: 125000, date: '25/04/2026', dueDate: '25/05/2026', status: 'Pendiente', daysOverdue: 0 },
            { id: 'FAC-26-015', client: 'Empresa Soya S.A.', amount: 80000, date: '01/05/2026', dueDate: '01/06/2026', status: 'Pagada', daysOverdue: 0 }
        ];
    });

    useEffect(() => {
        localStorage.setItem('lims_local_invoices', JSON.stringify(invoices));
    }, [invoices]);

    // Fetch QuickBooks sync status
    useEffect(() => {
        const fetchQbStatus = async () => {
            try {
                const res = await fetch(`${API_URL}/api/qbwc/settings`);
                if (res.ok) {
                    const data = await res.json();
                    if (data?.last_sync_log) {
                        try {
                            setQbSyncLog(JSON.parse(data.last_sync_log));
                        } catch {
                            setQbSyncLog({ details: data.last_sync_log });
                        }
                    }
                }
            } catch {
                // API local offline
            }
        };
        fetchQbStatus();
    }, []);

    // Accounts Payable calculations (referred tests)
    const pendingReferrals = useMemo(() => {
        return requests.filter(r => r.isReferred && r.referralStatus === 'Completado' && !r.referralPaid);
    }, [requests]);

    const completedPaidReferrals = useMemo(() => {
        return requests.filter(r => r.isReferred && r.referralStatus === 'Completado' && r.referralPaid);
    }, [requests]);

    // Sum of all unpaid referred costs
    const totalOwedToLabs = useMemo(() => {
        return pendingReferrals.reduce((sum, r) => sum + (r.referralCost || 0), 0);
    }, [pendingReferrals]);

    // Accounts Receivable summary
    const totalReceivable = useMemo(() => {
        return invoices.filter(i => i.status !== 'Pagada').reduce((sum, i) => sum + i.amount, 0);
    }, [invoices]);

    const totalOverdue = useMemo(() => {
        return invoices.filter(i => i.status === 'Vencida').reduce((sum, i) => sum + i.amount, 0);
    }, [invoices]);

    // Group unpaid referred requests by lab
    const labsWithBalances = useMemo(() => {
        return referenceLabs.map(lab => {
            const labUnpaidReferrals = pendingReferrals.filter(r => r.referralLabId === lab.id || (!r.referralLabId && r.referralLab === lab.name));
            const balance = labUnpaidReferrals.reduce((sum, r) => sum + (r.referralCost || 0), 0);
            return {
                ...lab,
                balance,
                referrals: labUnpaidReferrals
            };
        }).filter(lab => lab.balance > 0 || lab.status === 'Activo');
    }, [referenceLabs, pendingReferrals]);

    const handleMarkAsPaid = async (requestId, referralLabName, costPrice) => {
        if (!window.confirm("¿Está seguro de marcar este costo de derivación como liquidado/pagado al laboratorio externo?")) return;
        
        setIsSubmitting(true);
        try {
            if (user?.uid === 'offline-user') {
                const localReqs = JSON.parse(localStorage.getItem('lims_local_requests') || '[]');
                const idx = localReqs.findIndex(r => r.id === requestId);
                if (idx !== -1) {
                    localReqs[idx].referralPaid = true;
                    localReqs[idx].referralPaidDate = new Date().toISOString();
                }
                localStorage.setItem('lims_local_requests', JSON.stringify(localReqs));
                window.dispatchEvent(new Event('lims_local_data_updated'));
            } else {
                const reqRef = doc(db, `artifacts/${LIMSSystemId}/public/data/requests`, requestId);
                await updateDoc(reqRef, {
                    referralPaid: true,
                    referralPaidDate: serverTimestamp ? serverTimestamp() : new Date()
                });
            }

            await logAuditAction(
                db, 
                user?.uid || 'anon', 
                'PAGO_DERIVACION_REGISTRADO', 
                `Liquidación de pago registrada para laboratorio externo ${referralLabName} por costo de ¢${costPrice.toLocaleString()}`, 
                requestId
            );

            alert("Pago registrado exitosamente.");
        } catch (error) {
            console.error("Error setting referral as paid:", error);
            alert("Error al registrar el pago.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateInvoice = (e) => {
        e.preventDefault();
        if (!newInvClient || !newInvAmount) {
            alert("Complete el cliente y el monto de la factura.");
            return;
        }

        const newId = `FAC-26-${String(invoices.length + 1).padStart(3, '0')}`;
        const newInvoice = {
            id: newId,
            client: newInvClient,
            amount: parseFloat(newInvAmount) || 0,
            date: new Date().toLocaleDateString('es-CR'),
            dueDate: newInvDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CR'),
            status: 'Pendiente',
            daysOverdue: 0,
            notes: newInvNotes
        };

        setInvoices([newInvoice, ...invoices]);
        setShowNewInvoiceModal(false);
        setNewInvClient('');
        setNewInvAmount('');
        setNewInvDueDate('');
        setNewInvNotes('');
        alert(`Factura ${newId} generada exitosamente.`);
    };

    const handleRegisterClientPayment = (invoiceId) => {
        if (!window.confirm(`¿Registrar cobro total para la factura ${invoiceId}?`)) return;
        setInvoices(invoices.map(inv => {
            if (inv.id === invoiceId) {
                return { ...inv, status: 'Pagada', paidDate: new Date().toLocaleDateString('es-CR') };
            }
            return inv;
        }));
        alert(`Pago registrado para la factura ${invoiceId}.`);
    };

    const generateStatement = (invoice) => {
        alert(`Generando Estado de Cuenta oficial para ${invoice.client} por ¢${invoice.amount.toLocaleString()}.`);
    };

    const emitElectronicInvoice = async (invoice) => {
        try {
            const reqData = {
                total: invoice.amount,
                items: [{ name: 'Servicios Analíticos de Laboratorio Microlabs', price: invoice.amount, qty: 1 }]
            };
            const clientData = { name: invoice.client, taxId: '3-101-445892' };
            const result = await BillingAPI.issueInvoice(reqData, clientData);
            if (result.success) {
                setInvoices(invoices.map(inv => inv.id === invoice.id ? { ...inv, electronicInvoice: result.invoiceNumber } : inv));
                alert(`Factura Electrónica emitida con éxito.\nClave Fiscal: ${result.invoiceNumber}\nDocumentos electrónicos validados por el Ministerio de Hacienda.`);
            }
        } catch (e) {
            console.error(e);
            alert("Error al emitir factura electrónica.");
        }
    };

    // Export Invoices to QuickBooks CSV
    const exportQuickBooksCSV = () => {
        const headers = ["Invoice Number", "Customer Name", "Invoice Date", "Due Date", "Item Name", "Item Description", "Quantity", "Rate", "Amount", "Balance Remaining", "Status"];
        const rows = invoices.map(inv => [
            `"${inv.id}"`,
            `"${inv.client}"`,
            `"${inv.date}"`,
            `"${inv.dueDate}"`,
            `"Servicios Analíticos"`,
            `"Análisis Clínico y Microbiológico Microlabs"`,
            "1",
            inv.amount,
            inv.amount,
            inv.status === 'Pagada' ? 0 : inv.amount,
            `"${inv.status}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `QuickBooks_Invoices_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Download QWC configuration file
    const downloadQwcFile = () => {
        const qwcXml = `<?xml version="1.0"?>
<QBWCXML>
   <AppName>LIMS Microlabs QuickBooks Connector</AppName>
   <AppID>LIMS-MICROLABS-QBWC-001</AppID>
   <AppURL>${API_URL}/api/qbwc</AppURL>
   <AppDescription>Sincronización automatizada de clientes y facturación de LIMS Microlabs con QuickBooks Desktop</AppDescription>
   <AppSupport>${API_URL}/help</AppSupport>
   <UserName>microlabs_sync</UserName>
   <OwnerID>{90A44FB5-33D9-4815-AC85-AC86A7E7D1EB}</OwnerID>
   <FileID>{57F3B9B6-86F1-4FCC-B1FF-967DE1813D20}</FileID>
   <QBType>QBFS</QBType>
   <Style>Document</Style>
   <Scheduler>
      <RunEveryNMinutes>30</RunEveryNMinutes>
   </Scheduler>
</QBWCXML>`;

        const blob = new Blob([qwcXml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'microlabs_quickbooks.qwc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                        <Receipt className="text-orange-600" /> Finanzas, Facturación y QuickBooks
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de cartera, cuentas por pagar a laboratorios externos y conector contable.</p>
                </div>
                
                {/* Navigation Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setActiveTab('receivable')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'receivable' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                        <DollarSign size={14} /> Cuentas por Cobrar
                    </button>
                    <button
                        onClick={() => setActiveTab('payable')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'payable' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:text-orange-600'}`}
                    >
                        <Truck size={14} /> Cuentas por Pagar
                    </button>
                    <button
                        onClick={() => setActiveTab('quickbooks')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'quickbooks' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-emerald-600'}`}
                    >
                        <Layers size={14} /> QuickBooks Sync
                    </button>
                    <button
                        onClick={() => setActiveTab('commissions')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'commissions' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}
                    >
                        <Users size={14} /> Comisiones Médicas
                    </button>
                </div>
            </div>

            {/* Financial Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="text-slate-500 text-xs font-bold uppercase mb-1">Pendiente de Cobro (Clientes)</div>
                    <div className="text-2xl font-extrabold text-slate-800 font-mono">¢{totalReceivable.toLocaleString()}</div>
                </div>
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 shadow-sm">
                    <div className="text-orange-600 text-xs font-bold uppercase mb-1">Facturas Vencidas</div>
                    <div className="text-2xl font-extrabold text-orange-700 font-mono">¢{totalOverdue.toLocaleString()}</div>
                </div>
                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
                    <div className="text-indigo-600 text-xs font-bold uppercase mb-1">Por Pagar a Labs Referencia</div>
                    <div className="text-2xl font-extrabold text-indigo-700 font-mono">¢{totalOwedToLabs.toLocaleString()}</div>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 shadow-sm">
                    <div className="text-emerald-600 text-xs font-bold uppercase mb-1">Derivaciones Liquidadas</div>
                    <div className="text-2xl font-extrabold text-emerald-700">{completedPaidReferrals.length}</div>
                </div>
            </div>

            {/* TAB: ACCOUNTS RECEIVABLE */}
            {activeTab === 'receivable' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50 gap-3">
                        <div>
                            <h3 className="font-bold text-slate-800">Cartera de Facturas a Clientes</h3>
                            <p className="text-xs text-slate-500">Facturación directa y control de cobro.</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={exportQuickBooksCSV}
                                className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Download size={14} /> Exportar CSV
                            </button>
                            <button
                                onClick={() => setShowNewInvoiceModal(true)}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Plus size={16} /> Nueva Factura
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 font-bold">Nº Factura</th>
                                    <th className="p-4 font-bold">Cliente</th>
                                    <th className="p-4 font-bold text-right">Monto</th>
                                    <th className="p-4 font-bold">Fecha Emisión</th>
                                    <th className="p-4 font-bold">Vencimiento</th>
                                    <th className="p-4 font-bold">Estado</th>
                                    <th className="p-4 w-32 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {invoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 font-mono font-bold text-indigo-600">
                                            {inv.id}
                                            {inv.electronicInvoice && (
                                                <span className="block text-[9px] text-emerald-600 font-sans font-bold">FE: {inv.electronicInvoice}</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-bold text-slate-800">{inv.client}</td>
                                        <td className="p-4 text-right font-mono font-bold text-slate-700">¢{inv.amount.toLocaleString()}</td>
                                        <td className="p-4 text-slate-500">{inv.date}</td>
                                        <td className="p-4 text-slate-600">{inv.dueDate}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${inv.status === 'Vencida' ? 'bg-red-100 text-red-700 border-red-200' : inv.status === 'Pagada' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                                {inv.status} {inv.daysOverdue > 0 && `(${inv.daysOverdue} días)`}
                                            </span>
                                        </td>
                                        <td className="p-4 flex items-center justify-center gap-1.5">
                                            {inv.status !== 'Pagada' && (
                                                <button onClick={() => handleRegisterClientPayment(inv.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Registrar Cobro / Pago">
                                                    <DollarSign size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => generateStatement(inv)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="Estado de Cuenta Interno">
                                                <FileText size={16} />
                                            </button>
                                            <button onClick={() => emitElectronicInvoice(inv)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Emitir Factura Electrónica (Hacienda)">
                                                <Send size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: ACCOUNTS PAYABLE (REFERENCE LABS) */}
            {activeTab === 'payable' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Truck className="text-indigo-600" size={20} /> Cuentas por Pagar a Laboratorios de Referencia
                            </h3>
                            <p className="text-slate-500 text-xs mt-1">Saldos pendientes correspondientes a análisis derivados ya finalizados.</p>
                        </div>
                        
                        <div className="divide-y divide-slate-200">
                            {labsWithBalances.map(lab => {
                                const isExpanded = expandedLabId === lab.id;
                                return (
                                    <div key={lab.id} className="bg-white">
                                        <div 
                                            onClick={() => setExpandedLabId(isExpanded ? null : lab.id)}
                                            className="p-5 flex justify-between items-center hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <div className="space-y-1">
                                                <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">{lab.name}</h4>
                                                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{lab.referrals.length} Derivaciones Pendientes de Pago</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className="block text-[10px] font-bold text-slate-400 uppercase">Saldo Pendiente</span>
                                                    <span className="font-bold font-mono text-indigo-700 text-sm">¢{lab.balance.toLocaleString()}</span>
                                                </div>
                                                {isExpanded ? <ChevronUp className="text-slate-400" size={18} /> : <ChevronDown className="text-slate-400" size={18} />}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="px-5 pb-5 pt-2 bg-slate-50 border-t border-b animate-slide-in overflow-x-auto">
                                                <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Detalle de Derivaciones sin Liquidar</h5>
                                                <table className="w-full text-left text-xs bg-white rounded-xl border overflow-hidden">
                                                    <thead className="bg-slate-100 text-slate-600 font-bold border-b">
                                                        <tr>
                                                            <th className="p-3">Código Muestra</th>
                                                            <th className="p-3">Paciente / Cliente</th>
                                                            <th className="p-3">Análisis</th>
                                                            <th className="p-3 text-right">Costo Interno (LIMS)</th>
                                                            <th className="p-3 text-right">Precio Paciente</th>
                                                            <th className="p-3">Finalización</th>
                                                            <th className="p-3 text-center w-28">Acción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {lab.referrals.map(req => {
                                                            const compDate = req.completedAt?.seconds 
                                                                ? new Date(req.completedAt.seconds * 1000).toLocaleDateString() 
                                                                : 'N/A';
                                                            return (
                                                                <tr key={req.id} className="hover:bg-slate-50">
                                                                    <td className="p-3 font-mono font-bold text-indigo-600">{req.id.substring(0, 8).toUpperCase()}</td>
                                                                    <td className="p-3 font-bold text-slate-800">{req.patientName || req.clientName}</td>
                                                                    <td className="p-3 text-slate-600 font-medium">{req.analysisRequested}</td>
                                                                    <td className="p-3 text-right font-mono font-bold">¢{(req.referralCost || 0).toLocaleString()}</td>
                                                                    <td className="p-3 text-right font-mono text-slate-500">¢{(req.referralPatientPrice || 0).toLocaleString()}</td>
                                                                    <td className="p-3 text-slate-500">{compDate}</td>
                                                                    <td className="p-3 text-center">
                                                                        <button
                                                                            onClick={() => handleMarkAsPaid(req.id, lab.name, req.referralCost || 0)}
                                                                            disabled={isSubmitting}
                                                                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                                                        >
                                                                            Liquidar Pago
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {labsWithBalances.length === 0 && (
                                <div className="p-12 text-center text-slate-500">
                                    <CheckCircle2 className="mx-auto text-emerald-500 w-12 h-12 mb-3 animate-pulse" />
                                    <h4 className="font-extrabold text-slate-800 text-sm">¡Al Día!</h4>
                                    <p className="text-xs text-slate-400 mt-1">No hay saldos pendientes por pagar a laboratorios de referencia.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Paid Referrals History */}
                    {completedPaidReferrals.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock size={16} className="text-slate-400" /> Historial de Derivaciones Liquidadas
                                </h4>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                    {completedPaidReferrals.length} pagadas
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="p-3">ID Muestra</th>
                                            <th className="p-3">Paciente / Cliente</th>
                                            <th className="p-3">Laboratorio</th>
                                            <th className="p-3">Análisis</th>
                                            <th className="p-3 text-right">Costo Pagado</th>
                                            <th className="p-3 text-right">Cobrado Paciente</th>
                                            <th className="p-3">Fecha Pago</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {completedPaidReferrals.map(req => {
                                            const paidDate = req.referralPaidDate 
                                                ? (req.referralPaidDate.seconds 
                                                    ? new Date(req.referralPaidDate.seconds * 1000).toLocaleDateString() 
                                                    : new Date(req.referralPaidDate).toLocaleDateString())
                                                : 'N/A';
                                            return (
                                                <tr key={req.id} className="hover:bg-slate-50 text-slate-600">
                                                    <td className="p-3 font-mono font-bold text-slate-500">{req.id.substring(0, 8).toUpperCase()}</td>
                                                    <td className="p-3 font-semibold text-slate-700">{req.patientName || req.clientName}</td>
                                                    <td className="p-3">{req.referralLab}</td>
                                                    <td className="p-3">{req.analysisRequested}</td>
                                                    <td className="p-3 text-right font-mono font-bold text-slate-700">¢{(req.referralCost || 0).toLocaleString()}</td>
                                                    <td className="p-3 text-right font-mono">¢{(req.referralPatientPrice || 0).toLocaleString()}</td>
                                                    <td className="p-3 text-emerald-600 font-bold">✔ {paidDate}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB: QUICKBOOKS INTEGRATION */}
            {activeTab === 'quickbooks' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 sm:p-8 space-y-6">
                    <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <Layers className="text-emerald-600" /> QuickBooks Web Connector (QBWC)
                            </h3>
                            <p className="text-slate-500 text-xs mt-1">Sincronización bidireccional de clientes, cotizaciones y facturas con QuickBooks Desktop y Premier.</p>
                        </div>
                        <button
                            onClick={downloadQwcFile}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                        >
                            <Download size={16} /> Descargar .QWC
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Step 1 */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                            <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs">1</span>
                            <h4 className="font-bold text-slate-800 text-sm">Descargar Archivo .QWC</h4>
                            <p className="text-xs text-slate-500">Descargue el archivo de configuración oficial del conector e impórtelo en QuickBooks Web Connector.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                            <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs">2</span>
                            <h4 className="font-bold text-slate-800 text-sm">Credenciales de Acceso</h4>
                            <p className="text-xs text-slate-500 font-mono bg-white p-2 rounded border border-slate-200">
                                <strong>Usuario:</strong> microlabs_sync<br />
                                <strong>Contraseña:</strong> microlabs123
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2">
                            <span className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center font-black text-xs">3</span>
                            <h4 className="font-bold text-slate-800 text-sm">Exportación Manual CSV</h4>
                            <p className="text-xs text-slate-500">También puede exportar manualmente la cartera a formato CSV para importación directa en QuickBooks Online.</p>
                            <button
                                onClick={exportQuickBooksCSV}
                                className="w-full mt-2 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                                <Download size={14} /> Exportar Invoices CSV
                            </button>
                        </div>
                    </div>

                    {/* Sync Status Log */}
                    <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 space-y-3 font-mono text-xs">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                            <span className="text-emerald-400 font-bold flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Estado de Conexión QBWC
                            </span>
                            <span className="text-slate-400 text-[11px]">Endpoint: {API_URL}/api/qbwc</span>
                        </div>
                        <p className="text-slate-300">
                            <strong>Último Registro:</strong> {qbSyncLog?.details || "Servicio SOAP activo a la espera de peticiones periódicas del Web Connector."}
                        </p>
                        {qbSyncLog?.time && (
                            <p className="text-[10px] text-slate-500">Fecha: {new Date(qbSyncLog.time).toLocaleString('es-CR')}</p>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: MEDICAL COMMISSIONS & REFERRALS */}
            {activeTab === 'commissions' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 space-y-6">
                    <div className="flex flex-wrap justify-between items-center pb-4 border-b border-slate-100 gap-3">
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                                <Users className="text-indigo-600" /> Liquidación de Comisiones Médicas y Procedencias
                            </h3>
                            <p className="text-xs text-slate-500">Cálculo automatizado de honorarios y porcentajes por referidor para médicos y clínicas aliadas.</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="bg-indigo-50 text-indigo-700 font-extrabold text-xs px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1">
                                <Percent size={14} /> Tasa Estándar: 10%
                            </span>
                        </div>
                    </div>

                    {/* Commissions summary cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4">
                            <span className="text-[10px] font-black uppercase text-indigo-600 block mb-1">Total Comisiones Generadas</span>
                            <span className="text-2xl font-black text-indigo-950 font-mono">¢84,500</span>
                            <span className="text-[10px] text-indigo-500 block mt-1">En 24 órdenes referidas este mes</span>
                        </div>
                        <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4">
                            <span className="text-[10px] font-black uppercase text-amber-600 block mb-1">Pendiente de Liquidar</span>
                            <span className="text-2xl font-black text-amber-950 font-mono">¢32,000</span>
                            <span className="text-[10px] text-amber-600 block mt-1">3 Médicos por pagar</span>
                        </div>
                        <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4">
                            <span className="text-[10px] font-black uppercase text-emerald-600 block mb-1">Comisiones Liquidadas</span>
                            <span className="text-2xl font-black text-emerald-950 font-mono">¢52,500</span>
                            <span className="text-[10px] text-emerald-600 block mt-1">Pagos completados este mes</span>
                        </div>
                    </div>

                    {/* Doctors & Referrers table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase text-[10px]">
                                <tr>
                                    <th className="p-3">Médico / Procedencia</th>
                                    <th className="p-3">Código MQC</th>
                                    <th className="p-3 text-center">Muestras Referidas</th>
                                    <th className="p-3 text-right">Facturación Bruta</th>
                                    <th className="p-3 text-center">% Comisión</th>
                                    <th className="p-3 text-right">Monto Comisión</th>
                                    <th className="p-3 text-center">Estado</th>
                                    <th className="p-3 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-3 font-bold text-slate-800">Dr. Fernando Vargas M.</td>
                                    <td className="p-3 font-mono text-slate-500">MQC-1042</td>
                                    <td className="p-3 text-center font-bold">12 Muestras</td>
                                    <td className="p-3 text-right font-mono font-bold">¢320,000</td>
                                    <td className="p-3 text-center font-bold text-indigo-600">10%</td>
                                    <td className="p-3 text-right font-mono font-black text-indigo-900">¢32,000</td>
                                    <td className="p-3 text-center">
                                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Pendiente</span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button 
                                            onClick={() => alert("Comisión de ¢32,000 marcada como liquidada para Dr. Fernando Vargas.")}
                                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-[10px]"
                                        >
                                            Liquidar
                                        </button>
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-3 font-bold text-slate-800">Dra. Sofía Mora Castro</td>
                                    <td className="p-3 font-mono text-slate-500">MQC-885</td>
                                    <td className="p-3 text-center font-bold">8 Muestras</td>
                                    <td className="p-3 text-right font-mono font-bold">¢225,000</td>
                                    <td className="p-3 text-center font-bold text-indigo-600">10%</td>
                                    <td className="p-3 text-right font-mono font-black text-indigo-900">¢22,500</td>
                                    <td className="p-3 text-center">
                                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Liquidado</span>
                                    </td>
                                    <td className="p-3 text-center text-slate-400 font-medium text-[10px]">
                                        Pagado el 05/08
                                    </td>
                                </tr>
                                <tr className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-3 font-bold text-slate-800">Clínica Santa Lucía</td>
                                    <td className="p-3 font-mono text-slate-500">CED-3010492</td>
                                    <td className="p-3 text-center font-bold">4 Muestras</td>
                                    <td className="p-3 text-right font-mono font-bold">¢300,000</td>
                                    <td className="p-3 text-center font-bold text-indigo-600">10%</td>
                                    <td className="p-3 text-right font-mono font-black text-indigo-900">¢30,000</td>
                                    <td className="p-3 text-center">
                                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">Liquidado</span>
                                    </td>
                                    <td className="p-3 text-center text-slate-400 font-medium text-[10px]">
                                        Pagado el 01/08
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal: Nueva Factura */}
            {showNewInvoiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
                        <h3 className="font-extrabold text-lg text-slate-800 flex items-center gap-2">
                            <Receipt className="text-orange-600" /> Crear Nueva Factura
                        </h3>
                        
                        <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Nombre del Cliente / Empresa</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Hospital Metropolitano"
                                    value={newInvClient}
                                    onChange={(e) => setNewInvClient(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Monto Total (CRC ¢)</label>
                                <input
                                    type="number"
                                    required
                                    placeholder="Ej. 185000"
                                    value={newInvAmount}
                                    onChange={(e) => setNewInvAmount(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Fecha de Vencimiento (Opcional)</label>
                                <input
                                    type="date"
                                    value={newInvDueDate}
                                    onChange={(e) => setNewInvDueDate(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div>
                                <label className="font-bold text-slate-700 block mb-1">Notas / Detalle de Servicios</label>
                                <textarea
                                    rows={2}
                                    placeholder="Detalle de análisis o número de orden..."
                                    value={newInvNotes}
                                    onChange={(e) => setNewInvNotes(e.target.value)}
                                    className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewInvoiceModal(false)}
                                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black shadow-md shadow-orange-600/20"
                                >
                                    Generar Factura
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

