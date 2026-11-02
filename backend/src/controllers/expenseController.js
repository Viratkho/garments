const prisma = require('../config/database');

const getExpenses = async (req, res, next) => {
  try {
    const { categoryId, orderId, isOverhead, startDate, endDate, search, isArchived } = req.query;
    const where = {};

    if (isArchived === 'true') {
      where.isArchived = true;
    } else if (isArchived !== 'all') {
      where.isArchived = false;
    }

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    if (orderId) {
      where.orderId = Number(orderId);
    }

    if (isOverhead !== undefined) {
      where.isOverhead = isOverhead === 'true';
    }

    if (startDate && endDate) {
      where.expenseDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search) {
      where.OR = [
        { expenseNumber: { contains: search } },
        { description: { contains: search } },
        { category: { name: { contains: search } } },
      ];
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        category: true,
        order: {
          select: { id: true, orderNumber: true, title: true },
        },
        supplier: {
          select: { id: true, name: true },
        },
        overheadAllocations: {
          include: {
            order: { select: { id: true, orderNumber: true, title: true } },
          },
        },
      },
      orderBy: { expenseDate: 'desc' },
    });

    return res.json({ success: true, data: expenses });
  } catch (error) {
    next(error);
  }
};

const getExpenseById = async (req, res, next) => {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        category: true,
        order: true,
        supplier: true,
        overheadAllocations: {
          include: { order: true },
        },
      },
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    return res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const {
      categoryId,
      description,
      amount,
      expenseDate,
      orderId,
      paymentMethod,
      supplierId,
      isOverhead,
    } = req.body;

    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Expense category is required' });
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid expense amount is required' });
    }

    const latestExp = await prisma.expense.findFirst({ orderBy: { id: 'desc' } });
    const nextExpNum = latestExp ? latestExp.id + 1 : 1;
    const expenseNumber = `GF-EXP-${String(nextExpNum).padStart(4, '0')}-${Date.now().toString().slice(-4)}`;
    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        categoryId: Number(categoryId),
        description: description || null,
        amount: numAmount,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        orderId: orderId ? Number(orderId) : null,
        paymentMethod: paymentMethod || 'CASH',
        supplierId: supplierId ? Number(supplierId) : null,
        receiptUrl,
        isOverhead: isOverhead === 'true' || isOverhead === true,
      },
      include: { category: true, order: true },
    });

    return res.status(201).json({ success: true, message: 'Expense recorded successfully', data: expense });
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const {
      categoryId,
      description,
      amount,
      expenseDate,
      orderId,
      paymentMethod,
      supplierId,
      isOverhead,
      isArchived,
    } = req.body;

    const receiptUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.expense.update({
      where: { id: Number(req.params.id) },
      data: {
        categoryId: categoryId ? Number(categoryId) : undefined,
        description: description !== undefined ? description : undefined,
        amount: amount !== undefined ? Number(amount) : undefined,
        expenseDate: expenseDate ? new Date(expenseDate) : undefined,
        orderId: orderId !== undefined ? (orderId ? Number(orderId) : null) : undefined,
        paymentMethod: paymentMethod || undefined,
        supplierId: supplierId !== undefined ? (supplierId ? Number(supplierId) : null) : undefined,
        isOverhead: isOverhead !== undefined ? (isOverhead === 'true' || isOverhead === true) : undefined,
        isArchived: isArchived !== undefined ? Boolean(isArchived) : undefined,
        ...(receiptUrl && { receiptUrl }),
      },
    });

    return res.json({ success: true, message: 'Expense updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    await prisma.expense.update({
      where: { id: Number(req.params.id) },
      data: { isArchived: true },
    });
    return res.json({ success: true, message: 'Expense archived successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Allocate shared overhead expense among active orders
 * Supports: MANUAL, EQUAL, QUANTITY_BASED
 */
const allocateOverheadExpense = async (req, res, next) => {
  try {
    const expenseId = Number(req.params.id);
    const { allocationMethod, orderAllocations } = req.body;

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const totalExpenseAmount = Number(expense.amount);

    const result = await prisma.$transaction(async (tx) => {
      // Remove previous overhead allocations for this expense if any
      await tx.overheadAllocation.deleteMany({
        where: { expenseId },
      });

      let allocationsToCreate = [];

      if (allocationMethod === 'EQUAL') {
        // Divide equally among selected orders
        const targetOrders = orderAllocations.map(o => Number(o.orderId));
        if (targetOrders.length === 0) throw new Error('At least one order must be selected');

        const splitAmount = Number((totalExpenseAmount / targetOrders.length).toFixed(2));
        allocationsToCreate = targetOrders.map(orderId => ({
          expenseId,
          orderId,
          allocationMethod: 'EQUAL',
          allocatedAmount: splitAmount,
          notes: `Equal overhead split of Rs. ${totalExpenseAmount} among ${targetOrders.length} orders`,
        }));
      } else if (allocationMethod === 'QUANTITY_BASED') {
        // Weight according to order pieces
        const targetOrders = await tx.order.findMany({
          where: { id: { in: orderAllocations.map(o => Number(o.orderId)) } },
        });

        const totalPieces = targetOrders.reduce((sum, o) => sum + (o.totalPieces || 1), 0);
        allocationsToCreate = targetOrders.map(order => {
          const share = totalPieces > 0 ? (order.totalPieces / totalPieces) * totalExpenseAmount : 0;
          return {
            expenseId,
            orderId: order.id,
            allocationMethod: 'QUANTITY_BASED',
            allocatedAmount: Number(share.toFixed(2)),
            notes: `Quantity-weighted overhead (${order.totalPieces}/${totalPieces} pieces)`,
          };
        });
      } else {
        // MANUAL
        let sumManual = 0;
        for (const item of orderAllocations) {
          const amt = Number(item.allocatedAmount);
          sumManual += amt;
          allocationsToCreate.push({
            expenseId,
            orderId: Number(item.orderId),
            allocationMethod: 'MANUAL',
            allocatedAmount: amt,
            notes: item.notes || 'Manual overhead allocation',
          });
        }
        if (sumManual > totalExpenseAmount) {
          throw new Error(`Allocated sum (Rs. ${sumManual}) exceeds total expense amount (Rs. ${totalExpenseAmount})`);
        }
      }

      const created = [];
      for (const alloc of allocationsToCreate) {
        const item = await tx.overheadAllocation.create({ data: alloc });
        created.push(item);
      }

      return created;
    });

    return res.status(200).json({
      success: true,
      message: 'Overhead allocated to orders successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await prisma.expenseCategory.findMany({
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const { name, isOverhead } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }

    const cat = await prisma.expenseCategory.create({
      data: {
        name: name.trim(),
        isOverhead: Boolean(isOverhead),
      },
    });

    return res.status(201).json({ success: true, message: 'Category created', data: cat });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  allocateOverheadExpense,
  getCategories,
  createCategory,
};
