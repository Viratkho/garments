const prisma = require('../config/database');
const costingEngine = require('../services/costingEngine');

const getOrders = async (req, res, next) => {
  try {
    const { status, companyId, search, startDate, endDate, isArchived } = req.query;

    const where = {};
    if (isArchived === 'true') {
      where.isArchived = true;
    } else if (isArchived !== 'all') {
      where.isArchived = false;
    }

    if (status) {
      where.status = status;
    }

    if (companyId) {
      where.companyId = Number(companyId);
    }

    if (startDate && endDate) {
      where.orderDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { title: { contains: search } },
        { company: { name: { contains: search } } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { id: true, name: true, code: true, phone: true },
        },
        items: true,
        _count: {
          select: {
            materialConsumptions: true,
            labourAllocations: true,
            expenses: true,
            deliveries: true,
            payments: true,
          },
        },
      },
    });

    return res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        company: true,
        items: true,
        specifications: true,
        materialConsumptions: {
          include: { material: true },
        },
        labourAllocations: {
          include: { worker: true },
        },
        expenses: {
          include: { category: true },
        },
        overheadAllocations: {
          include: {
            expense: { include: { category: true } },
          },
        },
        productionUpdates: {
          include: { stage: true },
          orderBy: { stage: { stageOrder: 'asc' } },
        },
        qualityRecords: {
          include: { stage: true },
          orderBy: { inspectionDate: 'desc' },
        },
        deliveries: {
          orderBy: { deliveryDate: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        invoices: {
          include: { items: true },
          orderBy: { invoiceDate: 'desc' },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Include calculated costing summary
    const costing = await costingEngine.calculateOrderCosting(order.id);

    return res.json({
      success: true,
      data: {
        ...order,
        costing,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const {
      companyId,
      title,
      description,
      pricingMethod,
      totalPieces,
      unitRate,
      totalQuotedAmount,
      deliveryDate,
      specialInstructions,
      items = [],
      specifications = [],
    } = req.body;

    if (!companyId) {
      return res.status(400).json({ success: false, message: 'Company is required' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Order title is required' });
    }

    const pieces = Number(totalPieces) || 0;
    const rate = Number(unitRate) || 0;
    const quote = Number(totalQuotedAmount) || 0;

    // Calculate revenue
    let totalRevenue = 0;
    if (pricingMethod === 'FIXED_QUOTE') {
      totalRevenue = quote;
    } else {
      if (items.length > 0) {
        totalRevenue = items.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.unitPrice || 0)), 0);
      } else {
        totalRevenue = pieces * rate;
      }
    }

    // Generate Order Number
    const count = await prisma.order.count();
    const orderNumber = `GF-ORD-${String(count + 1).padStart(4, '0')}`;

    // Handle design image upload if present
    const designImageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.designImageUrl || null);

    // Database transaction to create Order, items, specifications, and initial production stages
    const result = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          companyId: Number(companyId),
          title: title.trim(),
          description: description || null,
          pricingMethod: pricingMethod || 'PER_PIECE',
          totalPieces: pieces,
          unitRate: rate > 0 ? rate : null,
          totalQuotedAmount: quote > 0 ? quote : null,
          totalRevenue,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          specialInstructions: specialInstructions || null,
          designImageUrl,
          status: 'PENDING',
        },
      });

      // Insert Order Items if provided
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const itemQty = Number(item.quantity) || 0;
          const itemPrice = Number(item.unitPrice) || rate || 0;
          await tx.orderItem.create({
            data: {
              orderId: newOrder.id,
              garmentType: item.garmentType || 'Garment',
              description: item.description || null,
              color: item.color || null,
              size: item.size || null,
              quantity: itemQty,
              unitPrice: itemPrice,
              totalAmount: itemQty * itemPrice,
            },
          });
        }
      } else if (pieces > 0) {
        // Create a default item
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            garmentType: title,
            quantity: pieces,
            unitPrice: rate,
            totalAmount: totalRevenue,
          },
        });
      }

      // Insert Specifications
      if (Array.isArray(specifications) && specifications.length > 0) {
        for (const spec of specifications) {
          if (spec.specKey && spec.specValue) {
            await tx.orderSpecification.create({
              data: {
                orderId: newOrder.id,
                specKey: spec.specKey,
                specValue: spec.specValue,
                notes: spec.notes || null,
              },
            });
          }
        }
      }

      // Initialize default production stages for this order
      const defaultStages = await tx.productionStage.findMany({
        orderBy: { stageOrder: 'asc' },
      });

      for (const stage of defaultStages) {
        await tx.productionUpdate.create({
          data: {
            orderId: newOrder.id,
            stageId: stage.id,
            completedQuantity: stage.stageOrder === 1 ? pieces : 0, // Order Received is initial
            status: stage.stageOrder === 1 ? 'COMPLETED' : 'NOT_STARTED',
          },
        });
      }

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: 'Order created successfully with tracking stages',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const updateOrder = async (req, res, next) => {
  try {
    const orderId = Number(req.params.id);
    const {
      title,
      description,
      status,
      pricingMethod,
      totalPieces,
      unitRate,
      totalQuotedAmount,
      deliveryDate,
      specialInstructions,
    } = req.body;

    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const pieces = totalPieces !== undefined ? Number(totalPieces) : existing.totalPieces;
    const rate = unitRate !== undefined ? Number(unitRate) : Number(existing.unitRate || 0);
    const quote = totalQuotedAmount !== undefined ? Number(totalQuotedAmount) : Number(existing.totalQuotedAmount || 0);
    const method = pricingMethod || existing.pricingMethod;

    let totalRevenue = Number(existing.totalRevenue);
    if (method === 'FIXED_QUOTE') {
      totalRevenue = quote;
    } else {
      totalRevenue = pieces * rate;
    }

    const designImageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        ...(title && { title: title.trim() }),
        description: description !== undefined ? description : undefined,
        status: status || undefined,
        pricingMethod: method,
        totalPieces: pieces,
        unitRate: rate > 0 ? rate : null,
        totalQuotedAmount: quote > 0 ? quote : null,
        totalRevenue,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        specialInstructions: specialInstructions !== undefined ? specialInstructions : undefined,
        ...(designImageUrl && { designImageUrl }),
      },
    });

    return res.json({ success: true, message: 'Order updated successfully', data: updated });
  } catch (error) {
    next(error);
  }
};

const duplicateOrder = async (req, res, next) => {
  try {
    const original = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { items: true, specifications: true },
    });

    if (!original) {
      return res.status(404).json({ success: false, message: 'Original order not found' });
    }

    const count = await prisma.order.count();
    const orderNumber = `GF-ORD-${String(count + 1).padStart(4, '0')}`;

    const duplicated = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          companyId: original.companyId,
          title: `${original.title} (Copy)`,
          description: original.description,
          pricingMethod: original.pricingMethod,
          totalPieces: original.totalPieces,
          unitRate: original.unitRate,
          totalQuotedAmount: original.totalQuotedAmount,
          totalRevenue: original.totalRevenue,
          specialInstructions: original.specialInstructions,
          designImageUrl: original.designImageUrl,
          status: 'PENDING',
        },
      });

      for (const item of original.items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            garmentType: item.garmentType,
            description: item.description,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.totalAmount,
          },
        });
      }

      for (const spec of original.specifications) {
        await tx.orderSpecification.create({
          data: {
            orderId: newOrder.id,
            specKey: spec.specKey,
            specValue: spec.specValue,
            notes: spec.notes,
          },
        });
      }

      // Initialize stages
      const stages = await tx.productionStage.findMany({ orderBy: { stageOrder: 'asc' } });
      for (const stage of stages) {
        await tx.productionUpdate.create({
          data: {
            orderId: newOrder.id,
            stageId: stage.id,
            completedQuantity: stage.stageOrder === 1 ? newOrder.totalPieces : 0,
            status: stage.stageOrder === 1 ? 'COMPLETED' : 'NOT_STARTED',
          },
        });
      }

      return newOrder;
    });

    return res.status(201).json({
      success: true,
      message: 'Order duplicated successfully',
      data: duplicated,
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const updated = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { status: 'CANCELLED' },
    });

    return res.json({ success: true, message: 'Order marked as cancelled', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: { isArchived: true },
    });

    return res.json({ success: true, message: 'Order archived successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrder,
  duplicateOrder,
  cancelOrder,
  deleteOrder,
};
