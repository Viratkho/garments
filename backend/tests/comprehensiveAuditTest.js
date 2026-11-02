const prisma = require('../src/config/database');
const inventoryService = require('../src/services/inventoryService');
const costingEngine = require('../src/services/costingEngine');

const BASE_URL = 'http://localhost:5000/api';

async function runComprehensiveAudit() {
  console.log('================================================================================');
  console.log('   GARMENTFLOW – COMPLETE SYSTEM AUDIT & VERIFICATION SUITE');
  console.log('   Testing: Section 6 (Inventory), Section 8 (Payroll), Section 9 (Financials)');
  console.log('   & Complete 17-Module REST API Operations');
  console.log('================================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: AUTHENTICATION & TOKEN ACQUISITION
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: API Authentication & Health Check ---');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.database.includes('MySQL'), 'Health check reports MySQL connected');

    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@garmentflow.com', password: 'admin123' }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200 && loginData.data?.token, 'Login successful and JWT returned');
    const token = loginData.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    // -------------------------------------------------------------------------
    // TEST 2: SECTION 6 MANDATORY INVENTORY TEST
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: Section 6 Mandatory Material & Weighted Cost Audit ---');
    const uniqueSuffix = Date.now().toString().slice(-4);

    // 2.1 Find or create category
    let fabricCat = await prisma.materialCategory.findFirst({ where: { name: 'Fabrics' } });
    if (!fabricCat) {
      fabricCat = await prisma.materialCategory.create({
        data: { name: 'Fabrics', description: 'Fabrics and textiles' },
      });
    }

    // 2.2 Create supplier
    const supplierRes = await fetch(`${BASE_URL}/suppliers`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Audit Mill ${uniqueSuffix}`,
        contactPerson: 'Audit Specialist',
        phone: '9876543210',
        email: `supplier${uniqueSuffix}@example.com`,
      }),
    });
    const supplierData = await supplierRes.json();
    assert(supplierRes.status === 201, 'Supplier created via API');
    const supplierId = supplierData.data.id;

    // 2.3 Create Cotton Fabric material with 0 opening stock
    const materialRes = await fetch(`${BASE_URL}/materials`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: `Pure Cotton 60s - ${uniqueSuffix}`,
        categoryId: fabricCat.id,
        unit: 'Meters',
        description: 'Audit test cotton fabric for weighted average verification',
        openingStock: 0,
        minStockLevel: 50,
      }),
    });
    const materialData = await materialRes.json();
    assert(materialRes.status === 201 && Number(materialData.data.currentStock) === 0, 'Cotton Fabric material created with 0 opening stock');
    const cottonId = materialData.data.id;

    // 2.4 Purchase 1: 100 meters @ Rs. 80/meter = Rs. 8,000
    const pur1Res = await fetch(`${BASE_URL}/purchases`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        supplierId,
        purchaseDate: new Date().toISOString(),
        invoiceRef: `INV-PUR1-${uniqueSuffix}`,
        totalAmount: 8000,
        paidAmount: 8000,
        items: [
          {
            materialId: cottonId,
            quantity: 100,
            unit: 'Meters',
            unitCost: 80,
            totalCost: 8000,
          },
        ],
      }),
    });
    const pur1Data = await pur1Res.json();
    assert(pur1Res.status === 201, `Purchase 1 (100m @ Rs 80) recorded successfully (${pur1Data.message || pur1Res.status})`);

    let cottonMat = await prisma.material.findUnique({ where: { id: cottonId } });
    assert(Number(cottonMat.currentStock) === 100, `Stock after Purchase 1 is exactly 100 meters (found: ${cottonMat.currentStock})`);
    assert(Number(cottonMat.weightedAvgCost) === 80.00, `Weighted average cost after Purchase 1 is exactly Rs 80.00 (found: ${cottonMat.weightedAvgCost})`);

    // 2.5 Purchase 2: 100 meters @ Rs. 90/meter = Rs. 9,000
    const pur2Res = await fetch(`${BASE_URL}/purchases`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        supplierId,
        purchaseDate: new Date().toISOString(),
        invoiceRef: `INV-PUR2-${uniqueSuffix}`,
        totalAmount: 9000,
        paidAmount: 9000,
        items: [
          {
            materialId: cottonId,
            quantity: 100,
            unit: 'Meters',
            unitCost: 90,
            totalCost: 9000,
          },
        ],
      }),
    });
    const pur2Data = await pur2Res.json();
    assert(pur2Res.status === 201, `Purchase 2 (100m @ Rs 90) recorded successfully (${pur2Data.message || pur2Res.status})`);

    cottonMat = await prisma.material.findUnique({ where: { id: cottonId } });
    assert(Number(cottonMat.currentStock) === 200, `Stock after Purchase 2 is exactly 200 meters (found: ${cottonMat.currentStock})`);
    assert(Number(cottonMat.weightedAvgCost) === 85.00, `Weighted average cost after Purchase 2 is exactly Rs 85.00 (found: ${cottonMat.weightedAvgCost})`);

    // 2.6 Create Order to consume cotton fabric
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: { name: 'Audit Global Garments', code: 'AGG-001' },
      });
    }

    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        companyId: company.id,
        title: `Audit Order - ${uniqueSuffix}`,
        pricingMethod: 'PER_PIECE',
        totalPieces: 500,
        unitRate: 70.00,
      }),
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 201, 'Manufacturing order created via API');
    const orderId = orderData.data.id;

    // 2.7 Record Material Consumption: 80 meters for Order
    const consumeRes = await fetch(`${BASE_URL}/costing/${orderId}/consume-material`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        materialId: cottonId,
        source: 'SHOP',
        requiredQuantity: 80,
        consumedQuantity: 80,
        wastageQuantity: 0,
        notes: 'Section 6 consumption verification',
      }),
    });
    const consumeData = await consumeRes.json();
    assert(consumeRes.status === 201, 'Consumption of 80 meters recorded successfully');

    cottonMat = await prisma.material.findUnique({ where: { id: cottonId } });
    assert(Number(cottonMat.currentStock) === 120, `Remaining stock is exactly 120 meters (200 - 80) (found: ${cottonMat.currentStock})`);
    assert(Number(consumeData.data.consumption.unitCostSnapshot) === 85.00, `Consumption unit cost snapshot is exactly Rs 85.00 (found: ${consumeData.data.consumption.unitCostSnapshot})`);
    assert(Number(consumeData.data.consumption.totalCost) === 6800.00, `Consumption total cost is exactly Rs 6,800.00 (80m * Rs 85) (found: ${consumeData.data.consumption.totalCost})`);

    const remainingValuation = Number((Number(cottonMat.currentStock) * Number(cottonMat.weightedAvgCost)).toFixed(2));
    assert(remainingValuation === 10200.00, `Remaining inventory valuation is exactly Rs 10,200.00 (120m * Rs 85) (found: ${remainingValuation})`);

    // -------------------------------------------------------------------------
    // TEST 3: SECTION 8 WORKER & SALARY AUDIT
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: Section 8 Worker & Salary Management Audit ---');
    // Ensure 3 workers exist with salaries: 12000, 11000, 10000
    const w1 = await prisma.worker.upsert({
      where: { id: 1 },
      update: { agreedSalary: 12000.00, productiveHoursPerMonth: 200, status: 'ACTIVE' },
      create: { name: 'Ramesh Kumar', agreedSalary: 12000.00, productiveHoursPerMonth: 200, status: 'ACTIVE' },
    });
    const w2 = await prisma.worker.upsert({
      where: { id: 2 },
      update: { agreedSalary: 11000.00, productiveHoursPerMonth: 200, status: 'ACTIVE' },
      create: { name: 'Suresh Patel', agreedSalary: 11000.00, productiveHoursPerMonth: 200, status: 'ACTIVE' },
    });
    const w3 = await prisma.worker.upsert({
      where: { id: 3 },
      update: { agreedSalary: 10000.00, productiveHoursPerMonth: 200, status: 'ACTIVE' },
      create: { name: 'Anita Devi', agreedSalary: 10000.00, productiveHoursPerMonth: 200, status: 'ACTIVE' },
    });

    const totalAgreedSalaries = Number(w1.agreedSalary) + Number(w2.agreedSalary) + Number(w3.agreedSalary);
    assert(totalAgreedSalaries === 33000.00, `Total monthly agreed salary for 3 workers is exactly Rs 33,000.00 (found: ${totalAgreedSalaries})`);

    // Clean up test month records before running to ensure test idempotency
    const testMonth = '2026-09';
    await prisma.salaryPayment.deleteMany({
      where: { salaryRecord: { monthYear: testMonth } },
    });
    await prisma.salaryRecord.deleteMany({
      where: { monthYear: testMonth },
    });
    await prisma.expense.deleteMany({
      where: {
        description: { contains: 'Salary Payment' },
        expenseDate: { gte: new Date('2026-09-01'), lte: new Date('2026-09-30T23:59:59.999Z') },
      },
    });

    // Generate monthly salary sheets for test month
    const genRes = await fetch(`${BASE_URL}/salaries/generate`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ monthYear: testMonth }),
    });
    const genData = await genRes.json();
    assert(genRes.status === 200, `Monthly salary sheet generated for ${testMonth}`);

    // Disburse salary to Ramesh Kumar (Rs. 12,000)
    const rameshRecord = await prisma.salaryRecord.findUnique({
      where: { workerId_monthYear: { workerId: w1.id, monthYear: testMonth } },
    });
    const payRes1 = await fetch(`${BASE_URL}/salaries/pay`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        salaryRecordId: rameshRecord.id,
        workerId: w1.id,
        amount: 12000,
        paymentDate: '2026-09-30',
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Full September salary disbursement',
      }),
    });
    assert(payRes1.status === 201, 'Salary payment of Rs 12,000 for Ramesh recorded');

    // Disburse partial salary to Suresh Patel (Rs. 6,000 out of Rs. 11,000)
    const sureshRecord = await prisma.salaryRecord.findUnique({
      where: { workerId_monthYear: { workerId: w2.id, monthYear: testMonth } },
    });
    const payRes2 = await fetch(`${BASE_URL}/salaries/pay`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        salaryRecordId: sureshRecord.id,
        workerId: w2.id,
        amount: 6000,
        paymentDate: '2026-09-30',
        paymentMethod: 'CASH',
        notes: 'Partial salary payment',
      }),
    });
    assert(payRes2.status === 201, 'Partial salary payment of Rs 6,000 for Suresh recorded');

    // Verify Suresh's pending balance is 5,000 and status is PARTIAL
    const updatedSureshRecord = await prisma.salaryRecord.findUnique({ where: { id: sureshRecord.id } });
    assert(Number(updatedSureshRecord.pendingBalance) === 5000.00, `Suresh pending balance is exactly Rs 5,000 (found: ${updatedSureshRecord.pendingBalance})`);
    assert(updatedSureshRecord.status === 'PARTIAL', `Suresh salary status is PARTIAL (found: ${updatedSureshRecord.status})`);

    // Verify Business Expenses automatically created
    const salaryExpenseEntries = await prisma.expense.findMany({
      where: {
        category: { name: { contains: 'Salaries' } },
        expenseDate: { gte: new Date('2026-09-01'), lte: new Date('2026-09-30T23:59:59.999Z') },
      },
    });
    const totalSalaryExpenseSum = salaryExpenseEntries.reduce((sum, e) => sum + Number(e.amount), 0);
    assert(totalSalaryExpenseSum === 18000.00, `Automatic business salary expense logged is Rs 18,000 (found: ${totalSalaryExpenseSum})`);

    // -------------------------------------------------------------------------
    // TEST 4: SECTION 9 FINANCIAL CALCULATION AUDIT (EXACT NUMERICAL SPECS)
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: Section 9 Financial Calculation Audit ---');
    // Financial Requirements:
    // Revenue: Rs. 35,000
    // Material Cost: Rs. 10,000
    // Labour Cost: Rs. 7,000
    // Direct Expenses: Rs. 3,000
    // Total Order Cost: Rs. 20,000
    // Net Profit: Rs. 15,000
    // Profit Margin: 42.86%

    // Create fresh Order for Section 9 audit
    const s9Order = await prisma.order.create({
      data: {
        orderNumber: `GF-S9-AUDIT-${uniqueSuffix}`,
        companyId: company.id,
        title: 'Section 9 Financial Benchmark Order',
        pricingMethod: 'PER_PIECE',
        totalPieces: 500,
        unitRate: 70.00,
        totalRevenue: 35000.00,
        status: 'CONFIRMED',
      },
    });

    // 4.1 Consume Shop Material to reach Rs. 10,000 material cost
    // Let's create an exact material with unit cost 100 and consume 100 units
    const matCat = await prisma.materialCategory.findFirst();
    const matS9 = await prisma.material.create({
      data: {
        name: `Section 9 Poplin Fabric ${uniqueSuffix}`,
        categoryId: matCat.id,
        unit: 'Meters',
        openingStock: 200,
        currentStock: 200,
        weightedAvgCost: 100.00,
      },
    });

    await prisma.$transaction(async (tx) => {
      await inventoryService.consumeMaterial(tx, {
        orderId: s9Order.id,
        materialId: matS9.id,
        source: 'SHOP',
        requiredQuantity: 100,
        consumedQuantity: 100,
        notes: 'Section 9 Material Allocation (Rs 10,000)',
      });
    });

    // 4.2 Allocate Rs. 7,000 labour to Order
    await prisma.labourAllocation.create({
      data: {
        orderId: s9Order.id,
        workerId: w1.id,
        allocationMethod: 'MANUAL',
        hoursWorked: 0,
        hourlyRateSnapshot: 0,
        allocatedCost: 7000.00,
        notes: 'Section 9 Dedicated Labour Allocation (Rs 7,000)',
      },
    });

    // 4.3 Add Direct Expense of Rs. 3,000 linked directly to Order
    let expCat = await prisma.expenseCategory.findFirst({ where: { name: { contains: 'Packaging' } } });
    if (!expCat) {
      expCat = await prisma.expenseCategory.create({
        data: { name: 'Direct Order Packaging', isOverhead: false },
      });
    }

    await prisma.expense.create({
      data: {
        expenseNumber: `GF-EXP-S9-${uniqueSuffix}`,
        categoryId: expCat.id,
        orderId: s9Order.id,
        description: 'Special embroidery and custom branded boxes for Order',
        amount: 3000.00,
        paymentMethod: 'CASH',
        isOverhead: false,
      },
    });

    // 4.4 Run Costing Engine on s9Order
    const s9Costing = await costingEngine.calculateOrderCosting(s9Order.id);

    console.log('  Calculated Order Costing Results:');
    console.log(`    Revenue:              Rs. ${s9Costing.financials.revenue}`);
    console.log(`    Actual Material Cost: Rs. ${s9Costing.financials.actualMaterialCost}`);
    console.log(`    Actual Labour Cost:   Rs. ${s9Costing.financials.actualLabourCost}`);
    console.log(`    Direct Expense Cost:  Rs. ${s9Costing.financials.directExpenseCost}`);
    console.log(`    Total Order Cost:     Rs. ${s9Costing.financials.totalOrderCost}`);
    console.log(`    Net Profit:           Rs. ${s9Costing.financials.netProfit}`);
    console.log(`    Profit Margin:        ${s9Costing.financials.profitMargin}%`);

    assert(s9Costing.financials.revenue === 35000.00, `Revenue is exactly Rs 35,000.00 (found: ${s9Costing.financials.revenue})`);
    assert(s9Costing.financials.actualMaterialCost === 10000.00, `Actual Material Cost is exactly Rs 10,000.00 (found: ${s9Costing.financials.actualMaterialCost})`);
    assert(s9Costing.financials.actualLabourCost === 7000.00, `Actual Labour Cost is exactly Rs 7,000.00 (found: ${s9Costing.financials.actualLabourCost})`);
    assert(s9Costing.financials.directExpenseCost === 3000.00, `Direct Expense Cost is exactly Rs 3,000.00 (found: ${s9Costing.financials.directExpenseCost})`);
    assert(s9Costing.financials.totalOrderCost === 20000.00, `Total Order Cost is exactly Rs 20,000.00 (found: ${s9Costing.financials.totalOrderCost})`);
    assert(s9Costing.financials.netProfit === 15000.00, `Net Order Profit is exactly Rs 15,000.00 (found: ${s9Costing.financials.netProfit})`);
    assert(s9Costing.financials.profitMargin === 42.86, `Profit Margin is exactly 42.86% (found: ${s9Costing.financials.profitMargin}%)`);

    // 4.5 Record Client Payments against this Order
    // Advance Rs. 20,000, Progress Rs. 10,000 -> Remaining balance Rs. 5,000
    await prisma.payment.create({
      data: {
        paymentNumber: `GF-PAY-S9-A-${uniqueSuffix}`,
        orderId: s9Order.id,
        companyId: company.id,
        amount: 20000.00,
        paymentType: 'ADVANCE',
        paymentMethod: 'BANK_TRANSFER',
      },
    });
    await prisma.payment.create({
      data: {
        paymentNumber: `GF-PAY-S9-B-${uniqueSuffix}`,
        orderId: s9Order.id,
        companyId: company.id,
        amount: 10000.00,
        paymentType: 'PROGRESS',
        paymentMethod: 'UPI',
      },
    });

    const refreshedCosting = await costingEngine.calculateOrderCosting(s9Order.id);
    assert(refreshedCosting.financials.totalPaymentsReceived === 30000.00, `Total payments received is Rs 30,000.00 (found: ${refreshedCosting.financials.totalPaymentsReceived})`);
    assert(refreshedCosting.financials.pendingPaymentBalance === 5000.00, `Pending payment balance is Rs 5,000.00 (found: ${refreshedCosting.financials.pendingPaymentBalance})`);

    // -------------------------------------------------------------------------
    // TEST 5: DOUBLE COUNTING PREVENTION & UNALLOCATED LABOUR VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 5: Double Counting Prevention & Unallocated Labour Audit ---');
    // Get P&L report via API
    const pnlRes = await fetch(`${BASE_URL}/reports/profit-loss`, { headers: authHeaders });
    const pnlData = await pnlRes.json();
    assert(pnlRes.status === 200, 'P&L report retrieved via API');

    const pnlSummary = pnlData.data.summary;
    console.log(`    Total Revenue:            Rs. ${pnlSummary.totalRevenue}`);
    console.log(`    Total Business Expenses:  Rs. ${pnlSummary.totalBusinessExpenses}`);
    console.log(`    Net Operating Profit:     Rs. ${pnlSummary.netOperatingProfit}`);
    console.log(`    Total Salaries Disbursed: Rs. ${pnlSummary.totalSalaryExpenses}`);
    console.log(`    Allocated Labour to Jobs: Rs. ${pnlSummary.totalAllocatedLabourCost}`);
    console.log(`    Unallocated Labour Cost:  Rs. ${pnlSummary.unallocatedLabourCost}`);

    // Verify Double Counting Prevention:
    // Net operating profit in the P&L = Total Revenue - Total Business Expenses
    // (It does not add allocated labour twice!)
    const expectedNetProfit = Number((pnlSummary.totalRevenue - pnlSummary.totalBusinessExpenses).toFixed(2));
    assert(pnlSummary.netOperatingProfit === expectedNetProfit, `P&L Net Profit equals Total Revenue - Total Business Expenses (without double-counting allocated labour)`);

    // -------------------------------------------------------------------------
    // TEST 6: VERIFICATION OF ALL 17 MODULES VIA REST API
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 6: 17-Module REST API Endpoint Verification ---');

    // 1. Dashboard
    const dashRes = await fetch(`${BASE_URL}/dashboard/stats`, { headers: authHeaders });
    assert(dashRes.status === 200, 'Module 1: Dashboard API (/api/dashboard/stats) OK');

    // 2. Company Management
    const compRes = await fetch(`${BASE_URL}/companies`, { headers: authHeaders });
    assert(compRes.status === 200, 'Module 2: Companies API (/api/companies) OK');

    // 3. Bulk Order Management
    const ordRes = await fetch(`${BASE_URL}/orders`, { headers: authHeaders });
    assert(ordRes.status === 200, 'Module 3: Orders API (/api/orders) OK');

    // 4. Materials & Inventory
    const matRes = await fetch(`${BASE_URL}/materials`, { headers: authHeaders });
    assert(matRes.status === 200, 'Module 4: Materials API (/api/materials) OK');

    // 5. Material Purchases
    const purRes = await fetch(`${BASE_URL}/purchases`, { headers: authHeaders });
    assert(purRes.status === 200, 'Module 5: Purchases API (/api/purchases) OK');

    // 6. Supplier Management
    const supRes = await fetch(`${BASE_URL}/suppliers`, { headers: authHeaders });
    assert(supRes.status === 200, 'Module 6: Suppliers API (/api/suppliers) OK');

    // 7. Worker Management
    const workRes = await fetch(`${BASE_URL}/workers`, { headers: authHeaders });
    assert(workRes.status === 200, 'Module 7: Workers API (/api/workers) OK');

    // 8. Attendance & Work Hours
    const attRes = await fetch(`${BASE_URL}/attendance`, { headers: authHeaders });
    assert(attRes.status === 200, 'Module 8: Attendance API (/api/attendance) OK');

    // 9. Salary Management
    const salRes = await fetch(`${BASE_URL}/salaries?monthYear=${testMonth}`, { headers: authHeaders });
    const salData = await salRes.json();
    assert(salRes.status === 200 && salData.summary !== undefined, 'Module 9: Salary Management API with unallocated labour breakdown OK');

    // 10. Expense Management
    const expRes = await fetch(`${BASE_URL}/expenses`, { headers: authHeaders });
    assert(expRes.status === 200, 'Module 10: Expenses API (/api/expenses) OK');

    // 11. Order Costing
    const costRes = await fetch(`${BASE_URL}/costing/${s9Order.id}`, { headers: authHeaders });
    assert(costRes.status === 200, 'Module 11: Order Costing API (/api/costing/:orderId) OK');

    // 12. Production Tracking
    const stagesRes = await fetch(`${BASE_URL}/production/stages`, { headers: authHeaders });
    assert(stagesRes.status === 200, 'Module 12: Production Stages API (/api/production/stages) OK');

    // 13. Payment Management
    const payRes = await fetch(`${BASE_URL}/payments`, { headers: authHeaders });
    assert(payRes.status === 200, 'Module 13: Payments API (/api/payments) OK');

    // 14. Invoice Management (including PDF generation)
    // Create an invoice for s9Order
    const invRes = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        orderId: s9Order.id,
        taxPercent: 5.0,
      }),
    });
    const invData = await invRes.json();
    assert(invRes.status === 201, 'Module 14: Invoice Creation API (/api/invoices) OK');
    const invoiceId = invData.data.id;

    // Verify PDF download
    const pdfRes = await fetch(`${BASE_URL}/invoices/${invoiceId}/pdf`, { headers: authHeaders });
    const pdfBlob = await pdfRes.arrayBuffer();
    assert(pdfRes.status === 200 && pdfBlob.byteLength > 1000, `Module 14: Invoice PDF Generation OK (${pdfBlob.byteLength} bytes generated with PDFKit)`);

    // 15. Profit & Loss Report
    assert(pnlRes.status === 200, 'Module 15: Profit & Loss API (/api/reports/profit-loss) OK');

    // 16. Reports & Excel Export
    const excelRes = await fetch(`${BASE_URL}/reports/export/orders`, { headers: authHeaders });
    const excelBlob = await excelRes.arrayBuffer();
    assert(excelRes.status === 200 && excelBlob.byteLength > 1000, `Module 16: Excel Export API OK (${excelBlob.byteLength} bytes generated with ExcelJS)`);

    // 17. Settings
    const setRes = await fetch(`${BASE_URL}/settings`, { headers: authHeaders });
    assert(setRes.status === 200, 'Module 17: Settings API (/api/settings) OK');

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n================================================================================');
    console.log(`   ALL AUDIT TESTS COMPLETED SUCCESSFULLY! (${passedTests}/${totalTests} Passed - 100%)`);
    console.log('================================================================================\n');

  } catch (error) {
    console.error('\n[AUDIT FAILURE]', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runComprehensiveAudit();
