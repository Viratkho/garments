const prisma = require('../src/config/database');
const inventoryService = require('../src/services/inventoryService');
const costingEngine = require('../src/services/costingEngine');

async function runAcceptanceTest() {
  console.log('=================================================================');
  console.log('   GARMENTFLOW – MANDATORY ACCEPTANCE TEST (ABC TEXTILES)');
  console.log('=================================================================');

  try {
    // 0. Ensure default stages and categories exist
    const fabricCat = await prisma.materialCategory.findFirst({ where: { name: 'Fabrics' } });
    const threadCat = await prisma.materialCategory.findFirst({ where: { name: 'Threads' } });
    const expenseCat = await prisma.expenseCategory.findFirst({ where: { name: { contains: 'Packaging' } } });

    // 1. Create Company ABC Textiles
    console.log('\n[Step 1] Creating Company: ABC Textiles...');
    let company = await prisma.company.findFirst({ where: { name: 'ABC Textiles' } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'ABC Textiles',
          code: 'ABC-TEX-001',
          contactPerson: 'Mr. Rajesh Kumar',
          email: 'rajesh@abctextiles.in',
          phone: '+91 98111 22233',
          address: 'Plot 104, Textile Hub, Tirupur, Tamil Nadu',
          gstin: '33AABCT1234F1Z5',
          notes: 'Premium client for uniform and casual wear shirts',
        },
      });
    }
    console.log(`✓ Company Verified: ${company.name} (ID: ${company.id})`);

    // 2. Create Bulk Order: 500 customised shirts @ ₹70/shirt => ₹35,000 revenue
    console.log('\n[Step 2] Creating Bulk Order: 500 shirts @ Rs. 70/shirt...');
    const orderCount = await prisma.order.count();
    const orderNumber = `GF-ORD-TEST-${String(orderCount + 1).padStart(3, '0')}`;

    const order = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.create({
        data: {
          orderNumber,
          companyId: company.id,
          title: 'Customised Oxford Cotton Shirts',
          description: '500 Customized Long Sleeve Button-Down Shirts with chest pocket and embroidered logo',
          pricingMethod: 'PER_PIECE',
          totalPieces: 500,
          unitRate: 70.00,
          totalRevenue: 500 * 70.00, // Rs. 35,000
          deliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          specialInstructions: 'Double needle stitching, reinforced collar, ABC Textiles custom woven label',
          status: 'PENDING',
        },
      });

      // Specifications
      await tx.orderSpecification.createMany({
        data: [
          { orderId: ord.id, specKey: 'Fabric', specValue: '100% Combed Cotton Poplin' },
          { orderId: ord.id, specKey: 'Collar Style', specValue: 'Button-down classic spread' },
          { orderId: ord.id, specKey: 'Pocket', specValue: 'Single V-hem chest pocket' },
          { orderId: ord.id, specKey: 'Buttons', specValue: 'High durability pearl resin 4-hole buttons' },
        ],
      });

      // Default production stages
      const stages = await tx.productionStage.findMany({ orderBy: { stageOrder: 'asc' } });
      for (const st of stages) {
        await tx.productionUpdate.create({
          data: {
            orderId: ord.id,
            stageId: st.id,
            completedQuantity: st.stageOrder === 1 ? 500 : 0,
            status: st.stageOrder === 1 ? 'COMPLETED' : 'NOT_STARTED',
          },
        });
      }

      return ord;
    });

    console.log(`✓ Order Created: ${order.orderNumber} - Expected Revenue: Rs. ${order.totalRevenue}`);

    // 3. Register Supplier
    let supplier = await prisma.supplier.findFirst({ where: { name: 'Metro Fabric Mills' } });
    if (!supplier) {
      supplier = await prisma.supplier.create({
        data: {
          name: 'Metro Fabric Mills',
          contactPerson: 'Sanjay Sharma',
          phone: '+91 94444 55566',
          email: 'sales@metrotextiles.com',
          address: 'Surat Industrial Estate, Gujarat',
        },
      });
    }

    // 4. Register Materials: Cotton Fabric and Thread
    console.log('\n[Step 3] Registering Materials: Cotton Fabric and Thread...');
    let cotton = await prisma.material.findFirst({ where: { name: 'Cotton Fabric 60s' } });
    if (!cotton) {
      cotton = await prisma.material.create({
        data: {
          name: 'Cotton Fabric 60s',
          categoryId: fabricCat.id,
          unit: 'METRE',
          openingStock: 0,
          currentStock: 0,
          minStockLevel: 25,
          weightedAvgCost: 0,
        },
      });
    }

    let thread = await prisma.material.findFirst({ where: { name: 'Spun Polyester Thread 40/2' } });
    if (!thread) {
      thread = await prisma.material.create({
        data: {
          name: 'Spun Polyester Thread 40/2',
          categoryId: threadCat.id,
          unit: 'ROLL',
          openingStock: 0,
          currentStock: 0,
          minStockLevel: 5,
          weightedAvgCost: 0,
        },
      });
    }
    console.log(`✓ Materials Registered: ${cotton.name} (ID: ${cotton.id}), ${thread.name} (ID: ${thread.id})`);

    // 5. Purchase Materials:
    // Cotton Fabric: 100 metres, Purchase Cost ₹8,000 => Unit Cost ₹80/metre
    // Thread: 20 rolls, Purchase Cost ₹1,000 => Unit Cost ₹50/roll
    console.log('\n[Step 4] Purchasing Materials...');
    console.log(' -> Cotton: 100 metres for Rs. 8,000 (Unit cost: Rs. 80)');
    console.log(' -> Thread: 20 rolls for Rs. 1,000 (Unit cost: Rs. 50)');

    await prisma.$transaction(async (tx) => {
      await inventoryService.processPurchase(tx, {
        supplierId: supplier.id,
        purchaseDate: new Date(),
        invoiceRef: 'INV-METRO-9921',
        paymentStatus: 'PAID',
        totalAmount: 9000.00,
        paidAmount: 9000.00,
        notes: 'Purchased for ABC Textiles bulk order',
        items: [
          { materialId: cotton.id, quantity: 100, unit: 'METRE', unitCost: 80.00, totalCost: 8000.00 },
          { materialId: thread.id, quantity: 20, unit: 'ROLL', unitCost: 50.00, totalCost: 1000.00 },
        ],
      });
    });

    const refreshedCottonAfterPurchase = await prisma.material.findUnique({ where: { id: cotton.id } });
    const refreshedThreadAfterPurchase = await prisma.material.findUnique({ where: { id: thread.id } });

    console.log(`✓ Cotton Stock After Purchase: ${refreshedCottonAfterPurchase.currentStock} ${refreshedCottonAfterPurchase.unit} @ Rs. ${refreshedCottonAfterPurchase.weightedAvgCost}/m`);
    console.log(`✓ Thread Stock After Purchase: ${refreshedThreadAfterPurchase.currentStock} ${refreshedThreadAfterPurchase.unit} @ Rs. ${refreshedThreadAfterPurchase.weightedAvgCost}/roll`);

    // 6. Record Material Consumption:
    // - 80 metres of cotton fabric (80 × ₹80 = ₹6,400)
    // - 10 rolls of thread (10 × ₹50 = ₹500)
    console.log('\n[Step 5] Recording Material Consumption for Order...');
    console.log(' -> Consuming 80 metres of cotton fabric (Expected Cost: Rs. 6,400)');
    console.log(' -> Consuming 10 rolls of thread (Expected Cost: Rs. 500)');

    await prisma.$transaction(async (tx) => {
      await inventoryService.consumeMaterial(tx, {
        orderId: order.id,
        materialId: cotton.id,
        source: 'SHOP',
        requiredQuantity: 80,
        consumedQuantity: 80,
        wastageQuantity: 2, // 2m scrap/cutting wastage
        notes: 'Cutting panels for 500 shirts',
      });

      await inventoryService.consumeMaterial(tx, {
        orderId: order.id,
        materialId: thread.id,
        source: 'SHOP',
        requiredQuantity: 10,
        consumedQuantity: 10,
        wastageQuantity: 0,
        notes: 'Main stitching & overlock',
      });
    });

    const cottonAfterConsumption = await prisma.material.findUnique({ where: { id: cotton.id } });
    const threadAfterConsumption = await prisma.material.findUnique({ where: { id: thread.id } });

    console.log(`✓ Remaining Cotton Stock: ${cottonAfterConsumption.currentStock} ${cottonAfterConsumption.unit} (Expected: 18, accounting for 80 consumed + 2 wastage)`);
    console.log(`✓ Remaining Thread Stock: ${threadAfterConsumption.currentStock} ${threadAfterConsumption.unit} (Expected: 10, accounting for 20 - 10)`);

    // 7. Register Three Workers with Monthly Salaries: ₹12,000, ₹11,000, ₹10,000
    console.log('\n[Step 6] Registering 3 Workers...');
    const workerData = [
      { name: 'Ramesh Tailor', salary: 12000, hours: 200 }, // Hourly rate: 12000/200 = 60
      { name: 'Suresh Master', salary: 11000, hours: 200 }, // Hourly rate: 11000/200 = 55
      { name: 'Gopal Finisher', salary: 10000, hours: 200 }, // Hourly rate: 10000/200 = 50
    ];

    const workers = [];
    for (const wd of workerData) {
      let w = await prisma.worker.findFirst({ where: { name: wd.name } });
      if (!w) {
        w = await prisma.worker.create({
          data: {
            name: wd.name,
            salaryType: 'MONTHLY',
            agreedSalary: wd.salary,
            productiveHoursPerMonth: wd.hours,
            status: 'ACTIVE',
          },
        });
      }
      workers.push(w);
      console.log(`✓ Worker: ${w.name} - Monthly Salary: Rs. ${w.agreedSalary} (Hourly Rate: Rs. ${Number(w.agreedSalary) / w.productiveHoursPerMonth})`);
    }

    // 8. Record Working Hours and Allocate Labour Cost to Order:
    // Worker 1 (Ramesh): 20 hrs worked @ ₹60/hr = ₹1,200
    // Worker 2 (Suresh): 15 hrs worked @ ₹55/hr = ₹825
    // Worker 3 (Gopal): 10 hrs worked @ ₹50/hr = ₹500
    // Total Allocated Labour = ₹2,525
    console.log('\n[Step 7] Allocating Labour Costs to Order...');
    const labourHours = [
      { worker: workers[0], hours: 20 },
      { worker: workers[1], hours: 15 },
      { worker: workers[2], hours: 10 },
    ];

    for (const lh of labourHours) {
      const hourlyRate = await costingEngine.getWorkerHourlyRate(lh.worker.id);
      const allocatedCost = Number((lh.hours * hourlyRate).toFixed(2));
      await prisma.labourAllocation.create({
        data: {
          orderId: order.id,
          workerId: lh.worker.id,
          allocationMethod: 'HOUR_BASED',
          hoursWorked: lh.hours,
          hourlyRateSnapshot: hourlyRate,
          allocatedCost,
          notes: `${lh.hours} hours devoted to cutting, stitching & finishing order ${order.orderNumber}`,
        },
      });
      console.log(` -> ${lh.worker.name}: ${lh.hours} hrs @ Rs. ${hourlyRate}/hr = Rs. ${allocatedCost}`);
    }

    // 9. Record other order expenses (e.g. ₹500 packaging/buttons)
    console.log('\n[Step 8] Recording Direct Order Expenses (Packaging/Trims: Rs. 500)...');
    const expCount = await prisma.expense.count();
    await prisma.expense.create({
      data: {
        expenseNumber: `GF-EXP-${String(expCount + 1).padStart(4, '0')}`,
        categoryId: expenseCat ? expenseCat.id : 1,
        description: 'Custom poly-bags, hangtags and buttons for ABC Textiles shirts',
        amount: 500.00,
        expenseDate: new Date(),
        orderId: order.id,
        paymentMethod: 'CASH',
        isOverhead: false,
      },
    });
    console.log('✓ Direct Order Expense of Rs. 500 recorded.');

    // 10. Track Production, Quality Approval & Delivery
    console.log('\n[Step 9] Production Tracking, Quality Approval & Delivery...');
    const stages = await prisma.productionStage.findMany({ orderBy: { stageOrder: 'asc' } });

    // Mark stages up to 9 (Completed) as completed with 500 pieces
    for (const st of stages) {
      await prisma.productionUpdate.upsert({
        where: { orderId_stageId: { orderId: order.id, stageId: st.id } },
        update: { completedQuantity: 500, status: 'COMPLETED' },
        create: { orderId: order.id, stageId: st.id, completedQuantity: 500, status: 'COMPLETED' },
      });
    }

    // Quality check record
    await prisma.qualityRecord.create({
      data: {
        orderId: order.id,
        stageId: stages.find(s => s.stageName === 'Quality Checking').id,
        inspectedQuantity: 500,
        approvedQuantity: 500,
        rejectedQuantity: 0,
        status: 'PASSED',
        inspectorName: 'Chief QC Inspector',
        notes: 'All 500 pieces meet specifications. Stitch density 12 SPI verified.',
      },
    });

    // Delivery record: 500 pieces delivered
    await prisma.delivery.create({
      data: {
        deliveryNumber: `GF-DEL-${Date.now().toString().slice(-4)}`,
        orderId: order.id,
        deliveryDate: new Date(),
        deliveredQuantity: 500,
        recipientName: 'Mr. Rajesh Kumar',
        recipientContact: '+91 98111 22233',
        status: 'DELIVERED',
        notes: 'Dispatched via Express Cargo. Acknowledged by client.',
      },
    });

    // Update order status to DELIVERED
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'DELIVERED' },
    });
    console.log('✓ Production 500 pcs completed, QC Passed (500 approved), and full Delivery logged.');

    // 11. Generate Invoice
    console.log('\n[Step 10] Generating Invoice...');
    const invCount = await prisma.invoice.count();
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `GF-INV-TEST-${String(invCount + 1).padStart(3, '0')}`,
        orderId: order.id,
        companyId: company.id,
        invoiceDate: new Date(),
        subtotal: 35000.00,
        discount: 0,
        taxPercent: 0,
        taxAmount: 0,
        totalAmount: 35000.00,
        paidAmount: 0,
        balanceDue: 35000.00,
        status: 'ISSUED',
        notes: 'Full delivery completed in good order.',
      },
    });

    await prisma.invoiceItem.create({
      data: {
        invoiceId: invoice.id,
        description: 'Customised Oxford Cotton Shirts - Batch of 500 pcs',
        quantity: 500,
        unit: 'PIECE',
        unitPrice: 70.00,
        totalAmount: 35000.00,
      },
    });
    console.log(`✓ Invoice Created: ${invoice.invoiceNumber} for Rs. ${invoice.totalAmount}`);

    // 12. Record ₹10,000 Advance Payment
    console.log('\n[Step 11] Recording Rs. 10,000 Advance Payment...');
    const payCount = await prisma.payment.count();
    const payment = await prisma.payment.create({
      data: {
        paymentNumber: `GF-PAY-TEST-${String(payCount + 1).padStart(3, '0')}`,
        orderId: order.id,
        companyId: company.id,
        amount: 10000.00,
        paymentDate: new Date(),
        paymentMethod: 'BANK_TRANSFER',
        paymentType: 'ADVANCE',
        referenceNo: 'NEFT-ABCTEX-88192',
        notes: 'Advance against 500 shirt order',
      },
    });

    // Update invoice balance
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: 10000.00,
        balanceDue: 25000.00,
        status: 'PARTIAL',
      },
    });
    console.log(`✓ Payment ${payment.paymentNumber} of Rs. 10,000 received. Updated Invoice Balance: Rs. 25,000`);

    // 13. VERIFY ORDER COSTING VIA CENTRALIZED ENGINE
    console.log('\n=================================================================');
    console.log('   CENTRALIZED ORDER COSTING ENGINE VERIFICATION');
    console.log('=================================================================');

    const costing = await costingEngine.calculateOrderCosting(order.id);
    const f = costing.financials;

    console.log(`1. Total Revenue:             Rs. ${f.revenue.toLocaleString()} (Expected: Rs. 35,000)`);
    console.log(`2. Actual Material Cost:      Rs. ${f.actualMaterialCost.toLocaleString()} (Expected: Rs. 6,900 = 6,400 + 500)`);
    console.log(`3. Allocated Labour Cost:     Rs. ${f.actualLabourCost.toLocaleString()} (Expected: Rs. 2,525 = 1,200 + 825 + 500)`);
    console.log(`4. Direct Order Expenses:     Rs. ${f.directExpenseCost.toLocaleString()} (Expected: Rs. 500)`);
    console.log(`5. Total Order Cost:          Rs. ${f.totalOrderCost.toLocaleString()} (Expected: Rs. 9,925 = 6,900 + 2,525 + 500)`);
    console.log(`6. Net Order Profit:          Rs. ${f.netProfit.toLocaleString()} (Expected: Rs. 25,075 = 35,000 - 9,925)`);
    console.log(`7. Profit Margin:             ${f.profitMargin}% (Expected: ~71.64%)`);
    console.log(`8. Cost Per Garment:          Rs. ${f.costPerGarment}/shirt (Expected: Rs. 19.85/shirt)`);
    console.log(`9. Payments Received:         Rs. ${f.totalPaymentsReceived.toLocaleString()} (Expected: Rs. 10,000)`);
    console.log(`10. Pending Balance:          Rs. ${f.pendingPaymentBalance.toLocaleString()} (Expected: Rs. 25,000)`);

    // Verification assertions
    if (f.revenue !== 35000) throw new Error(`Revenue assertion failed. Got ${f.revenue}`);
    if (f.actualMaterialCost !== 6900) throw new Error(`Material cost assertion failed. Got ${f.actualMaterialCost}`);
    if (f.actualLabourCost !== 2525) throw new Error(`Labour cost assertion failed. Got ${f.actualLabourCost}`);
    if (f.directExpenseCost !== 500) throw new Error(`Direct expense assertion failed. Got ${f.directExpenseCost}`);
    if (f.totalOrderCost !== 9925) throw new Error(`Total cost assertion failed. Got ${f.totalOrderCost}`);
    if (f.netProfit !== 25075) throw new Error(`Net profit assertion failed. Got ${f.netProfit}`);
    if (f.pendingPaymentBalance !== 25000) throw new Error(`Pending balance assertion failed. Got ${f.pendingPaymentBalance}`);

    console.log('\n*****************************************************************');
    console.log('  ALL ACCEPTANCE TEST ASSERTIONS PASSED WITH 100% ACCURACY!      ');
    console.log('*****************************************************************\n');

    return true;
  } catch (error) {
    console.error('Acceptance Test Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAcceptanceTest();
