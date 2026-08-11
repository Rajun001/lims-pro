import prisma from '../config/db.js';

export const getInventory = async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany();
    res.json(items.map(x => ({
      id: x.id.toString(),
      name: x.name,
      lot: x.lot || '',
      expiration: x.expirationDate ? x.expirationDate.toISOString().slice(0, 10) : '',
      stock: x.stock,
      unit: x.unit || ''
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
};

export const saveInventory = async (req, res) => {
  try {
    const { id, name, lot, expiration, stock, unit } = req.body;
    const parsedStock = stock ? parseInt(stock) : 0;
    const parsedExp = expiration ? new Date(expiration) : null;
    let item;
    
    if (id && !isNaN(parseInt(id))) {
      item = await prisma.inventoryItem.upsert({
        where: { id: parseInt(id) },
        update: { name, lot, expirationDate: parsedExp, stock: parsedStock, unit },
        create: { name, lot, expirationDate: parsedExp, stock: parsedStock, unit }
      });
    } else {
      item = await prisma.inventoryItem.create({
        data: { name, lot, expirationDate: parsedExp, stock: parsedStock, unit }
      });
    }
    res.json({ success: true, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save inventory item' });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.inventoryItem.delete({
      where: { id: parseInt(id) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};
