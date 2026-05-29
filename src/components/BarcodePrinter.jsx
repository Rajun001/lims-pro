import React, { useRef } from 'react';
import Barcode from 'react-barcode';
import { Printer } from 'lucide-react';

export const BarcodePrinter = ({ requestId, patientName, testName }) => {
    const printRef = useRef(null);
    const shortId = requestId ? requestId.substring(0, 8).toUpperCase() : 'UNKNOWN';

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '', 'width=600,height=400');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Barcode - ${shortId}</title>
                    <style>
                        @page { size: auto; margin: 0mm; }
                        body { 
                            margin: 0; 
                            padding: 10px; 
                            font-family: sans-serif;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                        }
                        .label-container {
                            width: 50mm;
                            height: 25mm;
                            text-align: center;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                        }
                        .patient-name {
                            font-size: 8px;
                            font-weight: bold;
                            margin-bottom: 2px;
                            max-width: 100%;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;
                        }
                        .test-name {
                            font-size: 7px;
                            margin-top: 2px;
                        }
                    </style>
                </head>
                <body>
                    <div class="label-container">
                        <div class="patient-name">${patientName || 'Muestra LIMS'}</div>
                        ${printContent.innerHTML}
                        <div class="test-name">${testName || 'Análisis Estándar'}</div>
                    </div>
                    <script>
                        window.onload = () => {
                            window.print();
                            setTimeout(() => window.close(), 500);
                        }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center animate-fade-in">
            <h4 className="text-sm font-bold text-slate-800 mb-3 w-full text-left">Etiqueta de Tubo</h4>
            <div ref={printRef} className="bg-white p-2 rounded-lg border border-slate-100 flex items-center justify-center">
                <Barcode 
                    value={shortId} 
                    width={1.5} 
                    height={40} 
                    fontSize={12} 
                    margin={0}
                    displayValue={true}
                    background="#ffffff"
                    lineColor="#000000"
                />
            </div>
            <button 
                onClick={handlePrint}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
            >
                <Printer size={16} /> Imprimir Etiqueta
            </button>
            <p className="text-[10px] text-slate-400 mt-2 text-center">Compatible con impresoras térmicas (Zebra, Dymo)</p>
        </div>
    );
};
