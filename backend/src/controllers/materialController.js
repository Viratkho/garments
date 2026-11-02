const prisma = require('../config/database');
const inventoryService = require('../services/inventoryService');

const getMaterials = async (req, res, next) => {
  try {
    const { categoryId, lowStock, search, isArchived } = req.query;
    const where = {};

    if (isArchived === 'true') {
      where.isArchived = true;
    } else if (isArchived !== 'all') {
      where.isArchived = false;
    }

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { category: { name: { contains: search } } },
      ];
    }

    const materials = await prisma.material.findMany({
      where,
      include: {
        category: true,
        _count: {
          select: { purchaseItems: true, materialConsumptions: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Compute valuation and check low stock condition
    const enriched = materials.map(m => {
      const currentStock = Number(m.currentStock);
      const minLevel = Number(m.minStockLevel);
      const avgCost = Number(m.weightedAvgCost);
      const isLow = currentStock <= minLevel;
      const totalValuation = Number((currentStock * avgCost).toFixed(2));

      return {
        ...m,
        currentStock,
        minStockLevel: minLevel,
        weightedAvgCost: avgCost,
        isLowStock: isLow,
        totalValuation,
      };
    });

    const finalData = lowStock === 'true' ? enriched.filter(m => m.isLowStock) : enriched;

    return res.json({ success: true, data: finalData });
  } catch (error) {
    next(error);
  }
};

const getMaterialById = async (req, res, next) => {
  try {
    const material = await prisma.material.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        category: true,
        purchaseItems: {
          include: {
            purchase: { include: { supplier: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        materialConsumptions: {
          include: {
            order: { include: { company: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        inventoryTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 30,
        },
      },
    });

    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' });
    }

    const currentStock = Number(material.currentStock);
    const avgCost = Number(material.weightedAvgCost);

    return res.json({
      success: true,
      data: {
        ...material,
        currentStock,
        weightedAvgCost: avgCost,
        totalValuation: Number((currentStock * avgCost).toFixed(2)),
      },
    });
  } catch (error) {
    next(error);
  }
};

const createMaterial = async (req, res, next) => {
  try {
    const { name, categoryId, description, unit, openingStock, minStockLevel, initialUnitCost } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Material name is required' });
    }
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category is required' });
    }

    const openStock = Number(openingStock) || 0;
    const minStock = Number(minStockLevel) || 0;
    const initCost = Number(initialUnitCost) || 0;

    const result = await prisma.$transaction(async (tx) => {
      const material = await tx.material.create({
        data: {
          name: name.trim(),
          categoryId: Number(categoryId),
          description: description || null,
          unit: unit || 'METRE',
          openingStock: openStock,
          currentStock: openStock,
          minStockLevel: minStock,
          weightedAvgCost: initCost,
        },
        include: { category: true },
      });

      if (openStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            materialId: material.id,
            transactionType: 'PURCHASE',
            quantity: openStock,
            unitCost: initCost,
            referenceType: 'MANUAL',
            notes: 'Opening stock registration',
          },
        });
      }

      return material;
    });

    return res.status(201).json({
      success: true,
      message: 'Material registered successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateMaterial = async (req, res, next) => {
  try {
    const { name, categoryId, description, unit, minStockLevel, isArchived } = req.body;

    const updated = await prisma.material.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name && { name: name.trim() }),
        categoryId: categoryId ? Number(categoryId) : undefined,
        description: description !== undefined ? description : undefined,
        unit: unit || undefined,
        minStockLevel: minStockLevel !== undefined ? Number(minStockLevel) : undefined,
        isArchived: isArchived !== undefined ? Boolean(isArchived) : undefined,
      },
      include: { category: true },
    });

    return res.json({ success: true, message: 'Material updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteMaterial = async (req, res, next) => {
  try {
    await prisma.material.update({
      where: { id: Number(req.params.id) },
      data: { isArchived: true },
    });

    return res.json({ success: true, message: 'Material archived successfully' });
  } catch (error) {
    next(error);
  }
};

const adjustStock = async (req, res, next) => {
  try {
    const materialId = Number(req.params.id);
    const { adjustedStock, reason } = req.body;

    if (adjustedStock === undefined || adjustedStock === null) {
      return res.status(400).json({ success: false, message: 'New adjusted stock is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      return await inventoryService.adjustStock(tx, {
        materialId,
        adjustedStock: Number(adjustedStock),
        reason,
      });
    });

    return res.json({ success: true, message: 'Stock adjusted successfully', data: result });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.materialCategory.findMany({
      include: {
        _count: { select: { materials: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const category = await prisma.materialCategory.create({
      data: {
        name: name.trim(),
        description: description || null,
      },
    });

    return res.status(201).json({ success: true, message: 'Category created', data: category });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaterials,
  getMaterialById,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  adjustStock,
  getCategories,
  createCategory,
};
