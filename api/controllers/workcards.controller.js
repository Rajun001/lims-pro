import prisma from '../config/db.js';

export const getWorkcards = async (req, res) => {
  try {
    const workcards = await prisma.sample.findMany({
      where: { sampleType: 'Cultivo Microbiológico' },
      include: {
        patient: true,
        workcards: true,
        orders: {
          include: {
            tests: true
          }
        },
        antibiograms: true
      }
    });
    
    // Map to frontend expected format
    const formatted = workcards.map(s => {
      const wc = s.workcards[0] || {};
      const order = s.orders[0] || {};
      const test = order.tests?.[0] || {};
      return {
        id: s.id.toString(),
        barcode: s.barcode,
        clientName: s.patient ? `${s.patient.firstName} ${s.patient.lastName}` : 'Desconocido',
        analysisRequested: test.testName || 'Cultivo',
        microbiologyStatus: order.status === 'PENDING' ? 'siembra' : order.status,
        date: s.receivedAt,
        status: order.status,
        media: wc.mediaType,
        readDay1: wc.readDay1,
        readDay2: wc.readDay2,
        antibiogram: s.antibiograms[0] || null
      };
    });
    
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch workcards' });
  }
};

export const updateWorkcard = async (req, res) => {
  try {
    const { id } = req.params;
    const { media, readings, antibiogram } = req.body;

    // First find the sample
    const sample = await prisma.sample.findUnique({
      where: { id: parseInt(id) },
      include: { workcards: true, antibiograms: true }
    });

    if (!sample) return res.status(404).json({ error: 'Muestra no encontrada' });

    // Update or create Workcard
    let workcardId = sample.workcards[0]?.id;
    if (workcardId) {
      await prisma.workcard.update({
        where: { id: workcardId },
        data: {
          mediaType: JSON.stringify(media),
          readDay1: readings.day1,
          readDay2: readings.day2
        }
      });
    } else {
      await prisma.workcard.create({
        data: {
          sampleId: sample.id,
          mediaType: JSON.stringify(media),
          readDay1: readings.day1,
          readDay2: readings.day2
        }
      });
    }

    // Update or create Antibiogram if provided
    if (antibiogram && antibiogram.pathogen) {
      let antiId = sample.antibiograms[0]?.id;
      if (antiId) {
        await prisma.antibiogram.update({
          where: { id: antiId },
          data: {
            bacteriaIdentified: antibiogram.pathogen,
            jsonResults: JSON.stringify(antibiogram.antibiotics)
          }
        });
      } else {
        await prisma.antibiogram.create({
          data: {
            sampleId: sample.id,
            bacteriaIdentified: antibiogram.pathogen,
            guidelineUsed: "CLSI",
            jsonResults: JSON.stringify(antibiogram.antibiotics)
          }
        });
      }
    }

    res.json({ success: true, message: 'Workcard updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update workcard' });
  }
};
