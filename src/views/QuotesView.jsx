import React, { useState, useMemo } from 'react';
import { Calculator, Percent, Plus, Trash2, FileText, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import catalogData from '../data/cmqccr_catalog.json';

export const QuotesView = () => {
    const [clients] = useState([
        { id: 'C-001', name: 'Hospital Central', type: 'Institucional', discount: 15 },
        { id: 'C-002', name: 'Empresa Soya S.A.', type: 'Industrial', discount: 10 },
        { id: 'C-003', name: 'Lácteos del Sur', type: 'Industrial', discount: 5 },
        { id: 'C-004', name: 'Paciente Particular', type: 'Privado', discount: 0 }
    ]);

    const [selectedClient, setSelectedClient] = useState('');
    const [quoteItems, setQuoteItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [customItemName, setCustomItemName] = useState('');
    const [customItemPrice, setCustomItemPrice] = useState('');
    
    // Use stable ID for PDF to avoid re-renders changing it
    const [quoteId] = useState(() => new Date().getTime().toString().slice(-6));
    const [quoteDate] = useState(() => new Date().toLocaleDateString());

    // Filter out categories (items without price) and filter by search query
    const availableTests = useMemo(() => catalogData.filter(item => item.price).map(item => ({
        ...item,
        price: parseFloat(item.price) || 0
    })), []);

    const filteredTests = availableTests.filter(test => 
        test.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        test.code.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 50); // Limit to 50 results for performance

    const selectedClientData = clients.find(c => c.id === selectedClient);
    
    const subTotal = quoteItems.reduce((sum, item) => sum + item.price, 0);
    const discountAmount = selectedClientData ? subTotal * (selectedClientData.discount / 100) : 0;
    const finalPrice = subTotal - discountAmount;

    const handleAddTest = (test) => {
        setQuoteItems([...quoteItems, { id: crypto.randomUUID(), ...test }]);
        setSearchQuery('');
        setIsDropdownOpen(false);
    };

    const handleAddCustomTest = () => {
        if (!customItemName || !customItemPrice) return;
        setQuoteItems([...quoteItems, {
            id: crypto.randomUUID(),
            code: 'MANUAL',
            name: customItemName,
            price: parseFloat(customItemPrice) || 0
        }]);
        setCustomItemName('');
        setCustomItemPrice('');
    };

    const handleRemoveItem = (id) => {
        if (window.confirm("¿Está seguro de remover este análisis de la cotización?")) {
            setQuoteItems(quoteItems.filter(item => item.id !== id));
        }
    };

    const handleGeneratePDF = () => {
        if (!selectedClientData || quoteItems.length === 0) {
            alert("Seleccione un cliente y añada al menos un análisis.");
            return;
        }

        const element = document.getElementById('quote-pdf-template');
        element.style.display = 'block';

        const opt = {
            margin: 0.5,
            filename: `Cotizacion_${selectedClientData.name.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            element.style.display = 'none';
        });
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2"><Calculator className="text-indigo-600" /> Generador de Cotizaciones</h2>
                    <p className="text-slate-500 text-sm mt-1">Cálculo dinámico basado en catálogo clínico, aguas y alimentos.</p>
                </div>
                <button 
                    onClick={handleGeneratePDF}
                    disabled={quoteItems.length === 0 || !selectedClient}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={18} /> Imprimir / PDF
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    {/* Panel de Cliente y Selección */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Cliente / Empresa</label>
                                <select
                                    value={selectedClient}
                                    onChange={(e) => setSelectedClient(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-semibold text-slate-800"
                                >
                                    <option value="">-- Seleccionar Cliente --</option>
                                    {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                                </select>
                            </div>
                            
                            <div className="relative">
                                <label className="block text-sm font-bold text-slate-700 mb-2">Agregar Análisis (Buscar en Catálogo)</label>
                                <input 
                                    type="text"
                                    placeholder="Ej. Hemograma, Glucosa, NMP..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setIsDropdownOpen(true);
                                    }}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                />
                                {isDropdownOpen && searchQuery && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                                        {Object.entries(filteredTests.reduce((acc, test) => {
                                            const cat = test.category || 'General';
                                            if (!acc[cat]) acc[cat] = [];
                                            acc[cat].push(test);
                                            return acc;
                                        }, {})).map(([category, tests]) => (
                                            <div key={category}>
                                                <div className="px-3 py-1 bg-slate-100 text-xs font-bold text-slate-500 uppercase sticky top-0">{category}</div>
                                                {tests.map(test => (
                                                    <div 
                                                        key={test.code}
                                                        onClick={() => handleAddTest(test)}
                                                        className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0"
                                                    >
                                                        <div>
                                                            <span className="font-bold text-slate-800 text-sm">{test.name}</span>
                                                            <span className="text-xs text-slate-400 ml-2 font-mono">{test.code}</span>
                                                        </div>
                                                        <span className="font-bold text-emerald-600 text-sm">¢{test.price.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                        {filteredTests.length === 0 && (
                                            <div className="p-3 text-slate-400 text-sm text-center">No se encontraron análisis.</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Agregar ítem manual */}
                        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Ítem Personalizado</label>
                                <input 
                                    type="text" placeholder="Descripción del análisis o servicio" 
                                    value={customItemName} onChange={e => setCustomItemName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Precio (¢)</label>
                                <input 
                                    type="number" placeholder="0" 
                                    value={customItemPrice} onChange={e => setCustomItemPrice(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <button 
                                onClick={handleAddCustomTest}
                                disabled={!customItemName || !customItemPrice}
                                className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-900 transition-colors h-[38px] flex items-center gap-1 disabled:opacity-50"
                            >
                                <Plus size={16} /> Añadir
                            </button>
                        </div>
                    </div>

                    {/* Tabla de Items */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="p-4 font-bold text-slate-600 w-24">Código</th>
                                    <th className="p-4 font-bold text-slate-600">Descripción del Análisis</th>
                                    <th className="p-4 font-bold text-slate-600 text-right w-32">Precio Unit.</th>
                                    <th className="p-4 w-12"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {quoteItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-8 text-center text-slate-400">
                                            No hay ítems en la cotización. Busque análisis en el catálogo arriba.
                                        </td>
                                    </tr>
                                ) : (
                                    quoteItems.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="p-4 font-mono text-xs text-indigo-600 font-bold">{item.code}</td>
                                            <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                            <td className="p-4 text-right font-mono font-bold text-slate-700">¢{item.price.toLocaleString()}</td>
                                            <td className="p-4">
                                                <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1 rounded transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Panel Resumen (Motor de Precios) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-max sticky top-6">
                    <h3 className="text-lg font-extrabold text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                        <FileText className="text-indigo-600" size={20} /> Resumen de Cotización
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-slate-600 text-sm">
                            <span className="font-bold">Subtotal ({quoteItems.length} ítems):</span>
                            <span className="font-mono text-base font-bold">¢{subTotal.toLocaleString()}</span>
                        </div>

                        {selectedClientData && selectedClientData.discount > 0 && (
                            <div className="flex justify-between items-center text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-sm">
                                <span className="font-bold flex items-center gap-1">
                                    <Percent size={14} /> Dto. {selectedClientData.type} ({selectedClientData.discount}%)
                                </span>
                                <span className="font-mono font-bold">-¢{discountAmount.toLocaleString()}</span>
                            </div>
                        )}

                        {selectedClientData && selectedClientData.discount === 0 && (
                            <div className="text-xs text-slate-400 italic text-center">Sin descuentos aplicables a este perfil comercial.</div>
                        )}

                        <div className="pt-4 mt-4 border-t-2 border-dashed border-slate-200 flex flex-col items-center">
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">Monto Total a Pagar</span>
                            <span className="font-extrabold text-4xl text-indigo-700 font-mono tracking-tight">¢{finalPrice.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden PDF Template */}
            <div id="quote-pdf-template" className="bg-white p-8 absolute -left-[9999px] top-0 w-[800px] text-slate-800 hidden">
                <div className="flex justify-between items-start border-b-2 border-indigo-600 pb-6 mb-6">
                    <div>
                        <img src="https://www.microlabscr.com/s/misc/logo.jpg" alt="Microlabs Logo" className="h-16 object-contain mb-2" />
                        <p className="text-xs text-slate-500 font-bold">Laboratorio Microlabs Químicos S.A.</p>
                        <p className="text-xs text-slate-500">San José, Costa Rica</p>
                        <p className="text-xs text-slate-500">Tel: (506) 2222-3333 | info@microlabscr.com</p>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-black text-indigo-700 uppercase tracking-widest">PROFORMA</h1>
                        <p className="text-sm font-bold mt-2">Nº: PRO-{quoteId}</p>
                        <p className="text-sm">Fecha: {quoteDate}</p>
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-lg mb-8 border border-slate-200">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Cliente / Empresa</h2>
                    <p className="text-xl font-bold text-slate-800">{selectedClientData?.name || 'Cliente Particular'}</p>
                    <p className="text-sm text-slate-600">Perfil Comercial: {selectedClientData?.type || 'No especificado'}</p>
                </div>

                <table className="w-full text-left mb-8 border-collapse">
                    <thead>
                        <tr className="bg-indigo-600 text-white text-sm">
                            <th className="p-3 font-bold border border-indigo-700">Código</th>
                            <th className="p-3 font-bold border border-indigo-700">Descripción del Análisis</th>
                            <th className="p-3 font-bold text-right border border-indigo-700 w-32">Precio (CRC)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quoteItems.map(item => (
                            <tr key={item.id} className="border-b border-slate-200 text-sm">
                                <td className="p-3 font-mono text-slate-600">{item.code}</td>
                                <td className="p-3 font-bold">{item.name}</td>
                                <td className="p-3 text-right font-mono">¢{item.price.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end">
                    <div className="w-64 space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>Subtotal:</span>
                            <span className="font-mono">¢{subTotal.toLocaleString()}</span>
                        </div>
                        {discountAmount > 0 && (
                            <div className="flex justify-between text-emerald-600 font-bold border-b border-slate-200 pb-2">
                                <span>Descuento ({selectedClientData?.discount}%):</span>
                                <span className="font-mono">-¢{discountAmount.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-xl font-black text-indigo-700 pt-2">
                            <span>TOTAL:</span>
                            <span className="font-mono">¢{finalPrice.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-300 text-center text-xs text-slate-500">
                    <p className="mb-1 font-bold">CONDICIONES DE LA COTIZACIÓN</p>
                    <p>Precios válidos por 30 días. Los tiempos de entrega (TAT) dependen de la complejidad de cada ensayo.</p>
                    <p className="mt-4 italic text-[10px]">Documento generado electrónicamente por LIMS-Pro Microlabs.</p>
                </div>
            </div>
        </div>
    );
};
