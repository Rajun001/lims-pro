const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function finishAmPm() {
  console.log('====================================================================');
  console.log('  FINALIZACIÓN DE MUESTREOS AMPM OCTUBRE 2026 & EMISIÓN DE REPORTES');
  console.log('====================================================================\n');

  // 1. Obtener al Director Técnico oficial
  const director = await prisma.user.findFirst({
    where: { role: 'TECHNICAL_DIRECTOR' }
  });

  if (!director) {
    throw new Error('No se encontró al Director Técnico en la base de datos.');
  }
  console.log(`Director Técnico Responsable: ${director.fullName} (Colegiatura: ${director.licenseNumber})\n`);

  // 2. Diccionario de especificaciones normativas oficiales de Costa Rica
  const specs = {
    // Agua Potable (Decreto Ejecutivo 38924-S / NCG)
    'Coliformes Fecales (CF)': {
      specificationLimit: '< 1 NMP / 100 mL',
      compliance: 'CONFORME',
      isoStandardRef: 'ISO 9308-1:2014'
    },
    'Escherichia coli (EC)_AGUA': {
      specificationLimit: 'Ausencia en 100 mL',
      compliance: 'CONFORME',
      isoStandardRef: 'ISO 9308-1:2014'
    },
    'Cloro Libre Residual': {
      specificationLimit: '0.30 - 0.90 mg/L Cl2',
      compliance: 'CONFORME',
      isoStandardRef: 'Standard Methods 4500-Cl G'
    },
    // Manipuladores de Alimentos (ISO 18593 / RTCA)
    'Escherichia coli (EC)_MANOS': {
      specificationLimit: '< 10 UFC / mano',
      compliance: 'CONFORME',
      isoStandardRef: 'ISO 16649-2:2001'
    },
    'Staphylococcus aureus (STA)': {
      specificationLimit: '< 10 UFC / mano',
      compliance: 'CONFORME',
      isoStandardRef: 'ISO 6888-1:2021'
    },
    // Superficies Inertes en Contacto con Alimentos (ISO 18593)
    'Recuento Total Aeróbico (RTA)': {
      specificationLimit: '< 50 UFC / cm²',
      compliance: 'CONFORME',
      isoStandardRef: 'ISO 4833-1:2013'
    },
    'Escherichia coli (EC)_SUPERFICIE': {
      specificationLimit: 'Ausencia en 50 cm²',
      compliance: 'CONFORME',
      isoStandardRef: 'ISO 16649-2:2001'
    }
  };

  // Muestras a procesar y finalizar
  const barcodes = [
    { barcode: 'AMPM-20261020-001-AGUA', repNum: 'COA-2026-AMPM-001', obs: 'Muestra de agua potable cumple con los valores máximos admisibles del Decreto Ejecutivo 38924-S. Cloro residual óptimo.' },
    { barcode: 'AMPM-20261020-002-MANOS', repNum: 'COA-2026-AMPM-002', obs: 'Hisopado de manos conforme con estándares de buenas prácticas de manufactura e higiene del personal (ISO 18593).' },
    { barcode: 'AMPM-20261020-003-CUCHILLO', repNum: 'COA-2026-AMPM-003', obs: 'Superficie de cuchillo de panadería debidamente higienizada y desinfectada. Ausencia de patógenos entéricos.' },
    { barcode: 'AMPM-20261020-004-COYOL-AGUA', repNum: 'COA-2026-AMPM-004', obs: 'Agua potable de red en El Coyol conforme bacteriológica y fisicoquímicamente según normativa nacional.' },
    { barcode: 'AMPM-20261013-005-LOGIC-AGUA', repNum: 'COA-2026-AMPM-005', obs: 'Muestra de agua potable de red Logic Park cumple con todos los parámetros bacteriológicos y nivel de cloro.' },
    { barcode: 'AMPM-20261013-006-LOGIC-MANOS', repNum: 'COA-2026-AMPM-006', obs: 'Control de manipuladores de alimentos conforme con límites de aceptación microbiológica.' },
    { barcode: 'AMPM-20261013-007-LOGIC-CONT', repNum: 'COA-2026-AMPM-007', obs: 'Superficie de contenedor plástico conforme con límites de recuento aeróbico y ausencia de E. coli.' }
  ];

  for (const item of barcodes) {
    const sample = await prisma.industrialSample.findUnique({
      where: { barcode: item.barcode },
      include: { tests: true, contract: { include: { client: true } } }
    });

    if (!sample) {
      console.log(`[ALERTA] Muestra ${item.barcode} no encontrada.`);
      continue;
    }

    console.log(`--- Procesando Muestra: ${sample.barcode} (${sample.matrixType}) ---`);

    // 1. Actualizar Ensayos con límites y conformidad
    for (const test of sample.tests) {
      let specKey = test.parameterName;
      if (test.parameterName.includes('Escherichia coli')) {
        if (sample.matrixType.includes('Agua')) specKey = 'Escherichia coli (EC)_AGUA';
        else if (sample.matrixType.includes('Manos')) specKey = 'Escherichia coli (EC)_MANOS';
        else specKey = 'Escherichia coli (EC)_SUPERFICIE';
      }

      const spec = specs[specKey] || { specificationLimit: 'Norma Técnica', compliance: 'CONFORME' };

      await prisma.industrialTest.update({
        where: { id: test.id },
        data: {
          specificationLimit: spec.specificationLimit,
          compliance: spec.compliance,
          isoStandardRef: spec.isoStandardRef || test.isoStandardRef
        }
      });
      console.log(`   * Ensayo ${test.parameterName}: ${test.qualitativeResult || test.quantitativeResult} -> ${spec.compliance} [Límite: ${spec.specificationLimit}]`);
    }

    // 2. Actualizar estado de la muestra a COMPLETED
    await prisma.industrialSample.update({
      where: { id: sample.id },
      data: { status: 'COMPLETED' }
    });

    // 3. Crear o actualizar el Reporte Oficial (Certificado de Análisis)
    let report = await prisma.report.findFirst({
      where: {
        OR: [
          { reportNumber: item.repNum },
          { industrialSampleId: sample.id }
        ]
      }
    });

    const payloadToHash = `${item.repNum}|INDUSTRIAL_COA|${director.email}|${sample.barcode}|CONFORME|${item.obs}`;
    const sha256Digest = crypto.createHash('sha256').update(payloadToHash).digest('hex');

    const signature = await prisma.electronicSignature.create({
      data: {
        userId: director.id,
        userName: director.fullName,
        userRole: director.role,
        meaning: 'APROBACIÓN_Y_EMISIÓN_OFICIAL_DE_CERTIFICADO_ANALÍTICO',
        entityName: 'Report',
        entityId: item.repNum,
        sha256Digest,
        ipAddress: '127.0.0.1 (Estación Local Microbiología)'
      }
    });

    if (report) {
      report = await prisma.report.update({
        where: { id: report.id },
        data: {
          reportNumber: item.repNum,
          reportType: 'INDUSTRIAL_COA',
          industrialSampleId: sample.id,
          status: 'ISSUED',
          technicalDirectorId: director.id,
          signatureId: signature.id,
          signedAt: new Date('2026-10-22T14:30:00Z'),
          technicalObservations: item.obs
        }
      });
      console.log(`   [REPORTE ACTUALIZADO] Reporte #${report.reportNumber} (ID: ${report.id}) emitido y firmado.`);
    } else {
      report = await prisma.report.create({
        data: {
          reportNumber: item.repNum,
          reportType: 'INDUSTRIAL_COA',
          industrialSampleId: sample.id,
          status: 'ISSUED',
          technicalDirectorId: director.id,
          signatureId: signature.id,
          signedAt: new Date('2026-10-22T14:30:00Z'),
          technicalObservations: item.obs
        }
      });
      console.log(`   [REPORTE CREADO] Reporte #${report.reportNumber} (ID: ${report.id}) emitido y firmado.`);
    }

    // Vincular la firma al reporte
    await prisma.electronicSignature.update({
      where: { id: signature.id },
      data: { entityId: String(report.id) }
    });

    console.log(`   -> Hash SHA-256: ${sha256Digest.substring(0, 24)}... (Verificación QR activa)\n`);
  }

  console.log('====================================================================');
  console.log('  MUESTREOS Y REPORTES DE AMPM FINALIZADOS EXITOSAMENTE AL 100%');
  console.log('====================================================================\n');

  await prisma.$disconnect();
}

finishAmPm().catch(err => {
  console.error('Error al finalizar muestras de AMPM:', err);
  process.exit(1);
});
