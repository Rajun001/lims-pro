import React from 'react';

/**
 * ReportSignatures.jsx — LIMS-PRO Microlabs
 * Firmas digitales visuales y sellos profesionales de regencia con soporte de selección dinámica
 * Profesionales configurados:
 * - Dr. Roldan Ajún Chaverri: Director Técnico & Regente Principal (M.Q.C. Reg. #802)
 * - M.Q.C. José Guillermo Ajún Jiménez: Microbiólogo Analista / Técnico Complementario
 * - M.Q.C. Roldán Alberto Ajún Jiménez: Microbiólogo Analista / Co-firmante
 */

// Catálogo y presets de firmas se gestionan en src/constants/signatures.js

// Sello Oficial de Regencia CMQC (Colegio de Microbiólogos y Químicos Clínicos de Costa Rica)
export const OfficialRegencyStamp = ({ code = '802', _name = 'Dr. Roldan Ajún Chaverri', _title = 'REGENCIA FARMACÉUTICA Y CLÍNICA' }) => (
    <div className="relative w-20 h-20 border-2 border-dashed border-blue-800/60 rounded-full flex flex-col items-center justify-center p-1 rotate-[-6deg] select-none pointer-events-none opacity-85 bg-blue-50/20">
        <div className="w-[70px] h-[70px] border border-blue-900/50 rounded-full flex flex-col items-center justify-center text-center p-1">
            <span className="text-[5px] font-black text-blue-950 uppercase tracking-tighter leading-none">COSTA RICA</span>
            <span className="text-[4px] font-bold text-blue-800 uppercase tracking-tighter my-0.5">COL. MICROBIÓLOGOS</span>
            <span className="text-[11px] font-black text-blue-950 my-0 leading-none">#{code}</span>
            <span className="text-[4.5px] font-black text-blue-900 uppercase tracking-tight mt-0.5 leading-none">REGENTE</span>
        </div>
    </div>
);

// Trazo de Firma Caligráfico Oficial del Dr. Roldan Ajún Chaverri
export const RoldanSignatureVector = () => (
    <svg viewBox="0 0 240 85" className="w-44 h-14 print:h-10 text-blue-950 opacity-95 rotate-[-2deg] drop-shadow-xs">
        {/* Trazo R inicial elegante y fluido */}
        <path d="M 25 65 C 20 40 35 18 55 18 C 72 18 80 28 75 42 C 68 56 45 58 35 58 C 45 58 60 58 78 72" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bucle Ajún Chaverri */}
        <path d="M 75 48 C 88 38 98 42 105 54 C 112 40 125 38 135 52 C 145 42 160 40 172 56" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Rúbrica ascendente y trazo inferior protector */}
        <path d="M 165 52 Q 195 20 215 32 Q 225 38 210 58 Q 185 75 120 72 Q 40 68 18 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Tilde y remate */}
        <path d="M 130 32 L 140 26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
);

// Trazo de Firma Caligráfico Oficial de M.Q.C. José Guillermo Ajún Jiménez
export const JoseGuillermoSignatureVector = () => (
    <svg viewBox="0 0 240 85" className="w-44 h-14 print:h-10 text-blue-900 opacity-95 rotate-[-1deg] drop-shadow-xs">
        {/* Trazo J inicial con bucle inferior */}
        <path d="M 38 22 C 38 18 45 15 54 15 C 60 15 52 48 50 64 C 48 76 34 82 24 74 C 16 66 28 56 42 56" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Trazo Guillermo con ligaduras analíticas */}
        <path d="M 52 48 C 65 35 78 40 84 56 C 92 40 102 38 112 54 C 122 38 138 36 150 50" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bucle Ajún y rúbrica dinámica */}
        <path d="M 148 48 Q 170 28 190 42 Q 205 52 195 66 Q 175 78 110 74 Q 45 70 30 65" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 108 30 L 118 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// Trazo de Firma Caligráfico Oficial de M.Q.C. Roldán Alberto Ajún Jiménez
export const RoldanAlbertoSignatureVector = () => (
    <svg viewBox="0 0 240 85" className="w-44 h-14 print:h-10 text-indigo-950 opacity-95 rotate-[-1.5deg] drop-shadow-xs">
        {/* R estilizada con trazo descendente */}
        <path d="M 30 66 C 26 42 38 20 56 20 C 70 20 78 28 74 42 C 68 54 48 56 36 56 C 46 56 58 56 72 70" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
        {/* Enlace a Alberto (A ligada con bucle superior) */}
        <path d="M 74 46 C 84 32 94 28 102 44 L 108 58 M 90 48 L 106 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Trazo Ajún Jiménez con caligrafía fluida */}
        <path d="M 116 54 C 126 40 136 38 144 50 C 154 38 168 36 178 52" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Rúbrica de cierre con floritura y base */}
        <path d="M 174 50 Q 200 24 218 36 Q 224 44 206 60 Q 170 76 95 72 Q 40 70 22 66" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M 136 30 L 144 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// Selector de vector de firma según el nombre del profesional
const renderSignerVector = (name, customImg) => {
    if (customImg) {
        return <img src={customImg} alt={`Firma ${name}`} className="max-h-16 print:max-h-12 object-contain" />;
    }
    const lower = (name || '').toLowerCase();
    if (lower.includes('alberto')) {
        return <RoldanAlbertoSignatureVector />;
    }
    if (lower.includes('guillermo')) {
        return <JoseGuillermoSignatureVector />;
    }
    return <RoldanSignatureVector />;
};

// Componente completo de bloque de firmas configurable para el informe
export const DualReportSignatureBlock = ({ 
    reportLang = 'es', 
    signedDate = null,
    directorCustomImg = null,
    analystCustomImg = null,
    directorName = 'Dr. Roldan Ajún Chaverri',
    directorCode = '802',
    directorTitle = null,
    analystName = 'M.Q.C. José Guillermo Ajún Jiménez',
    analystCode = 'Reg. Trámite',
    analystTitle = null,
    showBoth = true
}) => {
    const formattedDate = signedDate || new Date().toLocaleDateString('es-CR', { year: 'numeric', month: 'long', day: 'numeric' });
    const defDirectorTitle = directorTitle || (reportLang === 'es' ? 'Director Técnico & Regente Principal' : 'Technical Director & Principal Regent');
    const defAnalystTitle = analystTitle || (reportLang === 'es' ? 'Microbiólogo Analista / Técnico Complementario' : 'Analyst Microbiologist / Complementary Technical');

    const isPrimaryRegent = (directorName || '').toLowerCase().includes('roldan') && !(directorName || '').toLowerCase().includes('alberto');

    return (
        <div className="pt-4 border-t-2 border-slate-700 select-none">
            <div className={`grid ${showBoth ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 max-w-sm mx-auto'} gap-8 print:gap-4 items-end`}>
                
                {/* 1. FIRMA PRINCIPAL / REGENTE O MICROBIÓLOGO RESPONSABLE */}
                <div className="text-center flex flex-col items-center">
                    <div className="relative w-full max-w-[260px] h-20 print:h-14 flex items-end justify-center border-b-2 border-slate-700 pb-1 mb-2">
                        {/* Sello institucional posicionado a la derecha de la firma */}
                        {isPrimaryRegent ? (
                            <div className="absolute -top-3 right-0">
                                <OfficialRegencyStamp code={directorCode} _name={directorName} />
                            </div>
                        ) : (
                            <div className="absolute -top-3 right-0">
                                <div className="w-18 h-18 border border-blue-800/50 rounded-full flex flex-col items-center justify-center p-1 rotate-[4deg] select-none pointer-events-none opacity-80 bg-blue-50/20">
                                    <div className="w-[62px] h-[62px] border border-blue-900/40 rounded-full flex flex-col items-center justify-center text-center p-0.5">
                                        <span className="text-[5px] font-black text-blue-950 uppercase leading-none">ANALÍTICA</span>
                                        <span className="text-[9px] font-black text-blue-800 my-0.5 leading-none">✓</span>
                                        <span className="text-[4px] font-bold text-blue-900 uppercase leading-none">VALIDADO</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {renderSignerVector(directorName, directorCustomImg)}
                    </div>
                    <p className="text-sm print:text-xs font-black text-slate-900 tracking-tight">{directorName}</p>
                    <p className="text-xs print:text-[9.5px] font-bold text-blue-900">{defDirectorTitle}</p>
                    <p className="text-[10px] print:text-[8px] text-slate-600 font-mono">Reg. M.Q.C. #{directorCode} · Col. Microbiólogos CR</p>
                    <p className="text-[9px] print:text-[7.5px] text-slate-400 mt-0.5">Validación de Emisión Oficial · {formattedDate}</p>
                </div>

                {/* 2. SEGUNDA FIRMA (MICROBIÓLOGO ANALISTA O CO-FIRMANTE) */}
                {showBoth && (
                    <div className="text-center flex flex-col items-center">
                        <div className="relative w-full max-w-[260px] h-20 print:h-14 flex items-end justify-center border-b-2 border-slate-700 pb-1 mb-2">
                            {/* Sello de validación analítica técnica */}
                            <div className="absolute -top-3 right-0">
                                <div className="w-18 h-18 border border-emerald-800/50 rounded-full flex flex-col items-center justify-center p-1 rotate-[4deg] select-none pointer-events-none opacity-80 bg-emerald-50/20">
                                    <div className="w-[62px] h-[62px] border border-emerald-900/40 rounded-full flex flex-col items-center justify-center text-center p-0.5">
                                        <span className="text-[5px] font-black text-emerald-950 uppercase leading-none">ANALÍTICA</span>
                                        <span className="text-[9px] font-black text-emerald-800 my-0.5 leading-none">✓</span>
                                        <span className="text-[4px] font-bold text-emerald-900 uppercase leading-none">CONFORME</span>
                                    </div>
                                </div>
                            </div>
                            {renderSignerVector(analystName, analystCustomImg)}
                        </div>
                        <p className="text-sm print:text-xs font-black text-slate-900 tracking-tight">{analystName}</p>
                        <p className="text-xs print:text-[9.5px] font-bold text-slate-800">{defAnalystTitle}</p>
                        <p className="text-[10px] print:text-[8px] text-slate-600 font-mono">Reg. #{analystCode || 'Reg. Trámite'} · Microbiología Microlabs</p>
                        <p className="text-[9px] print:text-[7.5px] text-slate-400 mt-0.5">Ejecución y Verificación de Ensayo</p>
                    </div>
                )}
            </div>
        </div>
    );
};
