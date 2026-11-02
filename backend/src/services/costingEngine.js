const prisma = require('../config/database');

class CostingEngine {
  /**
   * Calculate full costing for a specific order
   */
  async calculateOrderCosting(orderId) {
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        company: true,
        items: true,
        materialConsumptions: {
          include: {
            material: true,
          },
        },
        labourAllocations: {
          include: {
            worker: true,
          },
        },
        expenses: {
          include: {
            category: true,
          },
        },
        overheadAllocations: {
          include: {
            expense: {
              include: {
                category: true,
              },
            },
          },
        },
        payments: true,
        invoices: true,
        productionUpdates: {
          include: {
            stage: true,
          },
        },
        deliveries: true,
      },
    });

    if (!order) {
      throw new Error(`Order with ID ${orderId} not found.`);
    }

    // 1. Revenue
    let revenue = 0;
    if (order.pricingMethod === 'FIXED_QUOTE') {
      revenue = Number(order.totalQuotedAmount || order.totalRevenue || 0);
    } else {
      // PER_PIECE pricing
      if (order.items && order.items.length > 0) {
        revenue = order.items.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
      } else {
        revenue = (order.totalPieces || 0) * Number(order.unitRate || 0);
      }
    }
    // Also fallback to totalRevenue field if recorded
    if (revenue === 0 && Number(order.totalRevenue) > 0) {
      revenue = Number(order.totalRevenue);
    }

    // 2. Material Costs
    let actualMaterialCost = 0;
    let shopMaterialConsumptions = [];
    let companyMaterialConsumptions = [];

    for (const mc of order.materialConsumptions) {
      const cost = Number(mc.totalCost);
      if (mc.source === 'SHOP') {
        actualMaterialCost += cost;
        shopMaterialConsumptions.push({
          id: mc.id,
          materialName: mc.material.name,
          unit: mc.material.unit,
          requiredQuantity: Number(mc.requiredQuantity),
          consumedQuantity: Number(mc.consumedQuantity),
          wastageQuantity: Number(mc.wastageQuantity),
          unitCostSnapshot: Number(mc.unitCostSnapshot),
          totalCost: cost,
          source: 'SHOP',
        });
      } else {
        companyMaterialConsumptions.push({
          id: mc.id,
          materialName: mc.material.name,
          unit: mc.material.unit,
          requiredQuantity: Number(mc.requiredQuantity),
          consumedQuantity: Number(mc.consumedQuantity),
          wastageQuantity: Number(mc.wastageQuantity),
          unitCostSnapshot: 0,
          totalCost: 0,
          source: 'COMPANY',
        });
      }
    }

    // 3. Labour Costs
    let actualLabourCost = 0;
    const labourDetails = [];

    for (const la of order.labourAllocations) {
      const cost = Number(la.allocatedCost);
      actualLabourCost += cost;
      labourDetails.push({
        id: la.id,
        workerId: la.workerId,
        workerName: la.worker.name,
        allocationMethod: la.allocationMethod,
        hoursWorked: Number(la.hoursWorked),
        hourlyRateSnapshot: Number(la.hourlyRateSnapshot),
        piecesProduced: la.piecesProduced,
        pieceRateSnapshot: Number(la.pieceRateSnapshot),
        allocatedCost: cost,
        notes: la.notes,
      });
    }

    // 4. Direct Order Expenses (utilities, transport, packaging, etc. explicitly linked to order)
    let directExpenseCost = 0;
    const directExpenses = [];

    for (const exp of order.expenses) {
      if (!exp.isArchived) {
        const amt = Number(exp.amount);
        directExpenseCost += amt;
        directExpenses.push({
          id: exp.id,
          expenseNumber: exp.expenseNumber,
          categoryName: exp.category.name,
          description: exp.description,
          amount: amt,
          paymentMethod: exp.paymentMethod,
          expenseDate: exp.expenseDate,
        });
      }
    }

    // 5. Allocated Overheads (general rent, electricity, maintenance distributed to this order)
    let allocatedOverheadCost = 0;
    const allocatedOverheads = [];

    for (const oa of order.overheadAllocations) {
      const amt = Number(oa.allocatedAmount);
      allocatedOverheadCost += amt;
      allocatedOverheads.push({
        id: oa.id,
        expenseId: oa.expenseId,
        expenseNumber: oa.expense.expenseNumber,
        categoryName: oa.expense.category.name,
        allocationMethod: oa.allocationMethod,
        allocatedAmount: amt,
        notes: oa.notes,
      });
    }

    // 6. Total Order Cost
    const totalOrderCost = Number((actualMaterialCost + actualLabourCost + directExpenseCost + allocatedOverheadCost).toFixed(2));

    // 7. Net Order Profit & Margin
    const netProfit = Number((revenue - totalOrderCost).toFixed(2));
    const profitMargin = revenue > 0 ? Number(((netProfit / revenue) * 100).toFixed(2)) : 0;

    // Completed pieces for cost-per-garment
    const completedStage = order.productionUpdates.find(u => u.stage?.stageName === 'Completed' || u.stage?.stageName === 'Delivered');
    const completedPieces = completedStage ? completedStage.completedQuantity : (order.totalPieces || 1);
    const costPerGarment = completedPieces > 0 ? Number((totalOrderCost / completedPieces).toFixed(2)) : 0;

    // 8. Payments & Balance
    const totalPaymentsReceived = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingPaymentBalance = Number((revenue - totalPaymentsReceived).toFixed(2));

    // 9. Delivery summary
    const deliveredPieces = order.deliveries.reduce((sum, d) => sum + d.deliveredQuantity, 0);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      company: {
        id: order.company.id,
        name: order.company.name,
        code: order.company.code,
      },
      title: order.title,
      status: order.status,
      pricingMethod: order.pricingMethod,
      totalPieces: order.totalPieces,
      completedPieces,
      deliveredPieces,
      financials: {
        revenue: Number(revenue.toFixed(2)),
        actualMaterialCost: Number(actualMaterialCost.toFixed(2)),
        actualLabourCost: Number(actualLabourCost.toFixed(2)),
        directExpenseCost: Number(directExpenseCost.toFixed(2)),
        allocatedOverheadCost: Number(allocatedOverheadCost.toFixed(2)),
        totalOrderCost,
        netProfit,
        profitMargin,
        costPerGarment,
        totalPaymentsReceived: Number(totalPaymentsReceived.toFixed(2)),
        pendingPaymentBalance: pendingPaymentBalance > 0 ? pendingPaymentBalance : 0,
      },
      breakdowns: {
        shopMaterials: shopMaterialConsumptions,
        companyMaterials: companyMaterialConsumptions,
        labour: labourDetails,
        directExpenses,
        allocatedOverheads,
        payments: order.payments.map(p => ({
          id: p.id,
          paymentNumber: p.paymentNumber,
          amount: Number(p.amount),
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          paymentType: p.paymentType,
          referenceNo: p.referenceNo,
        })),
        deliveries: order.deliveries.map(d => ({
          id: d.id,
          deliveryNumber: d.deliveryNumber,
          deliveryDate: d.deliveryDate,
          deliveredQuantity: d.deliveredQuantity,
          status: d.status,
        })),
      },
    };
  }

  /**
   * Helper to compute monthly productive hourly rate for a worker
   */
  async getWorkerHourlyRate(workerId) {
    const worker = await prisma.worker.findUnique({
      where: { id: Number(workerId) },
    });

    if (!worker) throw new Error(`Worker #${workerId} not found`);

    const monthlySalary = Number(worker.agreedSalary);
    let productiveHours = worker.productiveHoursPerMonth;

    if (!productiveHours || productiveHours <= 0) {
      const setting = await prisma.applicationSetting.findUnique({
        where: { settingKey: 'productive_monthly_hours' },
      });
      productiveHours = setting ? Number(setting.settingValue) || 200 : 200;
    }

    const hourlyRate = productiveHours > 0 ? monthlySalary / productiveHours : 0;
    return Number(hourlyRate.toFixed(2));
  }
}

module.exports = new CostingEngine();
