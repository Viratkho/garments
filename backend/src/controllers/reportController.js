const prisma = require('../config/database');
const costingEngine = require('../services/costingEngine');
const excelService = require('../services/excelService');
const pdfService = require('../services/pdfService');

const getProfitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate, year } = req.query;

    const targetYear = year ? Number(year) : new Date().getFullYear();
    const periodStart = startDate ? new Date(startDate) : new Date(targetYear, 0, 1);
    const periodEnd = endDate ? new Date(endDate) : new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // 1. Orders within period
    const orders = await prisma.order.findMany({
      where: {
        orderDate: { gte: periodStart, lte: periodEnd },
        isArchived: false,
        status: { not: 'CANCELLED' },
      },
    });

    const orderCostings = [];
    for (const order of orders) {
      const c = await costingEngine.calculateOrderCosting(order.id);
      orderCostings.push(c);
    }

    const totalRevenue = orderCostings.reduce((sum, c) => sum + c.financials.revenue, 0);
    const totalOrderCost = orderCostings.reduce((sum, c) => sum + c.financials.totalOrderCost, 0);
    const totalOrderMaterialCost = orderCostings.reduce((sum, c) => sum + c.financials.actualMaterialCost, 0);
    const totalAllocatedLabourCost = orderCostings.reduce((sum, c) => sum + c.financials.actualLabourCost, 0);

    // 2. Business Expenses recorded within period
    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: { gte: periodStart, lte: periodEnd },
        isArchived: false,
      },
      include: { category: true },
    });

    const totalBusinessExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Group expenses by category
    const expensesByCategory = {};
    for (const exp of expenses) {
      const catName = exp.category.name;
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + Number(exp.amount);
    }

    // 3. Worker Salaries paid in period (recorded once as business expense)
    const salaryPayments = await prisma.salaryPayment.findMany({
      where: {
        paymentDate: { gte: periodStart, lte: periodEnd },
      },
      include: { worker: true },
    });
    const totalSalaryExpenses = salaryPayments.reduce((sum, sp) => sum + Number(sp.amount), 0);

    // Unallocated Labour Cost = Total Salary Expense Paid/Due - Total Labour Value Allocated to Orders
    const unallocatedLabourCost = Math.max(0, Number((totalSalaryExpenses - totalAllocatedLabourCost).toFixed(2)));
    const labourRecoveryRate = totalSalaryExpenses > 0
      ? Number(((totalAllocatedLabourCost / totalSalaryExpenses) * 100).toFixed(2))
      : 0;

    // 4. Net Operating Profit = Total Revenue - Total Actual Business Expenses
    // (Notice: Salaries and Material Purchases are tracked as business expenses,
    // so taking Total Revenue - Total Business Expenses gives the true overall P&L
    // without double-counting allocated labour!)
    const netOperatingProfit = Number((totalRevenue - totalBusinessExpenses).toFixed(2));
    const netProfitMargin = totalRevenue > 0 ? Number(((netOperatingProfit / totalRevenue) * 100).toFixed(2)) : 0;

    // 5. Payments Received
    const payments = await prisma.payment.findMany({
      where: {
        paymentDate: { gte: periodStart, lte: periodEnd },
      },
    });
    const totalCashCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return res.json({
      success: true,
      data: {
        period: {
          startDate: periodStart.toISOString(),
          endDate: periodEnd.toISOString(),
        },
        summary: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalBusinessExpenses: Number(totalBusinessExpenses.toFixed(2)),
          netOperatingProfit,
          netProfitMargin,
          totalCashCollected: Number(totalCashCollected.toFixed(2)),
          orderBasedProfit: Number((totalRevenue - totalOrderCost).toFixed(2)),
          totalSalaryExpenses: Number(totalSalaryExpenses.toFixed(2)),
          totalAllocatedLabourCost: Number(totalAllocatedLabourCost.toFixed(2)),
          unallocatedLabourCost,
          labourRecoveryRate,
          totalOrderMaterialCost: Number(totalOrderMaterialCost.toFixed(2)),
        },
        expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
          category,
          amount: Number(amount.toFixed(2)),
        })),
        orderCostings,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getOrderCostingsReport = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: 'desc' },
    });

    const costings = [];
    for (const order of orders) {
      const c = await costingEngine.calculateOrderCosting(order.id);
      costings.push(c);
    }

    return res.json({ success: true, data: costings });
  } catch (error) {
    next(error);
  }
};

const exportOrdersExcel = async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: 'desc' },
    });

    const costings = [];
    for (const order of orders) {
      const c = await costingEngine.calculateOrderCosting(order.id);
      costings.push(c);
    }

    await excelService.exportOrderCostingReport(costings, res);
  } catch (error) {
    next(error);
  }
};

const exportInventoryExcel = async (req, res, next) => {
  try {
    const materials = await prisma.material.findMany({
      where: { isArchived: false },
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    await excelService.exportInventoryReport(materials, res);
  } catch (error) {
    next(error);
  }
};

const exportProfitLossPdf = async (req, res, next) => {
  try {
    const { startDate, endDate, year } = req.query;

    const targetYear = year ? Number(year) : new Date().getFullYear();
    const periodStart = startDate ? new Date(startDate) : new Date(targetYear, 0, 1);
    const periodEnd = endDate ? new Date(endDate) : new Date(targetYear, 11, 31, 23, 59, 59, 999);

    const orders = await prisma.order.findMany({
      where: {
        orderDate: { gte: periodStart, lte: periodEnd },
        isArchived: false,
        status: { not: 'CANCELLED' },
      },
    });

    const orderCostings = [];
    for (const order of orders) {
      const c = await costingEngine.calculateOrderCosting(order.id);
      orderCostings.push(c);
    }

    const totalRevenue = orderCostings.reduce((sum, c) => sum + c.financials.revenue, 0);
    const totalOrderCost = orderCostings.reduce((sum, c) => sum + c.financials.totalOrderCost, 0);
    const totalOrderMaterialCost = orderCostings.reduce((sum, c) => sum + c.financials.actualMaterialCost, 0);
    const totalAllocatedLabourCost = orderCostings.reduce((sum, c) => sum + c.financials.actualLabourCost, 0);

    const expenses = await prisma.expense.findMany({
      where: {
        expenseDate: { gte: periodStart, lte: periodEnd },
        isArchived: false,
      },
      include: { category: true },
    });

    const totalBusinessExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    const expensesByCategory = {};
    for (const exp of expenses) {
      const catName = exp.category.name;
      expensesByCategory[catName] = (expensesByCategory[catName] || 0) + Number(exp.amount);
    }

    const salaryPayments = await prisma.salaryPayment.findMany({
      where: {
        paymentDate: { gte: periodStart, lte: periodEnd },
      },
    });
    const totalSalaryExpenses = salaryPayments.reduce((sum, sp) => sum + Number(sp.amount), 0);

    const unallocatedLabourCost = Math.max(0, Number((totalSalaryExpenses - totalAllocatedLabourCost).toFixed(2)));
    const labourRecoveryRate = totalSalaryExpenses > 0
      ? Number(((totalAllocatedLabourCost / totalSalaryExpenses) * 100).toFixed(2))
      : 0;

    const netOperatingProfit = Number((totalRevenue - totalBusinessExpenses).toFixed(2));
    const netProfitMargin = totalRevenue > 0 ? Number(((netOperatingProfit / totalRevenue) * 100).toFixed(2)) : 0;

    const pnlData = {
      period: {
        startDate: periodStart.toISOString(),
        endDate: periodEnd.toISOString(),
      },
      summary: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalBusinessExpenses: Number(totalBusinessExpenses.toFixed(2)),
        netOperatingProfit,
        netProfitMargin,
        totalSalaryExpenses: Number(totalSalaryExpenses.toFixed(2)),
        totalAllocatedLabourCost: Number(totalAllocatedLabourCost.toFixed(2)),
        unallocatedLabourCost,
        labourRecoveryRate,
        totalOrderMaterialCost: Number(totalOrderMaterialCost.toFixed(2)),
      },
      expensesByCategory: Object.entries(expensesByCategory).map(([category, amount]) => ({
        category,
        amount: Number(amount.toFixed(2)),
      })),
    };

    await pdfService.generateProfitLossPdf(pnlData, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfitLoss,
  getOrderCostingsReport,
  exportOrdersExcel,
  exportInventoryExcel,
  exportProfitLossPdf,
};
