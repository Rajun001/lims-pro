
const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function importTacoBell() {
    console.log('\n--- 1. PROCESANDO CRONOGRAMAS TACO BELL 2026 ---');
    const tbFile = 'C:/Users/HP LAB/Desktop/TB/R-AC-07- Cronograma análisis microbiológicos 2026-.xlsx';
    if (!fs.existsSync(tbFile)) {
        console.warn('No se encontró archivo Taco Bell:', tbFile);
        return;
    }

    // 1. Cliente Taco Bell
    const client = await prisma.corporateClient.upsert({
        where: { taxId: 'TAX-INVERSIONESTB' },
        update: {
            companyName: 'Inversiones TB S.A (Taco Bell Costa Rica)',
            industrySector: 'Restaurantes y Comida Rápida'
        },
        create: {
            taxId: 'TAX-INVERSIONESTB',
            companyName: 'Inversiones TB S.A (Taco Bell Costa Rica)',
            industrySector: 'Restaurantes y Comida Rápida'
        }
    });

    // 2. Contrato
    const contract = await prisma.industrialContract.upsert({
        where: { projectCode: 'PRJ-TB-CRONO-2026' },
        update: {
            projectName: 'Plan Maestro de Aseguramiento Microbiológico Taco Bell 2026 (R-AC-07)',
            status: 'ACTIVE'
        },
        create: {
            clientId: client.id,
            projectCode: 'PRJ-TB-CRONO-2026',
            projectName: 'Plan Maestro de Aseguramiento Microbiológico Taco Bell 2026 (R-AC-07)',
            contractType: 'PLAN_MUESTREO_PERSONALIZADO',
            startDate: new Date('2026-01-01T00:00:00.000Z'),
            status: 'ACTIVE'
        }
    });

    const wb = XLSX.readFile(tbFile);

    // Leer catálogo de tiendas
    const wsTiendas = wb.Sheets['Información restaurantes'];
    const tiendasData = XLSX.utils.sheet_to_json(wsTiendas, { header: 1 });
    const tiendasMap = {};
    for (let r = 1; r < tiendasData.length; r++) {
        const row = tiendasData[r];
        if (row && row[0] && row[1]) {
            tiendasMap[String(row[0]).trim()] = {
                codigo: String(row[0]).trim(),
                nombre: String(row[1]).trim(),
                provincia: row[2] ? String(row[2]).trim() : '',
                ubicacion: row[5] ? String(row[5]).trim() : ''
            };
        }
    }
    console.log(`Tiendas Taco Bell mapeadas: ${Object.keys(tiendasMap).length}`);

    // Plan 1: Hielo y Agua Potable
    let planHieloAgua = await prisma.samplingPlan.findFirst({
        where: { contractId: contract.id, planName: 'Cronograma Muestreo Microbiológico Hielo y Agua 2026 (R-AC-07)' }
    });
    if (!planHieloAgua) {
        planHieloAgua = await prisma.samplingPlan.create({
            data: {
                contractId: contract.id,
                planName: 'Cronograma Muestreo Microbiológico Hielo y Agua 2026 (R-AC-07)',
                industrySector: 'RESTO_BAR',
                profileType: 'EXISTING_PLAN_MAPPED',
                frequency: 'MENSUAL',
                status: 'ACTIVE'
            }
        });
    }

    // Limpiar puntos previos para regenerar
    await prisma.samplingPlanPoint.deleteMany({ where: { planId: planHieloAgua.id } });

    // Cargar puntos de Hielo/Agua
    const wsHielo = wb.Sheets['Cronograma Hielo-Agua 2026'];
    const hieloRows = XLSX.utils.sheet_to_json(wsHielo, { header: 1 });
    let puntosHieloCount = 0;
    for (let r = 6; r < hieloRows.length; r++) {
        const row = hieloRows[r];
        if (!row || !row[1]) continue;
        const cod = String(row[1]).trim();
        const info = tiendasMap[cod] || { nombre: `Tienda ${cod}`, ubicacion: '' };

        await prisma.samplingPlanPoint.create({
            data: {
                planId: planHieloAgua.id,
                pointName: `Taco Bell ${info.nombre} (${cod}) - Agua Potable & Máquina de Hielo`,
                zoneCategory: 'AGUA_POTABLE',
                matrixType: 'Agua Potable y Hielo',
                samplingFrequency: 'MENSUAL',
                targetParameters: JSON.stringify(['Recuento Heterótrofo (RTA)', 'Coliformes Totales', 'Coliformes Fecales', 'Escherichia coli']),
                isoStandardRef: 'Decreto Ejecutivo 38924-S / RTCA Agua Potable'
            }
        });
        puntosHieloCount++;
    }
    console.log(`Puntos registrados en Plan Hielo-Agua TB: ${puntosHieloCount}`);

    // Plan 2: Superficies y Manipuladores
    let planSuperficies = await prisma.samplingPlan.findFirst({
        where: { contractId: contract.id, planName: 'Cronograma Muestreo Superficies y Manipuladores 2026 (R-AC-07)' }
    });
    if (!planSuperficies) {
        planSuperficies = await prisma.samplingPlan.create({
            data: {
                contractId: contract.id,
                planName: 'Cronograma Muestreo Superficies y Manipuladores 2026 (R-AC-07)',
                industrySector: 'RESTO_BAR',
                profileType: 'EXISTING_PLAN_MAPPED',
                frequency: 'MENSUAL',
                status: 'ACTIVE'
            }
        });
    }

    await prisma.samplingPlanPoint.deleteMany({ where: { planId: planSuperficies.id } });

    const wsSup = wb.Sheets['Cronograma superficies 2026'];
    const supRows = XLSX.utils.sheet_to_json(wsSup, { header: 1 });
    let puntosSupCount = 0;
    for (let r = 6; r < supRows.length; r++) {
        const row = supRows[r];
        if (!row || !row[1]) continue;
        const cod = String(row[1]).trim();
        const info = tiendasMap[cod] || { nombre: `Tienda ${cod}`, ubicacion: '' };

        await prisma.samplingPlanPoint.create({
            data: {
                planId: planSuperficies.id,
                pointName: `Taco Bell ${info.nombre} (${cod}) - Línea de Ensamble y Manipuladores`,
                zoneCategory: 'SUPERFICIE_CONTACTO',
                matrixType: 'Hisopado de Superficie Viva e Inerte',
                samplingFrequency: 'MENSUAL',
                targetParameters: JSON.stringify(['Recuento Total Aeróbico', 'Coliformes Totales', 'Staphylococcus aureus', 'Listeria monocytogenes']),
                isoStandardRef: 'ISO 18593 / Reglamento Técnico Centroamericano'
            }
        });
        puntosSupCount++;
    }
    console.log(`Puntos registrados en Plan Superficies TB: ${puntosSupCount}`);
}

async function importSpoon() {
    console.log('\n--- 2. PROCESANDO CRONOGRAMAS SPOON 2026 ---');
    const spoonFile = 'C:/Users/HP LAB/Desktop/SPOON/Cronograma Microbiologicos  2026 Microlabs.xlsx';
    if (!fs.existsSync(spoonFile)) {
        console.warn('No se encontró archivo Spoon:', spoonFile);
        return;
    }

    const client = await prisma.corporateClient.upsert({
        where: { taxId: 'TAX-SPOONCR' },
        update: {
            companyName: 'Servicios de Pastelería Spoon S.A.',
            industrySector: 'Pastelería y Restaurantes'
        },
        create: {
            taxId: 'TAX-SPOONCR',
            companyName: 'Servicios de Pastelería Spoon S.A.',
            industrySector: 'Pastelería y Restaurantes'
        }
    });

    const contract = await prisma.industrialContract.upsert({
        where: { projectCode: 'PRJ-SPOON-CRONO-2026' },
        update: {
            projectName: 'Plan Anual de Vigilancia Microbiológica Puntos de Venta Spoon 2026',
            status: 'ACTIVE'
        },
        create: {
            clientId: client.id,
            projectCode: 'PRJ-SPOON-CRONO-2026',
            projectName: 'Plan Anual de Vigilancia Microbiológica Puntos de Venta Spoon 2026',
            contractType: 'PLAN_MUESTREO_PERSONALIZADO',
            startDate: new Date('2026-01-01T00:00:00.000Z'),
            status: 'ACTIVE'
        }
    });

    let plan = await prisma.samplingPlan.findFirst({
        where: { contractId: contract.id, planName: 'Cronograma Microbiológico Sucursales Spoon 2026' }
    });
    if (!plan) {
        plan = await prisma.samplingPlan.create({
            data: {
                contractId: contract.id,
                planName: 'Cronograma Microbiológico Sucursales Spoon 2026',
                industrySector: 'RESTO_BAR',
                profileType: 'EXISTING_PLAN_MAPPED',
                frequency: 'MENSUAL',
                status: 'ACTIVE'
            }
        });
    }

    await prisma.samplingPlanPoint.deleteMany({ where: { planId: plan.id } });

    const wb = XLSX.readFile(spoonFile);
    const ws = wb.Sheets['Cronograma'];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    const sucursales = [
        'Terramall', 'Desamparados', 'Trinidad', 'City Mall',
        'Multiplaza Curridabat', 'Zapote', 'Distrito 4', 'El Cristo',
        'La Ribera', 'Tobosi', 'Vía Colón', 'AFZ (Belén)'
    ];

    let puntosSpoonCount = 0;
    for (const suc of sucursales) {
        // Punto 1: Manos
        await prisma.samplingPlanPoint.create({
            data: {
                planId: plan.id,
                pointName: `Spoon ${suc} - Manos Manipuladores (Cocina/Servicio)`,
                zoneCategory: 'MANIPULADOR',
                matrixType: 'Hisopado de Manos',
                samplingFrequency: 'MENSUAL',
                targetParameters: JSON.stringify(['Recuento Total Aeróbico', 'Coliformes Totales', 'Coliformes Fecales', 'Staphylococcus aureus']),
                isoStandardRef: 'Reglamento de Manipuladores de Alimentos / RTCA'
            }
        });
        puntosSpoonCount++;

        // Punto 2: Superficie Inerte
        await prisma.samplingPlanPoint.create({
            data: {
                planId: plan.id,
                pointName: `Spoon ${suc} - Superficies (Manija microondas / Vajilla limpia / Tabla)`,
                zoneCategory: 'SUPERFICIE_CONTACTO',
                matrixType: 'Hisopado de Superficie Inerte',
                samplingFrequency: 'MENSUAL',
                targetParameters: JSON.stringify(['Recuento Total Aeróbico', 'Coliformes Totales', 'Listeria spp']),
                isoStandardRef: 'ISO 18593'
            }
        });
        puntosSpoonCount++;

        // Punto 3: Agua y Hielo
        await prisma.samplingPlanPoint.create({
            data: {
                planId: plan.id,
                pointName: `Spoon ${suc} - Agua Potable de Red & Hielo de Máquina`,
                zoneCategory: 'AGUA_POTABLE',
                matrixType: 'Agua y Hielo',
                samplingFrequency: 'BIMESTRAL',
                targetParameters: JSON.stringify(['Recuento Total Aeróbico', 'Coliformes Totales', 'Coliformes Fecales', 'Escherichia coli']),
                isoStandardRef: 'Decreto 38924-S'
            }
        });
        puntosSpoonCount++;
    }
    console.log(`Puntos registrados en Plan Spoon: ${puntosSpoonCount}`);
}

async function importTabacon() {
    console.log('\n--- 3. PROCESANDO PLAN TABACÓN THERMAL RESORT 2026 ---');
    const tabaconFile = 'C:/Users/HP LAB/Desktop/Muestreo II de superficies y alimentos Tabacón Thermal Resort.xlsx';
    if (!fs.existsSync(tabaconFile)) {
        console.warn('No se encontró archivo Tabacón:', tabaconFile);
        return;
    }

    const client = await prisma.corporateClient.upsert({
        where: { taxId: 'TAX-HOTELTABACON' },
        update: {
            companyName: 'Tabacón Thermal Resort & Spa',
            industrySector: 'Hotelería y Alimentos'
        },
        create: {
            taxId: 'TAX-HOTELTABACON',
            companyName: 'Tabacón Thermal Resort & Spa',
            industrySector: 'Hotelería y Alimentos'
        }
    });

    const contract = await prisma.industrialContract.upsert({
        where: { projectCode: 'PRJ-TABACON-2026' },
        update: {
            projectName: 'Plan Integral de Aseguramiento de Calidad Tabacón Resort 2026',
            status: 'ACTIVE'
        },
        create: {
            clientId: client.id,
            projectCode: 'PRJ-TABACON-2026',
            projectName: 'Plan Integral de Aseguramiento de Calidad Tabacón Resort 2026',
            contractType: 'PLAN_MUESTREO_PERSONALIZADO',
            startDate: new Date('2026-01-01T00:00:00.000Z'),
            status: 'ACTIVE'
        }
    });

    let plan = await prisma.samplingPlan.findFirst({
        where: { contractId: contract.id, planName: 'Monitoreo Microbiológico Cocinas, Bares y Habitaciones Tabacón' }
    });
    if (!plan) {
        plan = await prisma.samplingPlan.create({
            data: {
                contractId: contract.id,
                planName: 'Monitoreo Microbiológico Cocinas, Bares y Habitaciones Tabacón',
                industrySector: 'HOTEL_HOSPITALITY',
                profileType: 'EXISTING_PLAN_MAPPED',
                frequency: 'TRIMESTRAL',
                status: 'ACTIVE'
            }
        });
    }

    await prisma.samplingPlanPoint.deleteMany({ where: { planId: plan.id } });

    const wb = XLSX.readFile(tabaconFile);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

    let puntosTabaconCount = 0;
    const areasVistas = new Set();

    for (let r = 3; r < rows.length; r++) {
        const row = rows[r];
        if (!row || !row[1]) continue;
        const areaName = String(row[1]).trim();
        if (!areaName || areasVistas.has(areaName)) continue;
        areasVistas.add(areaName);

        const isHabitacion = areaName.toLowerCase().includes('habitaci');
        const isBar = areaName.toLowerCase().includes('bar');

        await prisma.samplingPlanPoint.create({
            data: {
                planId: plan.id,
                pointName: `Tabacón Resort - ${areaName}`,
                zoneCategory: isHabitacion ? 'SUPERFICIE_CONTACTO' : (isBar ? 'SUPERFICIE_CONTACTO' : 'SUPERFICIE_CONTACTO'),
                matrixType: isHabitacion ? 'Hisopado Inerte Hotelero' : 'Hisopado Gastronómico',
                samplingFrequency: 'TRIMESTRAL',
                targetParameters: JSON.stringify(['RTA', 'Coliformes Totales', 'Coliformes Fecales', 'E. coli', 'Staphylococcus aureus', 'Salmonella spp', 'Listeria spp']),
                isoStandardRef: 'Normativa Hotelera 5 Estrellas / ISO 18593'
            }
        });
        puntosTabaconCount++;
    }
    console.log(`Puntos registrados en Plan Tabacón: ${puntosTabaconCount}`);
}

async function main() {
    await importTacoBell();
    await importSpoon();
    await importTabacon();

    const totalPlanes = await prisma.samplingPlan.count();
    const totalPuntos = await prisma.samplingPlanPoint.count();

    console.log('\n=============================================================');
    console.log('RESUMEN DE CRONOGRAMAS Y PLANES DE MUESTREO REGISTRADOS:');
    console.log('=============================================================');
    console.log(`Planes de Muestreo Activos (SamplingPlan): ${totalPlanes}`);
    console.log(`Puntos de Muestreo Monitoreados (SamplingPlanPoint): ${totalPuntos}`);
    console.log('=============================================================\n');
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
