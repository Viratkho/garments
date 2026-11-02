const prisma = require('../config/database');
const costingEngine = require('../services/costingEngine');
const inventoryService = require('../services/inventoryService');

const getOrderCosting = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const costing = await costingEngine.calculateOrderCosting(orderId);
    return res.json({ success: true, data: costing });
  } catch (error) {
    next(error);
  }
};

const recordMaterialConsumption = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const {
      materialId,
      source, // SHOP, COMPANY
      requiredQuantity,
      consumedQuantity,
      wastageQuantity,
      notes,
    } = req.body;

    if (!materialId) {
      return res.status(400).json({ success: false, message: 'Material is required' });
    }
    if (!consumedQuantity || Number(consumedQuantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid consumed quantity is required' });
    }

    const consumption = await prisma.$transaction(async (tx) => {
      return await inventoryService.consumeMaterial(tx, {
        orderId,
        materialId: Number(materialId),
        source: source || 'SHOP',
        requiredQuantity: Number(requiredQuantity || consumedQuantity),
        consumedQuantity: Number(consumedQuantity),
        wastageQuantity: Number(wastageQuantity || 0),
        notes,
      });
    });

    const updatedCosting = await costingEngine.calculateOrderCosting(orderId);

    return res.status(201).json({
      success: true,
      message: 'Material consumption recorded and stock updated',
      data: {
        consumption,
        costing: updatedCosting,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteMaterialConsumption = async (req, res, next) => {
  try {
    const consumptionId = Number(req.params.id);

    const consumption = await prisma.materialConsumption.findUnique({
      where: { id: consumptionId },
      include: { material: true },
    });

    if (!consumption) {
      return res.status(404).json({ success: false, message: 'Consumption record not found' });
    }

    await prisma.$transaction(async (tx) => {
      // If shop material, restore the stock
      if (consumption.source === 'SHOP') {
        const returnQty = Number(consumption.consumedQuantity) + Number(consumption.wastageQuantity);
        const material = await tx.material.findUnique({ where: { id: consumption.materialId } });
        await tx.material.update({
          where: { id: consumption.materialId },
          data: {
            currentStock: Number(material.currentStock) + returnQty,
          },
        });

        await tx.inventoryTransaction.create({
          data: {
            materialId: consumption.materialId,
            transactionType: 'RETURN',
            quantity: returnQty,
            unitCost: Number(consumption.unitCostSnapshot),
            referenceType: 'ORDER',
            referenceId: String(consumption.orderId),
            notes: `Consumption reversed for Order #${consumption.orderId}`,
          },
        });
      }

      await tx.materialConsumption.delete({ where: { id: consumptionId } });
    });

    return res.json({ success: true, message: 'Consumption reversed and inventory restored' });
  } catch (error) {
    next(error);
  }
};

const recordLabourAllocation = async (req, res, next) => {
  try {
    const orderId = Number(req.params.orderId);
    const {
      workerId,
      allocationMethod, // HOUR_BASED, PRODUCTION_BASED, MANUAL
      hoursWorked,
      piecesProduced,
      manualCost,
      notes,
    } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Worker is required' });
    }

    const worker = await prisma.worker.findUnique({ where: { id: Number(workerId) } });
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const method = allocationMethod || 'HOUR_BASED';
    let allocatedCost = 0;
    let hourlyRateSnapshot = 0;
    let pieceRateSnapshot = 0;
    const hours = Number(hoursWorked || 0);
    const pieces = Number(piecesProduced || 0);

    if (method === 'HOUR_BASED') {
      hourlyRateSnapshot = await costingEngine.getWorkerHourlyRate(worker.id);
      allocatedCost = Number((hours * hourlyRateSnapshot).toFixed(2));
    } else if (method === 'PRODUCTION_BASED') {
      pieceRateSnapshot = Number(worker.agreedSalary) > 0 ? Number(worker.agreedSalary) : 10;
      allocatedCost = Number((pieces * pieceRateSnapshot).toFixed(2));
    } else {
      // MANUAL
      allocatedCost = Number(manualCost || 0);
    }

    const allocation = await prisma.labourAllocation.create({
      data: {
        orderId,
        workerId: worker.id,
        allocationMethod: method,
        hoursWorked: hours,
        hourlyRateSnapshot,
        piecesProduced: pieces,
        pieceRateSnapshot,
        allocatedCost,
        notes: notes || null,
      },
      include: { worker: true },
    });

    const updatedCosting = await costingEngine.calculateOrderCosting(orderId);

    return res.status(201).json({
      success: true,
      message: 'Labour allocated to order successfully',
      data: {
        allocation,
        costing: updatedCosting,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteLabourAllocation = async (req, res, next) => {
  try {
    await prisma.labourAllocation.delete({
      where: { id: Number(req.params.id) },
    });
    return res.json({ success: true, message: 'Labour allocation deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrderCosting,
  recordMaterialConsumption,
  deleteMaterialConsumption,
  recordLabourAllocation,
  deleteLabourAllocation,
};
