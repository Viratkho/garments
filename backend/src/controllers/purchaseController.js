const prisma = require('../config/database');
const inventoryService = require('../services/inventoryService');

const getPurchases = async (req, res, next) => {
  try {
    const { supplierId, startDate, endDate, search } = req.query;
    const where = {};

    if (supplierId) {
      where.supplierId = Number(supplierId);
    }

    if (startDate && endDate) {
      where.purchaseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search) {
      where.OR = [
        { purchaseNumber: { contains: search } },
        { invoiceRef: { contains: search } },
        { supplier: { name: { contains: search } } },
      ];
    }

    const purchases = await prisma.materialPurchase.findMany({
      where,
      include: {
        supplier: true,
        items: {
          include: { material: true },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    });

    return res.json({ success: true, data: purchases });
  } catch (error) {
    next(error);
  }
};

const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await prisma.materialPurchase.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        supplier: true,
        items: {
          include: {
            material: {
              include: { category: true },
            },
          },
        },
      },
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase record not found' });
    }

    return res.json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

const createPurchase = async (req, res, next) => {
  try {
    const {
      supplierId,
      purchaseDate,
      invoiceRef,
      paymentStatus,
      totalAmount,
      paidAmount,
      notes,
    } = req.body;

    let items = req.body.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }

    if (!supplierId) {
      return res.status(400).json({ success: false, message: 'Supplier is required' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one material item is required' });
    }

    const calculatedTotal = totalAmount !== undefined && totalAmount !== null
      ? Number(totalAmount)
      : items.reduce((sum, item) => sum + Number(item.totalCost || (Number(item.quantity || 0) * Number(item.unitCost || 0))), 0);

    const calculatedPaid = paidAmount !== undefined && paidAmount !== null
      ? Number(paidAmount)
      : calculatedTotal;

    const billAttachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Execute in transaction
    const purchase = await prisma.$transaction(async (tx) => {
      return await inventoryService.processPurchase(tx, {
        supplierId: Number(supplierId),
        purchaseDate,
        invoiceRef,
        paymentStatus,
        totalAmount: calculatedTotal,
        paidAmount: calculatedPaid,
        billAttachmentUrl,
        notes,
        items,
      });
    });

    // Also record as a business expense for materials
    const materialExpenseCat = await prisma.expenseCategory.findFirst({
      where: { name: { contains: 'Material' } },
    });

    if (materialExpenseCat) {
      const latestExp = await prisma.expense.findFirst({ orderBy: { id: 'desc' } });
      const nextExpNum = latestExp ? latestExp.id + 1 : 1;
      await prisma.expense.create({
        data: {
          expenseNumber: `GF-EXP-PUR-${String(nextExpNum).padStart(4, '0')}-${Date.now().toString().slice(-4)}`,
          expenseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          categoryId: materialExpenseCat.id,
          description: `Material Purchase ${purchase.purchaseNumber} from supplier`,
          amount: calculatedTotal,
          paymentMethod: paymentStatus === 'PAID' ? 'BANK_TRANSFER' : 'CASH',
          supplierId: Number(supplierId),
          receiptUrl: billAttachmentUrl,
          isOverhead: false,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Material purchase recorded and inventory updated with weighted average costing',
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
};
