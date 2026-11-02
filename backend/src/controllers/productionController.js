const prisma = require('../config/database');

const getProductionStages = async (req, res, next) => {
  try {
    const stages = await prisma.productionStage.findMany({
      orderBy: { stageOrder: 'asc' },
    });
    return res.json({ success: true, data: stages });
  } catch (error) {
    next(error);
  }
};

const getOrderProduction = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
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
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    return res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

const updateStageProgress = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const {
      stageId,
      completedQuantity,
      defectiveQuantity,
      reworkQuantity,
      wastageRecorded,
      status,
      notes,
    } = req.body;

    if (!stageId) {
      return res.status(400).json({ success: false, message: 'Stage ID is required' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const stage = await prisma.productionStage.findUnique({ where: { id: Number(stageId) } });
    if (!stage) {
      return res.status(404).json({ success: false, message: 'Production stage not found' });
    }

    const completed = Number(completedQuantity || 0);
    const defective = Number(defectiveQuantity || 0);
    const rework = Number(reworkQuantity || 0);
    const waste = Number(wastageRecorded || 0);

    const update = await prisma.productionUpdate.upsert({
      where: {
        orderId_stageId: {
          orderId,
          stageId: stage.id,
        },
      },
      update: {
        completedQuantity: completed,
        defectiveQuantity: defective,
        reworkQuantity: rework,
        wastageRecorded: waste,
        status: status || (completed >= order.totalPieces ? 'COMPLETED' : 'IN_PROGRESS'),
        notes: notes || null,
        updatedBy: req.user ? req.user.name : 'System',
      },
      create: {
        orderId,
        stageId: stage.id,
        completedQuantity: completed,
        defectiveQuantity: defective,
        reworkQuantity: rework,
        wastageRecorded: waste,
        status: status || (completed >= order.totalPieces ? 'COMPLETED' : 'IN_PROGRESS'),
        notes: notes || null,
        updatedBy: req.user ? req.user.name : 'System',
      },
      include: { stage: true },
    });

    // Auto-progress order overall status
    if (stage.stageOrder === 9 && (status === 'COMPLETED' || completed >= order.totalPieces)) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'COMPLETED' },
      });
    } else if (stage.stageOrder === 10 && (status === 'COMPLETED' || completed >= order.totalPieces)) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' },
      });
    } else if (order.status === 'PENDING') {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return res.json({
      success: true,
      message: `Progress updated for stage "${stage.stageName}"`,
      data: update,
    });
  } catch (error) {
    next(error);
  }
};

const recordQualityCheck = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const {
      stageId,
      inspectedQuantity,
      approvedQuantity,
      rejectedQuantity,
      defectReason,
      status,
      notes,
    } = req.body;

    const inspected = Number(inspectedQuantity || 0);
    const approved = Number(approvedQuantity || 0);
    const rejected = Number(rejectedQuantity || 0);

    let defaultStageId = stageId;
    if (!defaultStageId) {
      const qcStage = await prisma.productionStage.findFirst({
        where: { stageName: { contains: 'Quality' } },
      });
      defaultStageId = qcStage ? qcStage.id : 8;
    }

    const record = await prisma.qualityRecord.create({
      data: {
        orderId,
        stageId: Number(defaultStageId),
        inspectedQuantity: inspected,
        approvedQuantity: approved,
        rejectedQuantity: rejected,
        defectReason: defectReason || null,
        status: status || (rejected > 0 ? (approved > 0 ? 'REWORK_REQUIRED' : 'FAILED') : 'PASSED'),
        inspectorName: req.user ? req.user.name : 'QC Manager',
        notes: notes || null,
      },
      include: { stage: true },
    });

    return res.status(201).json({
      success: true,
      message: 'Quality check inspection recorded',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const recordDelivery = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const {
      deliveredQuantity,
      deliveryDate,
      recipientName,
      recipientContact,
      trackingNumber,
      status,
      notes,
    } = req.body;

    const qty = Number(deliveredQuantity || 0);
    if (qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid delivery quantity is required' });
    }

    const count = await prisma.delivery.count();
    const deliveryNumber = `GF-DEL-${String(count + 1).padStart(4, '0')}`;

    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber,
        orderId,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
        deliveredQuantity: qty,
        recipientName: recipientName || null,
        recipientContact: recipientContact || null,
        trackingNumber: trackingNumber || null,
        status: status || 'DELIVERED',
        notes: notes || null,
      },
    });

    // Check total delivered quantity vs order totalPieces
    const allDeliveries = await prisma.delivery.findMany({ where: { orderId } });
    const totalDelivered = allDeliveries.reduce((sum, d) => sum + d.deliveredQuantity, 0);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (totalDelivered >= order.totalPieces) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'DELIVERED' },
      });
    }

    return res.status(201).json({
      success: true,
      message: `Delivery recorded: ${qty} pieces dispatched`,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductionStages,
  getOrderProduction,
  updateStageProgress,
  recordQualityCheck,
  recordDelivery,
};
