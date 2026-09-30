import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Escanea el sistema LIMS para generar recordatorios automáticos
 * tanto para el personal del laboratorio como para clientes y pacientes
 */
export async function runAutomatedReminderScanner() {
    const now = new Date();
    const generatedReminders = [];

    try {
        // =====================================================================
        // 1. RECORDATORIOS INTERNOS: INFORMES PENDIENTES DE FIRMA TÉCNICA
        // =====================================================================
        const pendingReports = await prisma.report.findMany({
            where: {
                status: { in: ['DRAFT', 'PENDING_SIGNATURE'] }
            },
            take: 20
        });

        for (const rep of pendingReports) {
            const daysWaiting = Math.floor((now - new Date(rep.createdAt)) / (1000 * 60 * 60 * 24));
            const priority = daysWaiting >= 2 ? 'HIGH' : 'NORMAL';

            // Verificar si ya existe recordatorio pendiente para este informe
            const exists = await prisma.reminderSchedule.findFirst({
                where: {
                    reminderType: 'INTERNAL_PENDING_SIGNATURE',
                    entityReference: rep.reportNumber,
                    status: 'PENDING'
                }
            });

            if (!exists) {
                const r = await prisma.reminderSchedule.create({
                    data: {
                        reminderType: 'INTERNAL_PENDING_SIGNATURE',
                        targetAudience: 'INTERNAL_STAFF',
                        recipientName: 'Director Técnico / Personal de Validación',
                        recipientContact: 'internos@microlabscr.com',
                        channel: 'SYSTEM',
                        title: `Firma Pendiente: Informe ${rep.reportNumber}`,
                        message: `El informe ${rep.reportNumber} (${rep.reportType === 'CLINICAL_HUMAN' ? 'Clínico' : 'Industrial COA'}) tiene ${daysWaiting} día(s) en espera de revisión final y firma electrónica colegiada.`,
                        dueDate: now,
                        entityReference: rep.reportNumber,
                        priority,
                        status: 'PENDING'
                    }
                });
                generatedReminders.push(r);
            }
        }

        // =====================================================================
        // 2. RECORDATORIOS INTERNOS: MUESTRAS INDUSTRIALES EN ANÁLISIS
        // =====================================================================
        const pendingIndustrialSamples = await prisma.industrialSample.findMany({
            where: {
                status: { in: ['RECEIVED', 'IN_ANALYSIS'] }
            },
            include: { contract: { include: { client: true } } },
            take: 20
        });

        for (const smp of pendingIndustrialSamples) {
            const daysElapsed = Math.floor((now - new Date(smp.receivedAt)) / (1000 * 60 * 60 * 24));
            if (daysElapsed >= 1) {
                const exists = await prisma.reminderSchedule.findFirst({
                    where: {
                        reminderType: 'INTERNAL_PENDING_ORDER',
                        entityReference: smp.barcode,
                        status: 'PENDING'
                    }
                });

                if (!exists) {
                    const r = await prisma.reminderSchedule.create({
                        data: {
                            reminderType: 'INTERNAL_PENDING_ORDER',
                            targetAudience: 'INTERNAL_STAFF',
                            recipientName: 'Equipo de Microbiología / Analistas',
                            recipientContact: 'lab@microlabscr.com',
                            channel: 'SYSTEM',
                            title: `Lectura y Resultados: Muestra ${smp.barcode}`,
                            message: `La muestra ${smp.matrixType} (${smp.lotNumber}) de ${smp.contract.client.companyName} lleva ${daysElapsed} día(s) en análisis. Verificar conteo de colonias o lecturas pendientes.`,
                            dueDate: now,
                            entityReference: smp.barcode,
                            priority: daysElapsed >= 3 ? 'URGENT' : 'NORMAL',
                            status: 'PENDING'
                        }
                    });
                    generatedReminders.push(r);
                }
            }
        }

        // =====================================================================
        // 3. RECORDATORIOS INTERNOS: EQUIPOS CON CALIBRACIÓN PRÓXIMA (ISO 17025)
        // =====================================================================
        const equipments = await prisma.equipment.findMany();
        for (const eq of equipments) {
            if (eq.nextCalibration) {
                const daysToCalib = Math.floor((new Date(eq.nextCalibration) - now) / (1000 * 60 * 60 * 24));
                if (daysToCalib <= 15) {
                    const exists = await prisma.reminderSchedule.findFirst({
                        where: {
                            reminderType: 'INTERNAL_EQUIPMENT_CALIBRATION',
                            entityReference: eq.id,
                            status: 'PENDING'
                        }
                    });

                    if (!exists) {
                        const r = await prisma.reminderSchedule.create({
                            data: {
                                reminderType: 'INTERNAL_EQUIPMENT_CALIBRATION',
                                targetAudience: 'INTERNAL_STAFF',
                                recipientName: 'Responsable de Calidad y Metrología',
                                recipientContact: 'calidad@microlabscr.com',
                                channel: 'SYSTEM',
                                title: `Mantenimiento / Calibración: ${eq.name}`,
                                message: daysToCalib <= 0 
                                    ? `¡Atención! La calibración de ${eq.name} (${eq.id}) expiró hace ${Math.abs(daysToCalib)} días.`
                                    : `La calibración del equipo ${eq.name} vencerá en ${daysToCalib} días (${eq.nextCalibration.toISOString().split('T')[0]}).`,
                                dueDate: eq.nextCalibration,
                                entityReference: eq.id,
                                priority: daysToCalib <= 3 ? 'URGENT' : 'HIGH',
                                status: 'PENDING'
                            }
                        });
                        generatedReminders.push(r);
                    }
                }
            }
        }

        // =====================================================================
        // 4. RECORDATORIOS EXTERNOS: EMPRESAS PARA RENOVACIÓN PERIÓDICA
        // =====================================================================
        const corporateClients = await prisma.corporateClient.findMany({
            include: {
                contracts: {
                    include: {
                        samples: {
                            include: {
                                reports: { select: { signedAt: true, createdAt: true } }
                            }
                        }
                    }
                }
            },
            take: 50
        });

        for (const comp of corporateClients) {
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

            if (lastDate) {
                const daysInactive = Math.floor((now - new Date(lastDate)) / (1000 * 60 * 60 * 24));
                // Si la empresa tiene entre 60 y 180 días sin muestreo, sugerir renovación periódica preventiva
                if (daysInactive >= 60 && daysInactive <= 180) {
                    const exists = await prisma.reminderSchedule.findFirst({
                        where: {
                            reminderType: 'EXTERNAL_CLIENT_RENEWAL',
                            entityReference: comp.taxId,
                            status: 'PENDING'
                        }
                    });

                    if (!exists) {
                        const sectorText = comp.industrySector || 'Control de Calidad';
                        const message = `Estimado equipo de ${comp.companyName}, de parte de Microlabs esperamos se encuentren bien. Han transcurrido ${daysInactive} días desde su último informe de análisis (${sectorText}). Ponemos a su disposición nuestro equipo técnico para la coordinación del muestreo del periodo vigente.`;

                        const r = await prisma.reminderSchedule.create({
                            data: {
                                reminderType: 'EXTERNAL_CLIENT_RENEWAL',
                                targetAudience: 'CORPORATE_CLIENT',
                                recipientName: comp.companyName,
                                recipientContact: comp.phone || comp.email || 'Sin contacto registrado',
                                channel: comp.phone ? 'WHATSAPP' : 'EMAIL',
                                title: `Renovación Periódica: ${comp.companyName}`,
                                message,
                                dueDate: now,
                                entityReference: comp.taxId,
                                priority: 'NORMAL',
                                status: 'PENDING'
                            }
                        });
                        generatedReminders.push(r);
                    }
                }
            }
        }

        // =====================================================================
        // 5. RECORDATORIOS EXTERNOS: PACIENTES CON RESULTADOS LISTOS
        // =====================================================================
        const recentClinicalReports = await prisma.report.findMany({
            where: {
                reportType: 'CLINICAL_HUMAN',
                status: 'ISSUED'
            },
            include: {
                clinicalOrder: {
                    include: {
                        sample: {
                            include: { patient: true }
                        }
                    }
                }
            },
            take: 20
        });

        for (const rep of recentClinicalReports) {
            const pat = rep.clinicalOrder?.sample?.patient;
            if (pat) {
                const exists = await prisma.reminderSchedule.findFirst({
                    where: {
                        reminderType: 'EXTERNAL_PATIENT_READY',
                        entityReference: rep.reportNumber,
                        status: { in: ['PENDING', 'SENT'] }
                    }
                });

                if (!exists) {
                    const message = `Estimado(a) ${pat.firstName} ${pat.lastName}, su informe de resultados de laboratorio clínico (${rep.reportNumber}) se encuentra listo y validado por la Dirección Técnica de Microlabs. Puede consultarlo en nuestra plataforma o solicitar el PDF digital.`;

                    const r = await prisma.reminderSchedule.create({
                        data: {
                            reminderType: 'EXTERNAL_PATIENT_READY',
                            targetAudience: 'CLINICAL_PATIENT',
                            recipientName: `${pat.firstName} ${pat.lastName}`,
                            recipientContact: pat.phone || pat.email || 'Sin teléfono registrado',
                            channel: pat.phone ? 'WHATSAPP' : 'EMAIL',
                            title: `Resultados Listos: ${pat.firstName} ${pat.lastName}`,
                            message,
                            dueDate: now,
                            entityReference: rep.reportNumber,
                            priority: 'HIGH',
                            status: 'PENDING'
                        }
                    });
                    generatedReminders.push(r);
                }
            }
        }

        console.log(`[REMINDERS] Escaneo completado: ${generatedReminders.length} nuevos recordatorios generados.`);
        return {
            success: true,
            scannedAt: now,
            count: generatedReminders.length,
            reminders: generatedReminders
        };

    } catch (error) {
        console.error('[REMINDERS] Error ejecutando escáner de recordatorios:', error);
        throw error;
    }
}

/**
 * Consulta de recordatorios y agenda con filtros por audiencia y estado
 */
export async function getReminders(filters = {}) {
    const {
        targetAudience = 'ALL',
        status = 'ALL',
        reminderType = 'ALL',
        search = ''
    } = filters;

    const where = {};
    if (targetAudience !== 'ALL') where.targetAudience = targetAudience;
    if (status !== 'ALL') where.status = status;
    if (reminderType !== 'ALL') where.reminderType = reminderType;

    if (search) {
        where.OR = [
            { recipientName: { contains: search } },
            { title: { contains: search } },
            { message: { contains: search } },
            { entityReference: { contains: search } }
        ];
    }

    const items = await prisma.reminderSchedule.findMany({
        where,
        orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' }
        ]
    });

    // Conteo estadístico
    const counts = {
        total: items.length,
        pending: items.filter(i => i.status === 'PENDING').length,
        sent: items.filter(i => i.status === 'SENT').length,
        dismissed: items.filter(i => i.status === 'DISMISSED').length,
        internalStaff: items.filter(i => i.targetAudience === 'INTERNAL_STAFF').length,
        corporateClients: items.filter(i => i.targetAudience === 'CORPORATE_CLIENT').length,
        clinicalPatients: items.filter(i => i.targetAudience === 'CLINICAL_PATIENT').length,
        urgent: items.filter(i => i.priority === 'URGENT' || i.priority === 'HIGH').length
    };

    return {
        counts,
        data: items
    };
}

/**
 * Despacho y actualización de estado de un recordatorio
 */
export async function dispatchReminder(id, options = {}) {
    const reminder = await prisma.reminderSchedule.findUnique({
        where: { id: parseInt(id, 10) }
    });

    if (!reminder) {
        throw new Error('Recordatorio no encontrado');
    }

    // Registrar despacho
    const updated = await prisma.reminderSchedule.update({
        where: { id: parseInt(id, 10) },
        data: {
            status: 'SENT',
            sentAt: new Date(),
            channel: options.channel || reminder.channel
        }
    });

    // Registrar en auditoría
    await prisma.accessLog.create({
        data: {
            ip: '127.0.0.1',
            accessType: 'REMINDER_DISPATCHED',
            userName: options.userName || 'Sistema LIMS',
            company: reminder.recipientName,
            action: `Despacho de recordatorio (${reminder.reminderType}) vía ${updated.channel}`,
            details: `Mensaje: ${reminder.message.substring(0, 100)}...`
        }
    });

    // Generar URL de enlace directo si es WhatsApp
    let whatsappLink = null;
    if (reminder.recipientContact && reminder.recipientContact !== 'Sin contacto registrado') {
        const cleanPhone = reminder.recipientContact.replace(/[^0-9]/g, '');
        if (cleanPhone.length >= 8) {
            const encodedMsg = encodeURIComponent(reminder.message);
            whatsappLink = `https://wa.me/${cleanPhone.startsWith('506') ? cleanPhone : '506' + cleanPhone}?text=${encodedMsg}`;
        }
    }

    return {
        success: true,
        reminder: updated,
        whatsappLink
    };
}

/**
 * Actualiza el estado manual de un recordatorio (DESCARTAR, POSPONER, COMPLETAR)
 */
export async function updateReminderStatus(id, newStatus) {
    return await prisma.reminderSchedule.update({
        where: { id: parseInt(id, 10) },
        data: { status: newStatus }
    });
}

/**
 * Crea un recordatorio personalizado programado
 */
export async function createCustomReminder(data) {
    return await prisma.reminderSchedule.create({
        data: {
            reminderType: data.reminderType || 'CUSTOM_SCHEDULE',
            targetAudience: data.targetAudience || 'INTERNAL_STAFF',
            recipientName: data.recipientName,
            recipientContact: data.recipientContact || null,
            channel: data.channel || 'SYSTEM',
            title: data.title,
            message: data.message,
            dueDate: data.dueDate ? new Date(data.dueDate) : new Date(),
            priority: data.priority || 'NORMAL',
            entityReference: data.entityReference || null,
            status: 'PENDING'
        }
    });
}

/**
 * Inicia el temporizador periódico para escanear recordatorios automáticamente
 */
export function startReminderScheduler(intervalMinutes = 30) {
    console.log(`[REMINDERS-SCHEDULER] Motor de recordatorios iniciado (Frecuencia: Cada ${intervalMinutes} minutos).`);
    // Ejecutar un escaneo inicial diferido
    setTimeout(async () => {
        try {
            await runAutomatedReminderScanner();
        } catch (e) {
            console.error('[REMINDERS-SCHEDULER] Error en escaneo inicial:', e.message);
        }
    }, 5000);

    setInterval(async () => {
        try {
            await runAutomatedReminderScanner();
        } catch (e) {
            console.error('[REMINDERS-SCHEDULER] Error en escaneo cíclico:', e.message);
        }
    }, intervalMinutes * 60 * 1000);
}
