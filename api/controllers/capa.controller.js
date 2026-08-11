import prisma from '../config/db.js';

export const getCapas = async (req, res) => {
  try {
    const capas = await prisma.capa.findMany();
    res.json(capas.map(x => ({
      id: x.id.toString(),
      title: x.title,
      description: x.description || '',
      origin: x.origin,
      status: x.status,
      assignedTo: x.assignedTo || '',
      createdAt: x.createdAt
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch CAPA logs' });
  }
};

export const saveCapa = async (req, res) => {
  try {
    const { id, title, description, origin, status, assignedTo } = req.body;
    let capa;
    if (id && !isNaN(parseInt(id))) {
      capa = await prisma.capa.upsert({
        where: { id: parseInt(id) },
        update: { title, description, origin, status, assignedTo },
        create: { title, description, origin, status, assignedTo }
      });
    } else {
      capa = await prisma.capa.create({
        data: { title, description, origin, status, assignedTo }
      });
    }
    res.json({ success: true, capa });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save CAPA log' });
  }
};

export const deleteCapa = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.capa.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete CAPA log' });
  }
};
