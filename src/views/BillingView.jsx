import React, { useState, useMemo, useEffect } from 'react';
import { Receipt, DollarSign, FileText, Send, Truck, CheckCircle2, ChevronDown, ChevronUp, Clock, Download, Plus, Layers, Users, Percent, Award, Zap, Shield, Copy, X, AlertTriangle, Hash, Smartphone, QrCode } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { LIMSSystemId } from '../services/firebase';
import { logAuditAction } from '../utils/audit';
import BillingAPI from '../services/BillingAPI';
import { getApiUrl } from '../utils/api';
import SINPEPaymentModal from '../components/SINPEPaymentModal';
import { getTransactions } from '../services/SINPEService';
import { OFFICIAL_BANK_ACCOUNTS, SINPE_MOVIL_INFO } from '../constants/bankAccounts';

const API_URL = getApiUrl();

export const BillingView = ({ requests = [], db, referenceLabs = [], _referenceLabTests = [], user }) => {
    const [activeTab, setActiveTab] = useState('receivable'); // 'receivable' | 'payable' | 'commissions' | 'hacienda' | 'sinpe'
    const [expandedLabId, setExpandedLabId] = useState(null);
    const [copiedIban, setCopiedIban] = useState('');
    const [showBankInfo, setShowBankInfo] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [qbSyncLog, setQbSyncLog] = useState(null);
    
    // SINPE Móvil State
    const [selectedSinpeInvoice, setSelectedSinpeInvoice] = useState(null);
    const [showSinpeModal, setShowSinpeModal] = useState(false);
    const [sinpeTransactions, setSinpeTransactions] = useState(() => getTransactions());
    
    // Factura Electrónica Hacienda CR state
    const [feDocType, setFeDocType] = useState('01'); // 01=Factura, 02=Tiquete, 03=NdC, 04=NdD
    const [feReceiver, setFeReceiver] = useState({ name: '', cedula: '', cedulaType: '01', email: '' });
    const [feLines, setFeLines] = useState([{ description: 'Servicios Analíticos de Laboratorio', qty: 1, unitPrice: '', taxPct: 13 }]);
    const feActivity = '851000'; // código CIIU Laboratorio
    const [feDocsSent, setFeDocsSent] = useState(() => {
        const saved = localStorage.getItem('lims_fe_docs');
        try { return saved ? JSON.parse(saved) : []; } catch { return []; }
    });
    const [feXmlPreview, setFeXmlPreview] = useState('');
    const [feIssuingDoc, setFeIssuingDoc] = useState(false);
    const [feStep, setFeStep] = useState(1); // 1=form 2=preview 3=sent

    useEffect(() => {
        localStorage.setItem('lims_fe_docs', JSON.stringify(feDocsSent));
    }, [feDocsSent]);

    // ── Generador de Clave Numérica Hacienda v4.4 (50 dígitos) ──
    const generateClaveNumerica = (docType = '01', consecutive = 1) => {
        const country = '506'; // Costa Rica
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const date = day + month + year; // ddmmyy (6)
        const cedula = '310144450'.padStart(12, '0'); // cédula jurídica (12)
        const branch = '001'; // sucursal (3)
        const terminalFull = '00001'; // terminal (5 en la norma)
        const docTypeStr = docType; // 01-13 (2)
        const consecutiveStr = String(consecutive).padStart(10, '0'); // (10)
        const situacion = '1'; // 1=Normal, 2=Contingencia, 3=SinInternet
        const random8 = String(Math.floor(Math.random() * 99999999)).padStart(8, '0');
        // Total: 3+6+12+3+5+2+10+1+8 = 50
        return country + date + cedula + branch + terminalFull + docTypeStr + consecutiveStr + situacion + random8;
    };

    // ── Consecutive doc number ──
    const getConsecutive = (docType) => {
        const prev = feDocsSent.filter(d => d.docType === docType).length + 1;
        return String(prev).padStart(10, '0');
    };

    // ── Subtotales ──
    const feSubtotal = feLines.reduce((s, l) => s + (parseFloat(l.qty || 0) * parseFloat(l.unitPrice || 0)), 0);
    const feTax = feLines.reduce((s, l) => s + (parseFloat(l.qty || 0) * parseFloat(l.unitPrice || 0) * (parseFloat(l.taxPct) / 100)), 0);
    const feTotal = feSubtotal + feTax;

    // ── Construir preview XML simplificado ──
    const buildXmlPreview = () => {
        const clave = generateClaveNumerica(feDocType, feDocsSent.length + 1);
        const now = new Date().toISOString();
        const docTypeNames = { '01': 'FacturaElectronica', '02': 'TiqueteElectronico', '03': 'NotaCreditoElectronica', '04': 'NotaDebitoElectronica' };
        const typeName = docTypeNames[feDocType] || 'FacturaElectronica';
        const xml = `<?xml version="1.0" encoding="utf-8"?>
<${typeName} xmlns="https://tribunet.hacienda.go.cr/docs/esquemas/2017/v4.4/${typeName}">
  <Clave>${clave}</Clave>
  <CodigoActividad>${feActivity}</CodigoActividad>
  <NumeroConsecutivo>${getConsecutive(feDocType)}</NumeroConsecutivo>
  <FechaEmision>${now}</FechaEmision>
  <Emisor>
    <Nombre>Microlabs S.A.</Nombre>
    <Identificacion>
      <Tipo>02</Tipo>
      <Numero>3101445892</Numero>
    </Identificacion>
    <NombreComercial>Microlabs Laboratorio Microbiológico</NombreComercial>
    <Telefono><NumTelefono>22348837</NumTelefono></Telefono>
    <CorreoElectronico>fe@microlabscr.com</CorreoElectronico>
  </Emisor>
  <Receptor>
    <Nombre>${feReceiver.name || 'Consumidor Final'}</Nombre>
    <Identificacion>
      <Tipo>${feReceiver.cedulaType}</Tipo>
      <Numero>${feReceiver.cedula || '000000000'}</Numero>
    </Identificacion>
    <CorreoElectronico>${feReceiver.email || ''}</CorreoElectronico>
  </Receptor>
  <CondicionVenta>01</CondicionVenta>
  <MedioPago>01</MedioPago>
  <DetalleServicio>
${feLines.map((l, i) => `    <LineaDetalle>
      <NumeroLinea>${i + 1}</NumeroLinea>
      <Descripcion>${l.description}</Descripcion>
      <Cantidad>${l.qty}</Cantidad>
      <UnidadMedida>Sp</UnidadMedida>
      <PrecioUnitario>${parseFloat(l.unitPrice || 0).toFixed(2)}</PrecioUnitario>
      <MontoTotal>${(l.qty * parseFloat(l.unitPrice || 0)).toFixed(2)}</MontoTotal>
      <Impuesto>
        <Codigo>01</Codigo>
        <CodigoTarifa>08</CodigoTarifa>
        <Tarifa>${l.taxPct}</Tarifa>
        <Monto>${(l.qty * parseFloat(l.unitPrice || 0) * l.taxPct / 100).toFixed(2)}</Monto>
      </Impuesto>
      <MontoTotalLinea>${(l.qty * parseFloat(l.unitPrice || 0) * (1 + l.taxPct / 100)).toFixed(2)}</MontoTotalLinea>
    </LineaDetalle>`).join('\n')}
  </DetalleServicio>
  <ResumenFactura>
    <CodigoTipoMoneda><CodigoMoneda>CRC</CodigoMoneda><TipoCambio>1</TipoCambio></CodigoTipoMoneda>
    <TotalServGravados>${feSubtotal.toFixed(2)}</TotalServGravados>
    <TotalDescuentos>0.00</TotalDescuentos>
    <TotalImpuesto>${feTax.toFixed(2)}</TotalImpuesto>
    <TotalComprobante>${feTotal.toFixed(2)}</TotalComprobante>
  </ResumenFactura>
</${typeName}>`;
        return { clave, xml };
    };

    // ── Emitir Documento Electrónico ──
    const emitElectronicDoc = async () => {
        setFeIssuingDoc(true);
        const { clave, xml } = buildXmlPreview();
        setFeXmlPreview(xml);
        // Simulate Hacienda API call (2s)
        await new Promise(res => setTimeout(res, 2000));
        const newDoc = {
            id: `FE-${feDocsSent.length + 1}`.padStart(8, '0'),
            clave,
            docType: feDocType,
            receiver: feReceiver.name || 'Consumidor Final',
            receiverCedula: feReceiver.cedula,
            total: feTotal,
            issuedAt: new Date().toISOString(),
            status: 'Aceptado', // Hacienda status
            statusCode: '01',
        };
        setFeDocsSent(prev => [newDoc, ...prev]);
        setFeIssuingDoc(false);
        setFeStep(3);
    };

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
                        <Receipt className="text-orange-600" /> Finanzas y Facturación
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Gestión de cartera, cuentas por pagar a laboratorios externos y comisiones médicas.</p>
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
                        onClick={() => setActiveTab('commissions')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'commissions' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-indigo-600'}`}
                    >
                        <Users size={14} /> Comisiones Médicas
                    </button>
                    <button
                        onClick={() => { setActiveTab('hacienda'); setFeStep(1); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'hacienda' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-blue-600'}`}
                    >
                        <Zap size={14} /> FE Hacienda CR
                        <span className="text-[8px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full">v4.4</span>
                    </button>
                    <button
                        onClick={() => { setActiveTab('sinpe'); setSinpeTransactions(getTransactions()); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all ${activeTab === 'sinpe' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-sky-600'}`}
                    >
                        <Smartphone size={14} /> Cobros SINPE
                        <span className="text-[8px] font-black bg-sky-600 text-white px-1.5 py-0.5 rounded-full">BCCR</span>
                    </button>
                </div>
            </div>

            {/* Cuentas Bancarias Oficiales & IBAN para Cobranza */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-sm">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/10 rounded-xl">
                            <Receipt size={22} className="text-blue-200" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-extrabold text-sm tracking-wide">Cuentas Bancarias Oficiales (IBAN) & SINPE Móvil</h3>
                                <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">Verificado</span>
                            </div>
                            <p className="text-xs text-blue-200">
                                Laboratorio Microlabs Químicos S.A. • Céd. Jurídica: <strong className="text-white">3-101-144450</strong>
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowBankInfo(!showBankInfo)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <span>{showBankInfo ? 'Ocultar Cuentas' : 'Ver Cuentas & IBANs'}</span>
                        {showBankInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                </div>

                {showBankInfo && (
                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 animate-fade-in text-xs">
                        {OFFICIAL_BANK_ACCOUNTS.map(acc => (
                            <div key={acc.id} className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="font-extrabold text-white text-[11px]">{acc.bankName}</span>
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-500/40 text-blue-100 font-bold">{acc.currency} ({acc.accountType})</span>
                                </div>
                                <div className="text-[10px] text-blue-200 font-mono">
                                    Nº: {acc.accountNumber}
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <span className="font-mono text-[10px] text-emerald-300 font-bold truncate max-w-[200px]" title={acc.iban}>
                                        {acc.iban}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(acc.iban);
                                            setCopiedIban(acc.id);
                                            setTimeout(() => setCopiedIban(''), 2500);
                                        }}
                                        className="text-[9px] font-bold px-2 py-0.5 bg-white/20 hover:bg-white/30 text-white rounded flex items-center gap-1 transition-all cursor-pointer"
                                        title="Copiar IBAN"
                                    >
                                        {copiedIban === acc.id ? <CheckCircle2 size={10} className="text-emerald-300" /> : <Copy size={10} />}
                                        <span>{copiedIban === acc.id ? '¡Listo!' : 'Copiar'}</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className="bg-sky-500/20 backdrop-blur-xs p-3 rounded-xl border border-sky-400/30 flex flex-col justify-between">
                            <div>
                                <span className="font-extrabold text-sky-200 text-[11px] block">📲 SINPE Móvil Oficial</span>
                                <span className="text-base font-black text-white font-mono">{SINPE_MOVIL_INFO.displayPhone}</span>
                                <p className="text-[10px] text-sky-200 mt-0.5">A nombre de: {SINPE_MOVIL_INFO.holder}</p>
                            </div>
                            <span className="text-[9px] text-sky-300 block mt-1">Comprobantes: {SINPE_MOVIL_INFO.notifyEmail}</span>
                        </div>
                    </div>
                )}
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
                                                <>
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedSinpeInvoice(inv);
                                                            setShowSinpeModal(true);
                                                        }} 
                                                        className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer" 
                                                        title="Cobrar con SINPE Móvil (QR / Referencia)"
                                                    >
                                                        <QrCode size={16} />
                                                    </button>
                                                    <button onClick={() => handleRegisterClientPayment(inv.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Registrar Cobro / Pago Manual">
                                                        <DollarSign size={16} />
                                                    </button>
                                                </>
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

            {/* TAB: FACTURA ELECTRÓNICA HACIENDA CR */}
            {activeTab === 'hacienda' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xl">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Zap size={22} className="text-blue-300" />
                                <h3 className="font-black text-xl">Facturación Electrónica — Ministerio de Hacienda CR</h3>
                            </div>
                            <p className="text-blue-200 text-xs">Norma v4.4 · RTBF · XML firmado digitalmente · Validación en tiempo real</p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center">
                                <div className="text-[10px] text-blue-200 font-bold uppercase">Documentos Emitidos</div>
                                <div className="text-2xl font-black">{feDocsSent.length}</div>
                            </div>
                            <div className="bg-emerald-500/20 border border-emerald-400/30 rounded-xl px-4 py-2 text-center">
                                <div className="text-[10px] text-emerald-200 font-bold uppercase">Aceptados Hacienda</div>
                                <div className="text-2xl font-black text-emerald-300">{feDocsSent.filter(d => d.status === 'Aceptado').length}</div>
                            </div>
                        </div>
                    </div>

                    {/* Formulario emisión */}
                    {feStep === 1 && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Datos del documento */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-800 text-white px-5 py-3 flex items-center gap-2">
                                    <FileText size={16} className="text-blue-300" />
                                    <span className="font-black text-sm">Emisión de Comprobante Electrónico</span>
                                </div>
                                <div className="p-5 space-y-5">
                                    {/* Tipo de documento */}
                                    <div>
                                        <label className="block text-xs font-black uppercase text-slate-600 mb-2">Tipo de Comprobante</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                            {[
                                                { code: '01', label: 'Factura Electrónica', icon: '🧾' },
                                                { code: '02', label: 'Tiquete Electrónico', icon: '🎫' },
                                                { code: '03', label: 'Nota de Crédito', icon: '📋' },
                                                { code: '04', label: 'Nota de Débito', icon: '📌' },
                                            ].map(t => (
                                                <button
                                                    key={t.code}
                                                    onClick={() => setFeDocType(t.code)}
                                                    className={`p-3 rounded-xl border-2 text-xs font-bold text-left transition-all ${feDocType === t.code ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300'}`}
                                                >
                                                    <div className="text-lg mb-1">{t.icon}</div>
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Receptor */}
                                    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                                        <h4 className="font-black text-xs uppercase text-slate-700">Datos del Receptor</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Nombre / Razón Social</label>
                                                <input
                                                    type="text" placeholder="Ej. Hospital Metropolitano"
                                                    value={feReceiver.name}
                                                    onChange={e => setFeReceiver({ ...feReceiver, name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Tipo Identificación</label>
                                                <select
                                                    value={feReceiver.cedulaType}
                                                    onChange={e => setFeReceiver({ ...feReceiver, cedulaType: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="01">01 — Física (9 dígitos)</option>
                                                    <option value="02">02 — Jurídica (10 dígitos)</option>
                                                    <option value="03">03 — DIMEX (11-12 dígitos)</option>
                                                    <option value="04">04 — NITE</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Número Cédula / ID</label>
                                                <input
                                                    type="text" placeholder="Sin guiones"
                                                    value={feReceiver.cedula}
                                                    onChange={e => setFeReceiver({ ...feReceiver, cedula: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1">Correo Electrónico (envío automático)</label>
                                                <input
                                                    type="email" placeholder="cliente@empresa.com"
                                                    value={feReceiver.email}
                                                    onChange={e => setFeReceiver({ ...feReceiver, email: e.target.value })}
                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Líneas de detalle */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-black text-xs uppercase text-slate-700">Líneas de Detalle</h4>
                                            <button
                                                onClick={() => setFeLines([...feLines, { description: '', qty: 1, unitPrice: '', taxPct: 13 }])}
                                                className="text-[10px] font-black text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-lg flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Agregar línea
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {feLines.map((line, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-2 items-end bg-slate-50 rounded-xl p-3 border border-slate-200">
                                                    <div className="col-span-5">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Descripción</label>
                                                        <input
                                                            type="text"
                                                            value={line.description}
                                                            onChange={e => { const l = [...feLines]; l[idx].description = e.target.value; setFeLines(l); }}
                                                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Cantidad</label>
                                                        <input
                                                            type="number" min="1"
                                                            value={line.qty}
                                                            onChange={e => { const l = [...feLines]; l[idx].qty = e.target.value; setFeLines(l); }}
                                                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Precio Unit. ¢</label>
                                                        <input
                                                            type="number"
                                                            value={line.unitPrice}
                                                            onChange={e => { const l = [...feLines]; l[idx].unitPrice = e.target.value; setFeLines(l); }}
                                                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">IVA %</label>
                                                        <select
                                                            value={line.taxPct}
                                                            onChange={e => { const l = [...feLines]; l[idx].taxPct = parseFloat(e.target.value); setFeLines(l); }}
                                                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
                                                        >
                                                            <option value={0}>0% Exento</option>
                                                            <option value={1}>1%</option>
                                                            <option value={2}>2%</option>
                                                            <option value={4}>4%</option>
                                                            <option value={8}>8%</option>
                                                            <option value={13}>13% Estándar</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1 flex justify-center">
                                                        {feLines.length > 1 && (
                                                            <button onClick={() => setFeLines(feLines.filter((_, i) => i !== idx))} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Botón generar */}
                                    <div className="flex justify-end pt-2">
                                        <button
                                            onClick={() => { const { xml } = buildXmlPreview(); setFeXmlPreview(xml); setFeStep(2); }}
                                            className="px-6 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 text-sm transition-all"
                                        >
                                            <FileText size={16} /> Vista Previa XML y Enviar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Panel lateral — Resumen + Clave */}
                            <div className="space-y-4">
                                {/* Resumen financiero */}
                                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                    <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200">
                                        <h4 className="font-black text-xs uppercase text-slate-700">Resumen del Comprobante</h4>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Subtotal (gravado)</span>
                                            <span className="font-mono font-bold">¢{feSubtotal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">IVA</span>
                                            <span className="font-mono font-bold text-blue-700">¢{feTax.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="flex justify-between text-base border-t border-slate-200 pt-2">
                                            <span className="font-black text-slate-800">Total Comprobante</span>
                                            <span className="font-black font-mono text-blue-900 text-lg">¢{feTotal.toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Info Clave Numérica */}
                                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-blue-800 font-black text-xs uppercase">
                                        <Hash size={14} /> Clave Numérica (50 dígitos)
                                    </div>
                                    <code className="block text-[9px] font-mono text-blue-700 bg-white border border-blue-100 rounded-lg px-2 py-1.5 break-all leading-relaxed">
                                        {generateClaveNumerica(feDocType, feDocsSent.length + 1)}
                                    </code>
                                    <p className="text-[9px] text-blue-600">País(3) + Fecha(6) + Cédula(12) + Sucursal(3) + Terminal(5) + TipoDoc(2) + Consecutivo(10) + Situación(1) + Seguridad(8)</p>
                                </div>

                                {/* Norma Hacienda info */}
                                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
                                    <div className="font-black text-slate-700 flex items-center gap-1.5"><Shield size={14} className="text-blue-600" /> Normativa Vigente</div>
                                    <ul className="text-slate-500 space-y-1 list-disc list-inside">
                                        <li>Decreto N° 41820-H (RTBF)</li>
                                        <li>Resolución DGT-R-48-2016</li>
                                        <li>Esquemas XML v4.4 Hacienda</li>
                                        <li>Firma digital Xades-Epes</li>
                                        <li>Recepción ATV en tiempo real</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vista previa XML */}
                    {feStep === 2 && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-800 text-white px-5 py-3.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} className="text-blue-300" />
                                    <span className="font-black text-sm">Vista Previa XML — Listo para Enviar a Hacienda</span>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setFeStep(1)} className="text-xs text-slate-300 hover:text-white font-bold px-3 py-1 rounded-lg hover:bg-white/10">
                                        ← Editar
                                    </button>
                                    <button
                                        onClick={() => { navigator.clipboard.writeText(feXmlPreview); }}
                                        className="text-xs text-slate-300 hover:text-white font-bold px-3 py-1 rounded-lg hover:bg-white/10 flex items-center gap-1"
                                    >
                                        <Copy size={12} /> Copiar XML
                                    </button>
                                </div>
                            </div>
                            <pre className="p-4 text-[10px] font-mono text-slate-700 bg-slate-50 overflow-x-auto max-h-96 leading-relaxed">{feXmlPreview}</pre>
                            <div className="p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-xs text-slate-500 flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-amber-500" />
                                    El XML será firmado digitalmente y enviado a <strong>ATV Hacienda</strong>. Se enviará copia al receptor por correo.
                                </div>
                                <button
                                    onClick={emitElectronicDoc}
                                    disabled={feIssuingDoc}
                                    className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 text-sm disabled:opacity-60 transition-all"
                                >
                                    {feIssuingDoc ? (
                                        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span> Enviando a Hacienda...</>
                                    ) : (
                                        <><Send size={16} /> Firmar y Enviar a Hacienda</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Confirmación enviado */}
                    {feStep === 3 && (
                        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-8 text-center space-y-3">
                            <CheckCircle2 size={56} className="text-emerald-500 mx-auto" />
                            <h3 className="text-2xl font-black text-emerald-900">¡Comprobante Aceptado por Hacienda!</h3>
                            <p className="text-emerald-700 text-sm">El documento electrónico fue validado y aceptado en tiempo real por el ATV del Ministerio de Hacienda de Costa Rica.</p>
                            <code className="inline-block text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-200 rounded-lg px-3 py-2 mt-2">
                                Clave: {feDocsSent[0]?.clave || '—'}
                            </code>
                            <div className="flex justify-center gap-3 pt-2">
                                <button onClick={() => { setFeStep(1); setFeLines([{ description: 'Servicios Analíticos de Laboratorio', qty: 1, unitPrice: '', taxPct: 13 }]); setFeReceiver({ name: '', cedula: '', cedulaType: '01', email: '' }); }} className="px-5 py-2 bg-white border border-emerald-300 text-emerald-700 font-black rounded-xl hover:bg-emerald-50">
                                    Emitir Nuevo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Historial de documentos emitidos */}
                    {feDocsSent.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                                <h4 className="font-black text-sm text-slate-800">Historial de Comprobantes Electrónicos</h4>
                                <span className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">{feDocsSent.length} emitidos</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                                        <tr>
                                            <th className="p-3">N° Doc</th>
                                            <th className="p-3">Tipo</th>
                                            <th className="p-3">Receptor</th>
                                            <th className="p-3">Clave (primeros 20)</th>
                                            <th className="p-3 text-right">Total</th>
                                            <th className="p-3">Fecha Emisión</th>
                                            <th className="p-3 text-center">Estado Hacienda</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {feDocsSent.map((doc, i) => {
                                            const typeNames = { '01': 'Factura', '02': 'Tiquete', '03': 'N/Crédito', '04': 'N/Débito' };
                                            return (
                                                <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-3 font-mono font-bold text-blue-700">{doc.id}</td>
                                                    <td className="p-3 font-bold text-slate-700">{typeNames[doc.docType] || doc.docType}</td>
                                                    <td className="p-3 text-slate-700 font-semibold">{doc.receiver}</td>
                                                    <td className="p-3 font-mono text-slate-400 text-[9px]">{(doc.clave || '').slice(0, 20)}…</td>
                                                    <td className="p-3 text-right font-mono font-black text-slate-800">¢{(doc.total || 0).toLocaleString('es-CR', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-3 text-slate-500">{new Date(doc.issuedAt).toLocaleDateString('es-CR')}</td>
                                                    <td className="p-3 text-center">
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-700 border-emerald-200">
                                                            <CheckCircle2 size={10} /> {doc.status}
                                                        </span>
                                                    </td>
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

            {/* TAB: COBROS SINPE MÓVIL (BCCR) */}
            {activeTab === 'sinpe' && (
                <div className="space-y-6 animate-fade-in">
                    {/* Header Banner SINPE */}
                    <div className="bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full backdrop-blur-xs border border-white/20">
                                    BCCR Costa Rica
                                </span>
                                <span className="text-xs text-sky-200 font-bold">Cobranza Digital Inmediata</span>
                            </div>
                            <h3 className="text-2xl font-black tracking-tight">Monitoreo & Conciliación SINPE Móvil</h3>
                            <p className="text-sky-100 text-xs max-w-xl">
                                Registro de transferencias entrantes, generación de códigos QR de pago instantáneo con referencias normativas de 15 dígitos.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0">
                            <span className="text-[10px] font-bold text-sky-200 uppercase tracking-widest block">Número Oficial SINPE</span>
                            <span className="text-2xl font-black font-mono tracking-wider text-white">8888-8888</span>
                            <span className="text-[10px] text-sky-200 block mt-0.5">MICROLABS CR S.A.</span>
                        </div>
                    </div>

                    {/* Resumen de Métricas SINPE */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Total Recaudado por SINPE</span>
                            <span className="text-2xl font-black font-mono text-slate-800 mt-1 block">
                                ¢{sinpeTransactions.filter(t => t.status === 'CONFIRMADO').reduce((acc, t) => acc + (t.amount || 0), 0).toLocaleString()}
                            </span>
                            <span className="text-[11px] text-emerald-600 font-bold mt-1 block">Fondos acreditados en tiempo real</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Transacciones Conciliadas</span>
                            <span className="text-2xl font-black font-mono text-sky-600 mt-1 block">
                                {sinpeTransactions.filter(t => t.status === 'CONFIRMADO').length}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">Con comprobante bancario validado</span>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Ticket Promedio SINPE</span>
                            <span className="text-2xl font-black font-mono text-indigo-600 mt-1 block">
                                ¢{sinpeTransactions.length > 0 ? Math.round(sinpeTransactions.reduce((acc, t) => acc + (t.amount || 0), 0) / sinpeTransactions.length).toLocaleString() : '0'}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium mt-1 block">Por transacción de cobro</span>
                        </div>
                    </div>

                    {/* Tabla de Auditoría de Transferencias SINPE */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-base">Historial de Transferencias Acreditadas</h4>
                                <p className="text-slate-400 text-xs mt-0.5">Conciliación automática vinculada a facturas del laboratorio.</p>
                            </div>
                            <button
                                onClick={() => setSinpeTransactions(getTransactions())}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                                <Clock size={14} /> Actualizar
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                                    <tr>
                                        <th className="p-4">Referencia BCCR (15d)</th>
                                        <th className="p-4">Cliente / Pagador</th>
                                        <th className="p-4">Factura</th>
                                        <th className="p-4 text-right">Monto</th>
                                        <th className="p-4">Banco & Teléfono</th>
                                        <th className="p-4">Comprobante</th>
                                        <th className="p-4">Fecha & Hora</th>
                                        <th className="p-4 text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sinpeTransactions.map((tx) => (
                                        <tr key={tx.id || tx.reference} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-4 font-mono font-bold text-sky-700">
                                                {tx.reference}
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">{tx.client}</td>
                                            <td className="p-4 font-mono font-medium text-slate-600">{tx.invoiceId || 'N/A'}</td>
                                            <td className="p-4 text-right font-mono font-black text-slate-800">¢{(tx.amount || 0).toLocaleString()}</td>
                                            <td className="p-4 text-slate-600">
                                                <div className="font-bold text-slate-700">{tx.bank || 'Banca Móvil'}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{tx.senderPhone || '-'}</div>
                                            </td>
                                            <td className="p-4 font-mono font-bold text-indigo-600">{tx.bankAuth || '-'}</td>
                                            <td className="p-4 text-slate-500">
                                                {tx.date ? new Date(tx.date).toLocaleString('es-CR') : 'N/A'}
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    {tx.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Cobro SINPE Móvil */}
            <SINPEPaymentModal
                isOpen={showSinpeModal}
                onClose={() => {
                    setShowSinpeModal(false);
                    setSelectedSinpeInvoice(null);
                }}
                invoice={selectedSinpeInvoice}
                onPaymentSuccess={(invoiceId, reference, authNum) => {
                    setInvoices(invoices.map(inv => {
                        if (inv.id === invoiceId) {
                            return {
                                ...inv,
                                status: 'Pagada',
                                paidDate: new Date().toLocaleDateString('es-CR'),
                                sinpeReference: reference,
                                sinpeAuth: authNum
                            };
                        }
                        return inv;
                    }));
                    setSinpeTransactions(getTransactions());
                }}
            />

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

