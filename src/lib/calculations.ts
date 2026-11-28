import type {
  AttendanceRecord,
  ExpenseRecord,
  GarmentFlowState,
  MaterialItem,
  Order,
  PricingMethod,
  SalaryRecord,
  StockMovement,
  WorkerPaymentType,
} from "@/types/garmentflow";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeOrderFinancials(input: {
  quantity: number;
  pricingMethod: PricingMethod;
  perPieceRate: number;
  fixedOrderValue: number;
  materialCost: number;
  labourCost: number;
  otherCosts: number;
}) {
  const quantity = Math.max(0, Number(input.quantity) || 0);
  const perPieceRate = Math.max(0, Number(input.perPieceRate) || 0);
  const fixedOrderValue = Math.max(0, Number(input.fixedOrderValue) || 0);
  const materialCost = Math.max(0, Number(input.materialCost) || 0);
  const labourCost = Math.max(0, Number(input.labourCost) || 0);
  const otherCosts = Math.max(0, Number(input.otherCosts) || 0);

  const orderValue = round2(
    input.pricingMethod === "per-piece"
      ? quantity * perPieceRate
      : fixedOrderValue
  );
  const orderCost = round2(materialCost + labourCost + otherCosts);
  const expectedProfit = round2(orderValue - orderCost);

  return { orderValue, orderCost, expectedProfit };
}

export function computeSalaryAmount(input: {
  salaryType: WorkerPaymentType;
  baseRate: number;
  eligibleDays: number;
  completedPieces: number;
  extraWages: number;
  deductions: number;
}): number {
  const baseRate = Math.max(0, Number(input.baseRate) || 0);
  const eligibleDays = Math.max(0, Number(input.eligibleDays) || 0);
  const completedPieces = Math.max(0, Number(input.completedPieces) || 0);
  const extraWages = Math.max(0, Number(input.extraWages) || 0);
  const deductions = Math.max(0, Number(input.deductions) || 0);

  let base = 0;
  if (input.salaryType === "Monthly Salary") {
    base = baseRate;
  } else if (input.salaryType === "Daily Wage") {
    base = eligibleDays * baseRate;
  } else {
    base = completedPieces * baseRate;
  }
  return Math.round((base + extraWages - deductions) * 100) / 100;
}

export function getYearMonth(isoDate: string): { year: number; month: number } | null {
  if (!isoDate || isoDate.length < 7) return null;
  const [y, m] = isoDate.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m)) return null;
  return { year: y, month: m };
}

export function getActiveOrders(orders: Order[]): Order[] {
  return orders.filter((o) => !o.archived);
}

/**
 * Only Completed orders count as realized revenue (Rule 2.10 & 2.11).
 * For monthly/yearly attribution, completed orders use expectedCompletionDate if present, else orderDate.
 */
export function getOrderRealizedDate(order: Order): string {
  return order.expectedCompletionDate || order.orderDate;
}

export function computePeriodProfitLoss(
  state: GarmentFlowState,
  filter: { year: number; month?: number }
) {
  const matchesPeriod = (isoDate: string) => {
    const ym = getYearMonth(isoDate);
    if (!ym) return false;
    if (ym.year !== filter.year) return false;
    if (filter.month !== undefined && ym.month !== filter.month) return false;
    return true;
  };

  const activeOrders = getActiveOrders(state.orders);
  const completedOrders = activeOrders.filter(
    (o) => o.status === "Completed" && matchesPeriod(getOrderRealizedDate(o))
  );
  const pipelineOrders = activeOrders.filter(
    (o) =>
      (o.status === "Pending" || o.status === "In Progress") &&
      matchesPeriod(o.orderDate)
  );

  const realizedRevenue = completedOrders.reduce((s, o) => s + o.orderValue, 0);
  const materialCosts = completedOrders.reduce((s, o) => s + o.materialCost, 0);
  const labourCosts = completedOrders.reduce((s, o) => s + o.labourCost, 0);
  const otherOrderCosts = completedOrders.reduce((s, o) => s + o.otherCosts, 0);
  const totalOrderCosts = materialCosts + labourCosts + otherOrderCosts;

  const periodExpenses = state.expenses.filter((e) => matchesPeriod(e.date));
  const generalExpenses = periodExpenses.reduce((s, e) => s + e.amount, 0);

  // Business Profit/Loss = Completed Order Revenue - Completed Order Costs - Applicable General Expenses.
  // Material consumption & worker salary records are NOT added again here, preventing double-counting.
  const netProfitLoss = realizedRevenue - totalOrderCosts - generalExpenses;
  const profitMargin =
    realizedRevenue > 0 ? (netProfitLoss / realizedRevenue) * 100 : 0;

  // Audit reference sub-ledgers (informational only; never summed into netProfitLoss)
  const stockConsumptionUnits = state.stockMovements
    .filter(
      (m) =>
        (m.movementType === "Order Consumption" || m.movementType === "Wastage") &&
        matchesPeriod(m.date)
    )
    .reduce((s, m) => s + m.quantity, 0);

  const stockConsumptionAuditValue = state.stockMovements
    .filter(
      (m) =>
        (m.movementType === "Order Consumption" || m.movementType === "Wastage") &&
        matchesPeriod(m.date)
    )
    .reduce((sum, m) => {
      const mat = state.materials.find((item) => item.id === m.materialId);
      return sum + m.quantity * (mat?.unitCost ?? 0);
    }, 0);

  const recordedSalariesAudit = state.salaries
    .filter(
      (s) =>
        s.year === filter.year &&
        (filter.month === undefined || s.month === filter.month)
    )
    .reduce((sum, s) => sum + s.calculatedSalary, 0);

  return {
    completedOrders,
    pipelineOrders,
    pipelineValue: pipelineOrders.reduce((s, o) => s + o.orderValue, 0),
    realizedRevenue,
    materialCosts,
    labourCosts,
    otherOrderCosts,
    totalOrderCosts,
    generalExpenses,
    periodExpenses,
    netProfitLoss,
    profitMargin,
    stockConsumptionUnits,
    stockConsumptionAuditValue,
    recordedSalariesAudit,
  };
}

export function computeDashboardSummary(state: GarmentFlowState, todayISO: string) {
  const nowYM = getYearMonth(todayISO) ?? { year: 2026, month: 11 };
  const activeOrders = getActiveOrders(state.orders);

  const totalOrders = activeOrders.length;
  const completedOrders = activeOrders.filter((o) => o.status === "Completed").length;
  const pendingOrders = activeOrders.filter((o) => o.status === "Pending").length;
  const inProgressOrders = activeOrders.filter((o) => o.status === "In Progress").length;
  const cancelledOrders = activeOrders.filter((o) => o.status === "Cancelled").length;

  const monthlyPL = computePeriodProfitLoss(state, {
    year: nowYM.year,
    month: nowYM.month,
  });

  const lowStockMaterials = state.materials.filter(
    (m) => m.availableQuantity <= m.minimumStockLevel
  );

  const totalInventoryValue = state.materials.reduce(
    (sum, m) => sum + m.availableQuantity * m.unitCost,
    0
  );

  const activeWorkers = state.workers.filter((w) => w.status === "Active");
  const todayRecords = state.attendance.filter((a) => a.date === todayISO);

  const presentToday = todayRecords.filter((a) => a.status === "Present").length;
  const halfDayToday = todayRecords.filter((a) => a.status === "Half-Day").length;
  const absentToday = todayRecords.filter((a) => a.status === "Absent").length;
  const leaveToday = todayRecords.filter((a) => a.status === "Leave").length;

  // 6-month series ending at current month
  const monthlySeries: {
    key: string;
    label: string;
    year: number;
    month: number;
    revenue: number;
    orderCosts: number;
    generalExpenses: number;
    totalOutflow: number;
    profit: number;
    orderCount: number;
  }[] = [];

  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(nowYM.year, nowYM.month - 1 - offset, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const pl = computePeriodProfitLoss(state, { year: y, month: m });
    const count = activeOrders.filter((o) => {
      const ym = getYearMonth(o.orderDate);
      return ym?.year === y && ym?.month === m;
    }).length;
    monthlySeries.push({
      key: `${y}-${String(m).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      year: y,
      month: m,
      revenue: pl.realizedRevenue,
      orderCosts: pl.totalOrderCosts,
      generalExpenses: pl.generalExpenses,
      totalOutflow: pl.totalOrderCosts + pl.generalExpenses,
      profit: pl.netProfitLoss,
      orderCount: count,
    });
  }

  return {
    totalOrders,
    completedOrders,
    pendingOrders,
    inProgressOrders,
    cancelledOrders,
    monthlyRevenue: monthlyPL.realizedRevenue,
    monthlyExpenses: monthlyPL.totalOrderCosts + monthlyPL.generalExpenses,
    monthlyGeneralExpenses: monthlyPL.generalExpenses,
    monthlyOrderCosts: monthlyPL.totalOrderCosts,
    monthlyProfitLoss: monthlyPL.netProfitLoss,
    totalInventoryMaterials: state.materials.length,
    totalInventoryValue,
    lowStockCount: lowStockMaterials.length,
    lowStockMaterials,
    totalWorkers: activeWorkers.length,
    allWorkersCount: state.workers.length,
    presentToday,
    halfDayToday,
    absentToday,
    leaveToday,
    todayAttendanceRate:
      activeWorkers.length > 0
        ? Math.round(((presentToday + halfDayToday * 0.5) / activeWorkers.length) * 100)
        : 0,
    monthlySeries,
    recentOrders: [...activeOrders]
      .sort((a, b) => b.orderDate.localeCompare(a.orderDate))
      .slice(0, 6),
  };
}

export function getMaterialStockStats(
  material: MaterialItem,
  movements: StockMovement[]
) {
  const items = movements.filter((m) => m.materialId === material.id);
  const totalIn = items
    .filter((m) => m.delta > 0)
    .reduce((s, m) => s + m.delta, 0);
  const totalOut = items
    .filter((m) => m.delta < 0)
    .reduce((s, m) => s + Math.abs(m.delta), 0);
  const consumption = items
    .filter((m) => m.movementType === "Order Consumption")
    .reduce((s, m) => s + m.quantity, 0);
  const wastage = items
    .filter((m) => m.movementType === "Wastage")
    .reduce((s, m) => s + m.quantity, 0);
  return { totalIn, totalOut, consumption, wastage };
}

export function getWorkerEligibleDaysInMonth(
  workerId: string,
  month: number,
  year: number,
  attendance: AttendanceRecord[]
): number {
  return attendance
    .filter((a) => {
      if (a.workerId !== workerId) return false;
      const ym = getYearMonth(a.date);
      return ym?.year === year && ym?.month === month;
    })
    .reduce((days, rec) => {
      if (rec.status === "Present") return days + 1;
      if (rec.status === "Half-Day") return days + 0.5;
      return days;
    }, 0);
}

export function getMonthExpensesByCategory(
  expenses: ExpenseRecord[],
  year: number,
  month?: number
) {
  const filtered = expenses.filter((e) => {
    const ym = getYearMonth(e.date);
    if (!ym || ym.year !== year) return false;
    if (month !== undefined && ym.month !== month) return false;
    return true;
  });

  const map = new Map<string, number>();
  for (const e of filtered) {
    map.set(e.category, (map.get(e.category) ?? 0) + e.amount);
  }
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function getAllYearsInState(state: GarmentFlowState, fallbackYear: number): number[] {
  const years = new Set<number>([fallbackYear]);
  for (const o of state.orders) {
    const ym = getYearMonth(o.orderDate);
    if (ym) years.add(ym.year);
    const ym2 = getYearMonth(o.expectedCompletionDate);
    if (ym2) years.add(ym2.year);
  }
  for (const e of state.expenses) {
    const ym = getYearMonth(e.date);
    if (ym) years.add(ym.year);
  }
  for (const s of state.salaries) {
    years.add(s.year);
  }
  return Array.from(years).sort((a, b) => b - a);
}
