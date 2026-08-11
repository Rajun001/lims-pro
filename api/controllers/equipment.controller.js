import prisma from '../config/db.js';

export const getEquipment = async (req, res) => {
  try {
    const eq = await prisma.equipment.findMany();
    res.json(eq.map(x => ({
      id: x.id,
      name: x.name,
      lastCal: x.lastCalibration ? x.lastCalibration.toISOString().slice(0,10) : '',
      nextCal: x.nextCalibration ? x.nextCalibration.toISOString().slice(0,10) : '',
      status: x.status
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
};

export const saveEquipment = async (req, res) => {
  try {
    const { id, name, lastCal, nextCal, status } = req.body;
    const parsedLast = lastCal ? new Date(lastCal) : null;
    const parsedNext = nextCal ? new Date(nextCal) : null;

    const eq = await prisma.equipment.upsert({
      where: { id },
      update: { name, lastCalibration: parsedLast, nextCalibration: parsedNext, status },
      create: { id, name, lastCalibration: parsedLast, nextCalibration: parsedNext, status }
    });
    res.json({ success: true, equipment: eq });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save equipment' });
  }
};

export const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.equipment.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
};
