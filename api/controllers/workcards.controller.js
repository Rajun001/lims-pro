import prisma from '../config/db.js';

export const getWorkcards = async (req, res) => {
  try {
    const clinicalSamples = await prisma.clinicalSample.findMany({
      include: {
        patient: true,
        orders: {
          include: {
            tests: true
          }
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    const industrialSamples = await prisma.industrialSample.findMany({
      include: {
        contract: {
          include: {
            client: true
          }
        },
        tests: true
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    const formattedClinical = clinicalSamples.map(s => {
      const order = s.orders?.[0] || {};
      const test = order.tests?.[0] || {};
      return {
        id: `CLIN-${s.id}`,
        barcode: s.barcode,
        clientName: s.patient ? `${s.patient.firstName} ${s.patient.lastName}`.trim() : 'Paciente Clínico',
        analysisRequested: test.testName || s.sampleType || 'Cultivo Microbiológico',
        microbiologyStatus: s.status === 'RECEIVED' ? 'siembra' : (s.status === 'IN_ANALYSIS' ? 'lectura_1' : 'completado'),
        date: s.receivedAt,
        status: s.status,
        media: 'Agar Sangre / MacConkey',
        readDay1: '',
        readDay2: '',
        antibiogram: null
      };
    });

    const formattedIndustrial = industrialSamples.map(s => {
      const test = s.tests?.[0] || {};
      const client = s.contract?.client;
      return {
        id: `IND-${s.id}`,
        barcode: s.barcode,
        clientName: client?.companyName || 'Cliente Industrial',
        analysisRequested: test.parameterName || s.matrixType || 'Análisis Microbiológico',
        microbiologyStatus: s.status === 'RECEIVED' ? 'siembra' : (s.status === 'IN_ANALYSIS' ? 'lectura_1' : 'completado'),
        date: s.receivedAt,
        status: s.status,
        media: 'BHI / PCA',
        readDay1: '',
        readDay2: '',
        antibiogram: null
      };
    });

    res.json([...formattedClinical, ...formattedIndustrial]);
  } catch (error) {
    console.error('[WORKCARDS] Error:', error.message);
    res.status(500).json({ error: 'Error al recuperar hojas de trabajo microbiológicas', details: error.message });
  }
};

export const updateWorkcard = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (id.startsWith('CLIN-')) {
      const numericId = parseInt(id.replace('CLIN-', ''), 10);
      await prisma.clinicalSample.update({
        where: { id: numericId },
        data: { status: status || 'IN_ANALYSIS' }
      });
    } else if (id.startsWith('IND-')) {
      const numericId = parseInt(id.replace('IND-', ''), 10);
      await prisma.industrialSample.update({
        where: { id: numericId },
        data: { status: status || 'IN_ANALYSIS' }
      });
    }

    res.json({ success: true, message: 'Hoja de trabajo actualizada exitosamente' });
  } catch (error) {
    console.error('[WORKCARDS-UPDATE] Error:', error.message);
    res.status(500).json({ error: 'Error al actualizar hoja de trabajo', details: error.message });
  }
};
