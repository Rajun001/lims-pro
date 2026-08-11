import prisma from '../config/db.js';

export const ingestAnalyzerData = async (req, res) => {
  try {
    const data = req.body;
    console.log("[API] Recibidos datos del analizador:", data.type);

    let barcode = null;
    let results = [];

    // Parse logic based on mapped ASTM/HL7 structure
    if (data.type === 'ASTM') {
      barcode = data.orders?.[0]?.orderId; 
      results = data.results || [];
    } else if (data.type === 'HL7') {
      barcode = data.orderNumber;
      results = data.results || [];
    }

    if (!barcode) {
      return res.status(400).json({ error: 'Falta código de barras o ID de Orden' });
    }

    // Buscar muestra por código de barras
    const sample = await prisma.sample.findUnique({
      where: { barcode },
      include: { antibiograms: true }
    });

    if (!sample) {
      console.warn(`[API] Muestra con código ${barcode} no encontrada. Resultados ignorados.`);
      return res.status(404).json({ error: 'Muestra no encontrada en el LIMS' });
    }

    if (sample.sampleType === 'Cultivo Microbiológico') {
      // Lógica de Antibiograma (Microbiología)
      const antibiotics = results.map(r => ({
        name: r.testCode || r.testId,
        halo: r.value,
        sir: r.abnormalFlags || r.flag || 'S'
      }));

      let antiId = sample.antibiograms[0]?.id;
      if (antiId) {
        await prisma.antibiogram.update({
          where: { id: antiId },
          data: {
            jsonResults: JSON.stringify(antibiotics)
          }
        });
      } else {
        await prisma.antibiogram.create({
          data: {
            sampleId: sample.id,
            bacteriaIdentified: "Identificación Automática",
            guidelineUsed: "CLSI",
            jsonResults: JSON.stringify(antibiotics)
          }
        });
      }
    } else {
      // Lógica de Química Sanguínea / Ensayos Generales (Prisma Test)
      let order = await prisma.order.findFirst({
        where: { sampleId: sample.id },
        include: { tests: true }
      });

      if (!order) {
        order = await prisma.order.create({
          data: {
            sampleId: sample.id,
            status: 'PENDING'
          },
          include: { tests: true }
        });
      }

      for (const r of results) {
        const name = r.testCode || r.testId || '';
        const cleanName = name.replace(/^\^\^\^/, ''); // Limpiar prefijo ASTM si existe
        const val = r.value ? r.value.toString() : '';

        // Buscar si el examen ya existe en la orden
        const testMatch = order.tests.find(t => 
          t.testName.toLowerCase() === cleanName.toLowerCase() || 
          t.testName.toLowerCase() === name.toLowerCase()
        );

        if (testMatch) {
          await prisma.test.update({
            where: { id: testMatch.id },
            data: {
              resultValue: val,
              unit: r.units || r.unit || testMatch.unit,
              referenceRange: r.referenceRanges || r.reference || testMatch.referenceRange
            }
          });
        } else {
          await prisma.test.create({
            data: {
              orderId: order.id,
              testName: cleanName,
              resultValue: val,
              unit: r.units || r.unit || '',
              referenceRange: r.referenceRanges || r.reference || ''
            }
          });
        }
      }

      // Actualizar estado de la orden a COMPLETADA
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'COMPLETED' }
      });
    }

    console.log(`[API] Ingesta exitosa para la muestra ${barcode}`);
    res.json({ success: true });

  } catch (err) {
    console.error('[API] Error procesando ingesta:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
