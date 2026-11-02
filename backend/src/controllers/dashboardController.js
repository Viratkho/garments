const prisma = require('../config/database');
const costingEngine = require('../services/costingEngine');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 1. Orders statistics
    const totalOrdersCount = await prisma.order.count({ where: { isArchived: false } });
    const pendingOrdersCount = await prisma.order.count({ where: { status: 'PENDING', isArchived: false } });
    const inProgressOrdersCount = await prisma.order.count({ where: { status: 'IN_PROGRESS', isArchived: false } });
    const completedOrdersCount = await prisma.order.count({ where: { status: 'COMPLETED', isArchived: false } });
    const deliveredOrdersCount = await prisma.order.count({ where: { status: 'DELIVERED', isArchived: false } });

    const activeOrdersCount = pendingOrdersCount + inProgressOrdersCount;
    const finishedOrdersCount = completedOrdersCount + deliveredOrdersCount;

    // 2. Financial totals from database
    const orders = await prisma.order.findMany({
      where: { isArchived: false, status: { not: 'CANCELLED' } },
      select: { id: true, totalRevenue: true },
    });
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalRevenue || 0), 0);

    const expenses = await prisma.expense.findMany({
      where: { isArchived: false },
      select: { amount: true },
    });
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const payments = await prisma.payment.findMany({
      select: { amount: true },
    });
    const totalPaymentsReceived = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const netProfit = Number((totalRevenue - totalExpenses).toFixed(2));
    const pendingPayments = Math.max(0, Number((totalRevenue - totalPaymentsReceived).toFixed(2)));

    // 3. Raw Material Stock Valuation & Low Stock
    const materials = await prisma.material.findMany({
      where: { isArchived: false },
      include: { category: true },
    });

    let materialStockValue = 0;
    const lowStockAlerts = [];

    for (const m of materials) {
      const stock = Number(m.currentStock);
      const avgCost = Number(m.weightedAvgCost);
      const minLevel = Number(m.minStockLevel);
      const val = stock * avgCost;
      materialStockValue += val;

      if (stock <= minLevel) {
        lowStockAlerts.push({
          id: m.id,
          name: m.name,
          category: m.category?.name || 'General',
          currentStock: stock,
          minStockLevel: minLevel,
          unit: m.unit,
        });
      }
    }

    // 4. Monthly salary expenses
    const monthlySalaryPayments = await prisma.salaryPayment.findMany({
      where: { paymentDate: { gte: startOfCurrentMonth } },
      select: { amount: true },
    });
    const monthlySalaryExpenses = monthlySalaryPayments.reduce((sum, sp) => sum + Number(sp.amount), 0);

    // 5. Recent Orders (Latest 5)
    const recentOrders = await prisma.order.findMany({
      where: { isArchived: false },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        company: { select: { id: true, name: true, code: true } },
      },
    });

    // 6. Upcoming Deliveries
    const upcomingDeliveries = await prisma.order.findMany({
      where: {
        isArchived: false,
        status: { in: ['PENDING', 'IN_PROGRESS', 'COMPLETED'] },
        deliveryDate: { not: null },
      },
      orderBy: { deliveryDate: 'asc' },
      take: 5,
      include: {
        company: { select: { id: true, name: true } },
      },
    });

    // 7. Recent Expenses (Latest 5)
    const recentExpenses = await prisma.expense.findMany({
      where: { isArchived: false },
      orderBy: { expenseDate: 'desc' },
      take: 5,
      include: { category: true },
    });

    // 8. Order Status Chart Data
    const orderStatusDistribution = [
      { name: 'Pending', count: pendingOrdersCount, color: '#F59E0B' },
      { name: 'In Progress', count: inProgressOrdersCount, color: '#2563EB' },
      { name: 'Completed', count: completedOrdersCount, color: '#16A34A' },
      { name: 'Delivered', count: deliveredOrdersCount, color: '#0F1B2F' },
    ];

    // 9. Monthly Revenue vs Expenses (Last 6 Months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthLabel = monthDate.toLocaleString('default', { month: 'short' });

      const monthOrders = await prisma.order.findMany({
        where: {
          orderDate: { gte: monthDate, lte: nextMonthDate },
          isArchived: false,
          status: { not: 'CANCELLED' },
        },
        select: { totalRevenue: true },
      });
      const rev = monthOrders.reduce((sum, o) => sum + Number(o.totalRevenue || 0), 0);

      const monthExps = await prisma.expense.findMany({
        where: {
          expenseDate: { gte: monthDate, lte: nextMonthDate },
          isArchived: false,
        },
        select: { amount: true },
      });
      const exp = monthExps.reduce((sum, e) => sum + Number(e.amount || 0), 0);

      monthlyTrends.push({
        month: monthLabel,
        revenue: Number(rev.toFixed(2)),
        expenses: Number(exp.toFixed(2)),
        profit: Number((rev - exp).toFixed(2)),
      });
    }

    // 10. Company-wise Revenue
    const companies = await prisma.company.findMany({
      where: { isArchived: false },
      include: {
        orders: {
          where: { isArchived: false, status: { not: 'CANCELLED' } },
          select: { totalRevenue: true },
        },
      },
    });

    const companyRevenue = companies
      .map(c => ({
        name: c.name,
        revenue: c.orders.reduce((sum, o) => sum + Number(o.totalRevenue || 0), 0),
      }))
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return res.json({
      success: true,
      data: {
        kpis: {
          totalOrders: totalOrdersCount,
          activeOrders: activeOrdersCount,
          completedOrders: finishedOrdersCount,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalExpenses: Number(totalExpenses.toFixed(2)),
          netProfit,
          pendingPayments,
          materialStockValue: Number(materialStockValue.toFixed(2)),
          monthlySalaryExpenses: Number(monthlySalaryExpenses.toFixed(2)),
        },
        charts: {
          monthlyTrends,
          orderStatusDistribution,
          companyRevenue,
        },
        recentOrders,
        upcomingDeliveries,
        recentExpenses,
        lowStockAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics,
};
