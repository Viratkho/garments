import test from "node:test";
import assert from "node:assert/strict";
import {
  computeDashboardSummary,
  computeOrderFinancials,
  computePeriodProfitLoss,
  computeSalaryAmount,
  getMaterialStockStats,
  getMonthExpensesByCategory,
  getWorkerEligibleDaysInMonth,
} from "../src/lib/calculations";
import { calculateWorkingHours, formatCurrency } from "../src/lib/format";
import { createSampleState } from "../src/lib/seedData";
import type { GarmentFlowState } from "../src/types/garmentflow";

function makeEmptyState(): GarmentFlowState {
  const base = createSampleState(new Date("2026-11-28"));
  return {
    ...base,
    orders: [],
    materials: [],
    stockMovements: [],
    workers: [],
    attendance: [],
    salaries: [],
    expenses: [],
    hasSampleData: false,
  };
}

test("1. Order pricing: per-piece, fixed, cost summation, profit/loss & decimal rounding", () => {
  const perPiece = computeOrderFinancials({
    quantity: 500,
    pricingMethod: "per-piece",
    perPieceRate: 70,
    fixedOrderValue: 99999,
    materialCost: 12000,
    labourCost: 8500,
    otherCosts: 1500,
  });
  assert.equal(perPiece.orderValue, 35000);
  assert.equal(perPiece.orderCost, 22000);
  assert.equal(perPiece.expectedProfit, 13000);

  const fixedLoss = computeOrderFinancials({
    quantity: 200,
    pricingMethod: "fixed",
    perPieceRate: 50,
    fixedOrderValue: 18000,
    materialCost: 11000,
    labourCost: 7500,
    otherCosts: 1500,
  });
  assert.equal(fixedLoss.orderValue, 18000);
  assert.equal(fixedLoss.orderCost, 20000);
  assert.equal(fixedLoss.expectedProfit, -2000);

  const decimals = computeOrderFinancials({
    quantity: 3,
    pricingMethod: "per-piece",
    perPieceRate: 19.99,
    fixedOrderValue: 0,
    materialCost: 10.11,
    labourCost: 5.22,
    otherCosts: 1.33,
  });
  assert.equal(decimals.orderValue, 59.97);
  assert.equal(decimals.orderCost, 16.66);
  assert.equal(decimals.expectedProfit, 43.31);
});

test("2. Profit & Loss: counts ONLY Completed orders, excludes Pending/In Progress/Cancelled/Archived", () => {
  const st = makeEmptyState();
  st.orders = [
    {
      id: "GF-1",
      companyName: "Completed Co",
      contactNumber: "1",
      garmentType: "Collar Stitching",
      description: "",
      quantity: 500,
      pricingMethod: "per-piece",
      perPieceRate: 100,
      fixedOrderValue: 0,
      orderValue: 50000,
      materialCost: 15000,
      labourCost: 10000,
      otherCosts: 2000,
      orderCost: 27000,
      expectedProfit: 23000,
      orderDate: "2026-11-02",
      expectedCompletionDate: "2026-11-15",
      status: "Completed",
      notes: "",
    },
    {
      id: "GF-2",
      companyName: "InProgress Co",
      contactNumber: "2",
      garmentType: "Bulk",
      description: "",
      quantity: 1000,
      pricingMethod: "per-piece",
      perPieceRate: 200,
      fixedOrderValue: 0,
      orderValue: 200000,
      materialCost: 80000,
      labourCost: 40000,
      otherCosts: 5000,
      orderCost: 125000,
      expectedProfit: 75000,
      orderDate: "2026-11-10",
      expectedCompletionDate: "2026-11-28",
      status: "In Progress",
      notes: "",
    },
    {
      id: "GF-3",
      companyName: "Pending Co",
      contactNumber: "3",
      garmentType: "Pocket",
      description: "",
      quantity: 300,
      pricingMethod: "fixed",
      perPieceRate: 0,
      fixedOrderValue: 45000,
      orderValue: 45000,
      materialCost: 10000,
      labourCost: 8000,
      otherCosts: 1000,
      orderCost: 19000,
      expectedProfit: 26000,
      orderDate: "2026-11-11",
      expectedCompletionDate: "2026-11-25",
      status: "Pending",
      notes: "",
    },
    {
      id: "GF-4",
      companyName: "Cancelled Co",
      contactNumber: "4",
      garmentType: "Bulk",
      description: "",
      quantity: 100,
      pricingMethod: "fixed",
      perPieceRate: 0,
      fixedOrderValue: 25000,
      orderValue: 25000,
      materialCost: 0,
      labourCost: 0,
      otherCosts: 0,
      orderCost: 0,
      expectedProfit: 25000,
      orderDate: "2026-11-12",
      expectedCompletionDate: "2026-11-20",
      status: "Cancelled",
      notes: "",
    },
    {
      id: "GF-5",
      companyName: "Archived Completed Co",
      contactNumber: "5",
      garmentType: "Bulk",
      description: "",
      quantity: 100,
      pricingMethod: "fixed",
      perPieceRate: 0,
      fixedOrderValue: 90000,
      orderValue: 90000,
      materialCost: 10000,
      labourCost: 5000,
      otherCosts: 0,
      orderCost: 15000,
      expectedProfit: 75000,
      orderDate: "2026-11-05",
      expectedCompletionDate: "2026-11-18",
      status: "Completed",
      notes: "",
      archived: true,
    },
  ];
  st.expenses = [
    { id: "E-1", name: "Rent", category: "Rent", amount: 12000, date: "2026-11-01", description: "", notes: "" },
    { id: "E-2", name: "Power", category: "Electricity", amount: 3000, date: "2026-11-09", description: "", notes: "" },
  ];

  const pl = computePeriodProfitLoss(st, { year: 2026, month: 11 });
  assert.equal(pl.realizedRevenue, 50000);
  assert.equal(pl.materialCosts, 15000);
  assert.equal(pl.labourCosts, 10000);
  assert.equal(pl.otherOrderCosts, 2000);
  assert.equal(pl.totalOrderCosts, 27000);
  assert.equal(pl.generalExpenses, 15000);
  // Net Profit = 50000 - 27000 - 15000 = 8000
  assert.equal(pl.netProfitLoss, 8000);
  assert.equal(pl.profitMargin, 16);
  // Pipeline = GF-2 (200000) + GF-3 (45000) = 245000
  assert.equal(pl.pipelineOrders.length, 2);
  assert.equal(pl.pipelineValue, 245000);
});

test("3. Net Loss scenario & zero-revenue division guard", () => {
  const st = makeEmptyState();
  st.expenses = [
    { id: "E-1", name: "Factory Rent", category: "Rent", amount: 32000, date: "2026-10-01", description: "", notes: "" },
    { id: "E-2", name: "Machine Repair", category: "Machine Maintenance", amount: 4500, date: "2026-10-14", description: "", notes: "" },
  ];

  const lossNoRev = computePeriodProfitLoss(st, { year: 2026, month: 10 });
  assert.equal(lossNoRev.realizedRevenue, 0);
  assert.equal(lossNoRev.generalExpenses, 36500);
  assert.equal(lossNoRev.netProfitLoss, -36500);
  assert.equal(lossNoRev.profitMargin, 0);

  // Add a completed order with revenue smaller than costs + overheads
  st.orders.push({
    id: "GF-10",
    companyName: "Small Batch",
    contactNumber: "1",
    garmentType: "Collar",
    description: "",
    quantity: 100,
    pricingMethod: "fixed",
    perPieceRate: 0,
    fixedOrderValue: 40000,
    orderValue: 40000,
    materialCost: 10000,
    labourCost: 5000,
    otherCosts: 1000,
    orderCost: 16000,
    expectedProfit: 24000,
    orderDate: "2026-10-05",
    expectedCompletionDate: "2026-10-20",
    status: "Completed",
    notes: "",
  });

  const lossWithRev = computePeriodProfitLoss(st, { year: 2026, month: 10 });
  // 40000 - 16000 - 36500 = -12500
  assert.equal(lossWithRev.netProfitLoss, -12500);
  assert.equal(Math.round(lossWithRev.profitMargin * 100) / 100, -31.25);
});

test("4. Double-counting safeguard: stock consumption & worker salaries do NOT reduce Business P&L twice", () => {
  const st = makeEmptyState();
  st.orders = [
    {
      id: "GF-1",
      companyName: "Client A",
      contactNumber: "1",
      garmentType: "Combined",
      description: "",
      quantity: 500,
      pricingMethod: "per-piece",
      perPieceRate: 200,
      fixedOrderValue: 0,
      orderValue: 100000,
      materialCost: 40000,
      labourCost: 20000,
      otherCosts: 5000,
      orderCost: 65000,
      expectedProfit: 35000,
      orderDate: "2026-11-01",
      expectedCompletionDate: "2026-11-20",
      status: "Completed",
      notes: "",
    },
  ];
  st.expenses = [
    { id: "E-1", name: "Power", category: "Electricity", amount: 10000, date: "2026-11-05", description: "", notes: "" },
  ];

  const baseline = computePeriodProfitLoss(st, { year: 2026, month: 11 });
  assert.equal(baseline.netProfitLoss, 25000);

  // Record stock consumption, wastage, and worker salaries in operational/payroll ledgers
  st.materials = [
    {
      id: "MAT-1",
      name: "Cotton",
      category: "Cotton Fabric",
      description: "",
      unit: "meters",
      availableQuantity: 800,
      minimumStockLevel: 200,
      unitCost: 150,
    },
  ];
  st.stockMovements = [
    {
      id: "STK-1",
      materialId: "MAT-1",
      materialName: "Cotton",
      movementType: "Order Consumption",
      delta: -250,
      quantity: 250,
      date: "2026-11-08",
      reason: "Cutting",
      relatedOrderId: "GF-1",
      notes: "",
    },
    {
      id: "STK-2",
      materialId: "MAT-1",
      materialName: "Cotton",
      movementType: "Wastage",
      delta: -15,
      quantity: 15,
      date: "2026-11-09",
      reason: "Scrap",
      relatedOrderId: "GF-1",
      notes: "",
    },
  ];
  st.salaries = [
    {
      id: "SAL-1",
      workerId: "WRK-1",
      workerName: "Rajesh",
      salaryType: "Monthly Salary",
      month: 11,
      year: 2026,
      baseRate: 20000,
      eligibleDays: 26,
      completedPieces: 0,
      extraWages: 0,
      deductions: 0,
      calculatedSalary: 20000,
      status: "Recorded",
      notes: "",
    },
  ];

  const afterOperationalLogs = computePeriodProfitLoss(st, { year: 2026, month: 11 });
  assert.equal(afterOperationalLogs.netProfitLoss, 25000);
  assert.equal(afterOperationalLogs.stockConsumptionUnits, 265);
  assert.equal(afterOperationalLogs.stockConsumptionAuditValue, 265 * 150);
  assert.equal(afterOperationalLogs.recordedSalariesAudit, 20000);
});

test("5. Sample dataset cross-module consistency: Dashboard === Monthly Earnings === Yearly sum of 12 months", () => {
  const refDate = new Date("2026-11-28");
  const st = createSampleState(refDate);
  const dash = computeDashboardSummary(st, "2026-11-28");
  const novPL = computePeriodProfitLoss(st, { year: 2026, month: 11 });

  // Dashboard metrics match November P&L
  assert.equal(dash.monthlyRevenue, novPL.realizedRevenue);
  assert.equal(dash.monthlyOrderCosts, novPL.totalOrderCosts);
  assert.equal(dash.monthlyGeneralExpenses, novPL.generalExpenses);
  assert.equal(dash.monthlyExpenses, novPL.totalOrderCosts + novPL.generalExpenses);
  assert.equal(dash.monthlyProfitLoss, novPL.netProfitLoss);
  assert.equal(dash.monthlyProfitLoss, dash.monthlyRevenue - dash.monthlyExpenses);

  // Yearly totals equal exact sum of Jan..Dec monthly totals
  const yearly = computePeriodProfitLoss(st, { year: 2026 });
  let sumRev = 0;
  let sumOrderCost = 0;
  let sumGenExp = 0;
  let sumProfit = 0;
  for (let m = 1; m <= 12; m++) {
    const mpl = computePeriodProfitLoss(st, { year: 2026, month: m });
    sumRev += mpl.realizedRevenue;
    sumOrderCost += mpl.totalOrderCosts;
    sumGenExp += mpl.generalExpenses;
    sumProfit += mpl.netProfitLoss;
  }
  assert.equal(yearly.realizedRevenue, sumRev);
  assert.equal(yearly.totalOrderCosts, sumOrderCost);
  assert.equal(yearly.generalExpenses, sumGenExp);
  assert.equal(yearly.netProfitLoss, sumProfit);

  // Expense category breakdown sums exactly to generalExpenses
  const catSum = getMonthExpensesByCategory(st.expenses, 2026, 11).reduce(
    (s, c) => s + c.amount,
    0
  );
  assert.equal(catSum, novPL.generalExpenses);
});

test("6. Salary formulas, Attendance working hours, Stock stats & Currency formatting", () => {
  // Monthly: rate + extra - deductions
  assert.equal(
    computeSalaryAmount({
      salaryType: "Monthly Salary",
      baseRate: 24500,
      eligibleDays: 20,
      completedPieces: 0,
      extraWages: 1500,
      deductions: 500,
    }),
    25500
  );

  // Daily: days * rate + extra - deductions
  assert.equal(
    computeSalaryAmount({
      salaryType: "Daily Wage",
      baseRate: 680,
      eligibleDays: 24.5,
      completedPieces: 0,
      extraWages: 600,
      deductions: 200,
    }),
    17060
  );

  // Per-Piece: pieces * rate + extra - deductions
  assert.equal(
    computeSalaryAmount({
      salaryType: "Per-Piece Wage",
      baseRate: 24,
      eligibleDays: 0,
      completedPieces: 920,
      extraWages: 800,
      deductions: 0,
    }),
    22880
  );

  // Working hours calculation
  assert.equal(calculateWorkingHours("09:00", "18:15"), 9.25);
  assert.equal(calculateWorkingHours("18:00", "09:00"), 0);

  // Eligible days from attendance (Present=1, Half-Day=0.5)
  const st = createSampleState(new Date("2026-11-28"));
  const daysW02 = getWorkerEligibleDaysInMonth("WRK-02", 11, 2026, st.attendance);
  assert.equal(daysW02, 3);
  const daysW05 = getWorkerEligibleDaysInMonth("WRK-05", 11, 2026, st.attendance);
  assert.equal(daysW05, 2.5);

  // Stock stats for MAT-01
  const mat01 = st.materials.find((m) => m.id === "MAT-01")!;
  const stats = getMaterialStockStats(mat01, st.stockMovements);
  assert.equal(stats.totalIn, 1800);
  assert.equal(stats.totalOut, 380);
  assert.equal(stats.consumption, 360);
  assert.equal(stats.wastage, 20);

  // Currency formatting preserves fractional paise when non-zero
  assert.equal(formatCurrency(3.5, "INR"), "₹3.5");
  assert.equal(formatCurrency(35000, "INR"), "₹35,000");
});
