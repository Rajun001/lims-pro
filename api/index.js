import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const prisma = new PrismaClient({});
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Serve React static files in production
app.use(express.static(path.join(__dirname, '../dist')));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'LIMS API is running' });
});

// Get microbiology workcards
app.get('/api/workcards', async (req, res) => {
  try {
    const workcards = await prisma.sample.findMany({
      where: { sampleType: 'Cultivo Microbiológico' },
      include: {
        patient: true,
        workcards: true,
        orders: true,
        antibiograms: true
      }
    });
    
    // Map to frontend expected format
    const formatted = workcards.map(s => {
      const wc = s.workcards[0] || {};
      const order = s.orders[0] || {};
      return {
        id: s.id.toString(),
        barcode: s.barcode,
        clientName: s.patient ? `${s.patient.firstName} ${s.patient.lastName}` : 'Desconocido',
        analysisRequested: order.testName || 'Cultivo',
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
});

// Update a workcard and antibiogram
app.put('/api/workcards/:id', async (req, res) => {
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
});

// Analyzer Ingest Webhook
app.post('/api/analyzer-ingest', async (req, res) => {
  try {
    const data = req.body;
    console.log("[API] Recibidos datos del analizador:", data.type);

    let barcode = null;
    let _pathogen = null;
    let results = [];

    // Parse logic based on mapped ASTM/HL7 structure
    if (data.type === 'ASTM') {
      // Intentar encontrar el código de barras en la orden
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

    // Simplificación: si los resultados contienen "MIC" o antibióticos, actualizar antibiograma
    // Convertir a formato del frontend
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
          bacteriaIdentified: "Identificación Automática", // Se podría parsear de resultados si está
          guidelineUsed: "CLSI",
          jsonResults: JSON.stringify(antibiotics)
        }
      });
    }

    console.log(`[API] Ingesta exitosa para la muestra ${barcode}`);
    res.json({ success: true });

  } catch (err) {
    console.error('[API] Error procesando ingesta:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// React Router Fallback (Debe ir después de todas las rutas /api)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});
