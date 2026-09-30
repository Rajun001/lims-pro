/**
 * Catálogo Oficial de Microbiólogos y Configuraciones de Firmas Microlabs
 * Permite escoger firmantes según el caso y dar soporte inmediato a futuros profesionales.
 */

export const MICROBIOLOGISTS_CATALOG = [
    {
        id: 'roldan_padre',
        name: 'Dr. Roldan Ajún Chaverri',
        code: '802',
        titleEs: 'Director Técnico & Regente Principal',
        titleEn: 'Technical Director & Principal Regent',
        shortRole: 'Regente Principal',
        hasRegencyStamp: true
    },
    {
        id: 'jose_guillermo',
        name: 'M.Q.C. José Guillermo Ajún Jiménez',
        code: 'Reg. Trámite',
        titleEs: 'Microbiólogo Analista / Técnico Complementario',
        titleEn: 'Analyst Microbiologist / Complementary Technical',
        shortRole: 'Microbiólogo Analista',
        hasAnalyticalStamp: true
    },
    {
        id: 'roldan_alberto',
        name: 'M.Q.C. Roldán Alberto Ajún Jiménez',
        code: 'Reg. Trámite',
        titleEs: 'Microbiólogo Analista / Co-firmante',
        titleEn: 'Analyst Microbiologist / Co-signer',
        shortRole: 'Microbiólogo Analista',
        hasAnalyticalStamp: true
    }
];

export const SIGNATURE_PRESETS = [
    {
        id: 'dual_roldan_jose',
        label: 'Dr. Roldan Ajún (Regente) + M.Q.C. José Guillermo Ajún',
        primaryId: 'roldan_padre',
        secondaryId: 'jose_guillermo',
        showBoth: true
    },
    {
        id: 'dual_roldan_alberto',
        label: 'Dr. Roldan Ajún (Regente) + M.Q.C. Roldán Alberto Ajún',
        primaryId: 'roldan_padre',
        secondaryId: 'roldan_alberto',
        showBoth: true
    },
    {
        id: 'dual_hijos',
        label: 'M.Q.C. José Guillermo Ajún + M.Q.C. Roldán Alberto Ajún',
        primaryId: 'jose_guillermo',
        secondaryId: 'roldan_alberto',
        showBoth: true
    },
    {
        id: 'sole_roldan',
        label: 'Dr. Roldan Ajún (Firma Individual de Regencia)',
        primaryId: 'roldan_padre',
        secondaryId: null,
        showBoth: false
    },
    {
        id: 'sole_jose',
        label: 'M.Q.C. José Guillermo Ajún (Firma Individual Alimentos/Aguas)',
        primaryId: 'jose_guillermo',
        secondaryId: null,
        showBoth: false
    },
    {
        id: 'sole_alberto',
        label: 'M.Q.C. Roldán Alberto Ajún (Firma Individual Analista)',
        primaryId: 'roldan_alberto',
        secondaryId: null,
        showBoth: false
    }
];
