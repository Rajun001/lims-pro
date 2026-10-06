import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateActivityStatus } from '../services/clientClassifier.service.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// Proteger todas las operaciones de CRM (Cumplimiento normativo y privacidad empresarial)
router.use('/crm', authenticateJWT);

/**
 * GET /api/crm/stats
 * Resumen estadístico integral de clientes (Empresas vs Pacientes)
 */
router.get('/crm/stats', async (req, res) => {
    try {
        // 1. Obtener todas las empresas con sus contratos, muestras e informes
        const companies = await prisma.corporateClient.findMany({
            include: {
                contracts: {
                    include: {
                        samples: {
                            include: {
                                reports: {
                                    select: { signedAt: true, createdAt: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        // 2. Obtener todos los pacientes con sus muestras e informes
        const patients = await prisma.patient.findMany({
            include: {
                samples: {
                    include: {
                        orders: {
                            include: {
                                reports: {
                                    select: { signedAt: true, createdAt: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Procesar métricas de empresas
        let compActive = 0;
        let compAtRisk = 0;
        let compInactive = 0;
        const sectorCounts = {};

        companies.forEach(comp => {
            let lastDate = null;

            comp.contracts.forEach(cnt => {
                cnt.samples.forEach(smp => {
                    smp.reports.forEach(rep => {
                        const d = rep.signedAt || rep.createdAt;
                        if (d && (!lastDate || new Date(d) > new Date(lastDate))) {
                            lastDate = d;
                        }
                    });
                });
            });

            const status = calculateActivityStatus(lastDate);
            if (status === 'ACTIVE') compActive++;
            else if (status === 'AT_RISK') compAtRisk++;
            else compInactive++;

            const sector = comp.industrySector || 'Otros';
            sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
        });

        // Procesar métricas de pacientes
        let patActive = 0;
        let patAtRisk = 0;
        let patInactive = 0;

        patients.forEach(pat => {
            let lastDate = null;
            pat.samples.forEach(smp => {
                smp.orders.forEach(ord => {
                    ord.reports.forEach(rep => {
                        const d = rep.signedAt || rep.createdAt;
                        if (d && (!lastDate || new Date(d) > new Date(lastDate))) {
                            lastDate = d;
                        }
                    });
                });
            });

            const status = calculateActivityStatus(lastDate);
            if (status === 'ACTIVE') patActive++;
            else if (status === 'AT_RISK') patAtRisk++;
            else patInactive++;
        });

        const totalReports = await prisma.report.count();
        const totalIndustrialTests = await prisma.industrialTest.count();
        const totalClinicalTests = await prisma.clinicalTest.count();

        return res.json({
            summary: {
                totalClients: companies.length + patients.length,
                totalCompanies: companies.length,
                totalPatients: patients.length,
                totalReports,
                totalTests: totalIndustrialTests + totalClinicalTests
            },
            companies: {
                total: companies.length,
                active: compActive,
                atRisk: compAtRisk,
                inactive: compInactive,
                rescueOpportunityRate: companies.length ? Math.round((compInactive / companies.length) * 100) : 0,
                sectors: sectorCounts
            },
            patients: {
                total: patients.length,
                active: patActive,
                atRisk: patAtRisk,
                inactive: patInactive
            }
        });

    } catch (error) {
        console.error('[CRM-STATS] Error:', error);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/crm/clients
 * Lista clasificada y paginada de clientes para marketing y fidelización
 */
router.get('/crm/clients', async (req, res) => {
    try {
        const {
            entityType = 'ALL', // 'COMPANY' | 'PATIENT' | 'ALL'
            status = 'ALL',     // 'ACTIVE' | 'AT_RISK' | 'INACTIVE' | 'ALL'
            sector = '',
            search = '',
            page = 1,
            limit = 50
        } = req.query;

        const now = new Date();
        const results = [];

        // 1. Cargar Empresas si corresponde
        if (entityType === 'ALL' || entityType === 'COMPANY') {
            const companies = await prisma.corporateClient.findMany({
                include: {
                    contracts: {
                        include: {
                            samples: {
                                include: {
                                    reports: {
                                        select: { signedAt: true, createdAt: true, reportNumber: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            for (const comp of companies) {
                let lastDate = null;
                let reportCount = 0;
                let lastReportNum = null;

                comp.contracts.forEach(cnt => {
                    cnt.samples.forEach(smp => {
                        smp.reports.forEach(rep => {
                            reportCount++;
                            const d = rep.signedAt || rep.createdAt;
                            if (d && (!lastDate || new Date(d) > new Date(lastDate))) {
                                lastDate = d;
                                lastReportNum = rep.reportNumber;
                            }
                        });
                    });
                });

                const actStatus = calculateActivityStatus(lastDate);
                const daysInactive = lastDate ? Math.floor((now - new Date(lastDate)) / (1000 * 60 * 60 * 24)) : 999;

                results.push({
                    id: `COMP-${comp.id}`,
                    rawId: comp.id,
                    entityType: 'COMPANY',
                    name: comp.companyName,
                    identifier: comp.taxId,
                    sector: comp.industrySector || 'Alimentos y Bebidas',
                    contactName: comp.contactName || 'No asignado',
                    email: comp.email || '',
                    phone: comp.phone || '',
                    lastReportDate: lastDate,
                    lastReportNumber: lastReportNum,
                    daysInactive,
                    activityStatus: actStatus,
                    totalReportsCount: reportCount
                });
            }
        }

        // 2. Cargar Pacientes si corresponde
        if (entityType === 'ALL' || entityType === 'PATIENT') {
            const patients = await prisma.patient.findMany({
                include: {
                    samples: {
                        include: {
                            orders: {
                                include: {
                                    reports: {
                                        select: { signedAt: true, createdAt: true, reportNumber: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            for (const pat of patients) {
                let lastDate = null;
                let reportCount = 0;
                let lastReportNum = null;

                pat.samples.forEach(smp => {
                    smp.orders.forEach(ord => {
                        ord.reports.forEach(rep => {
                            reportCount++;
                            const d = rep.signedAt || rep.createdAt;
                            if (d && (!lastDate || new Date(d) > new Date(lastDate))) {
                                lastDate = d;
                                lastReportNum = rep.reportNumber;
                            }
                        });
                    });
                });

                const actStatus = calculateActivityStatus(lastDate);
                const daysInactive = lastDate ? Math.floor((now - new Date(lastDate)) / (1000 * 60 * 60 * 24)) : 999;

                results.push({
                    id: `PAT-${pat.id}`,
                    rawId: pat.id,
                    entityType: 'PATIENT',
                    name: `${pat.firstName} ${pat.lastName}`.trim(),
                    identifier: pat.uniqueId || 'N/A',
                    sector: 'Salud Humana / Análisis Clínico',
                    contactName: `${pat.firstName} ${pat.lastName}`.trim(),
                    email: pat.email || '',
                    phone: pat.phone || '',
                    lastReportDate: lastDate,
                    lastReportNumber: lastReportNum,
                    daysInactive,
                    activityStatus: actStatus,
                    totalReportsCount: reportCount
                });
            }
        }

        // Filtrar por estado
        let filtered = results;
        if (status !== 'ALL') {
            filtered = filtered.filter(c => c.activityStatus === status);
        }

        // Filtrar por sector
        if (sector && sector !== 'ALL') {
            filtered = filtered.filter(c => c.sector.toLowerCase().includes(sector.toLowerCase()));
        }

        // Filtrar por término de búsqueda
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(c => 
                c.name.toLowerCase().includes(q) ||
                c.identifier.toLowerCase().includes(q) ||
                c.contactName.toLowerCase().includes(q) ||
                (c.email && c.email.toLowerCase().includes(q)) ||
                (c.phone && c.phone.includes(q))
            );
        }

        // Ordenar: primero inactivos con más reportes históricos (mayor valor de rescate)
        filtered.sort((a, b) => {
            if (a.activityStatus === 'INACTIVE' && b.activityStatus !== 'INACTIVE') return -1;
            if (b.activityStatus === 'INACTIVE' && a.activityStatus !== 'INACTIVE') return 1;
            return b.totalReportsCount - a.totalReportsCount;
        });

        const totalItems = filtered.length;
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 50;
        const paginated = filtered.slice((pageNum - 1) * limitNum, pageNum * limitNum);

        return res.json({
            total: totalItems,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(totalItems / limitNum),
            data: paginated
        });

    } catch (error) {
        console.error('[CRM-CLIENTS] Error:', error);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/crm/export-reactivation
 * Genera lista estructurada de rescate comercial con plantillas de contacto
 */
router.get('/crm/export-reactivation', async (req, res) => {
    try {
        const now = new Date();

        const companies = await prisma.corporateClient.findMany({
            include: {
                contracts: {
                    include: {
                        samples: {
                            include: {
                                reports: {
                                    select: { signedAt: true, createdAt: true, reportNumber: true }
                                }
                            }
                        }
                    }
                }
            }
        });

        const rescueList = [];

        companies.forEach(comp => {
            let lastDate = null;
            let reportCount = 0;
            let lastReportNum = null;

            comp.contracts.forEach(cnt => {
                cnt.samples.forEach(smp => {
                    smp.reports.forEach(rep => {
                        reportCount++;
                        const d = rep.signedAt || rep.createdAt;
                        if (d && (!lastDate || new Date(d) > new Date(lastDate))) {
                            lastDate = d;
                            lastReportNum = rep.reportNumber;
                        }
                    });
                });
            });

            const status = calculateActivityStatus(lastDate);
            if (status === 'INACTIVE' || status === 'AT_RISK') {
                const daysInactive = lastDate ? Math.floor((now - new Date(lastDate)) / (1000 * 60 * 60 * 24)) : 'N/A';
                
                // Mensaje sugerido de reactivación comercial según sector
                let pitch = `Estimado equipo de ${comp.companyName}, le saluda el Laboratorio Microlabs. Notamos que hace ${daysInactive} días realizamos su último análisis de control de calidad. ¿Desean renovar su muestreo preventivo este mes con tarifas preferenciales?`;
                if ((comp.industrySector || '').includes('Aguas')) {
                    pitch = `Estimados de ${comp.companyName}, les recordamos la importancia de mantener al día su control físico-químico y microbiológico de agua potable según el Reglamento para la Calidad del Agua. Con gusto podemos agendar la toma de muestras de este periodo.`;
                } else if ((comp.industrySector || '').includes('Hotelería')) {
                    pitch = `Estimados de ${comp.companyName}, en Microlabs estamos disponibles para asistirles en el plan de monitoreo microbiológico de aguas, piscinas y superficies de alimentos previo a la temporada alta.`;
                }

                rescueList.push({
                    empresa: comp.companyName,
                    cedulaJuridica: comp.taxId,
                    sector: comp.industrySector || 'Alimentos',
                    contacto: comp.contactName || '',
                    telefono: comp.phone || '',
                    email: comp.email || '',
                    diasInactivo: daysInactive,
                    totalAnalisisHistoricos: reportCount,
                    ultimoInforme: lastReportNum || 'N/A',
                    mensajeReactivacionWhatsApp: pitch
                });
            }
        });

        rescueList.sort((a, b) => b.totalAnalisisHistoricos - a.totalAnalisisHistoricos);

        return res.json({
            count: rescueList.length,
            generatedAt: new Date(),
            rescueCandidates: rescueList
        });

    } catch (error) {
        console.error('[CRM-EXPORT] Error:', error);
        return res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/crm/log-contact
 * Registra un intento de contacto o reactivación en la bitácora
 */
router.post('/crm/log-contact', async (req, res) => {
    try {
        const { clientName, channel, note, userName = 'Comercial' } = req.body;
        
        const log = await prisma.accessLog.create({
            data: {
                ip: req.ip || '127.0.0.1',
                accessType: 'CRM_MARKETING_CONTACT',
                userName,
                company: clientName,
                action: `Contacto comercial vía ${channel || 'WhatsApp'}`,
                details: note || 'Mensaje de reactivación enviado'
            }
        });

        return res.json({ success: true, logId: log.id });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
