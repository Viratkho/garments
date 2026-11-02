const prisma = require('../config/database');

const getSalaries = async (req, res, next) => {
  try {
    const { monthYear, workerId, status } = req.query;
    const where = {};

    if (monthYear) {
      where.monthYear = monthYear;
    }

    if (workerId) {
      where.workerId = Number(workerId);
    }

    if (status) {
      where.status = status;
    }

    const records = await prisma.salaryRecord.findMany({
      where,
      include: {
        worker: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
      orderBy: { monthYear: 'desc' },
    });

    let totalAllocatedLabour = 0;
    if (monthYear && /^\d{4}-\d{2}$/.test(monthYear)) {
      const [year, month] = monthYear.split('-').map(Number);
      const mStart = new Date(year, month - 1, 1);
      const mEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const allocations = await prisma.labourAllocation.findMany({
        where: {
          createdAt: { gte: mStart, lte: mEnd },
        },
      });
      totalAllocatedLabour = allocations.reduce((sum, a) => sum + Number(a.allocatedCost), 0);
    }

    const totalSalaryDue = records.reduce((s, r) => s + Number(r.salaryDue), 0);
    const totalSalaryPaid = records.reduce((s, r) => s + Number(r.salaryPaid), 0);
    const totalPending = records.reduce((s, r) => s + Number(r.pendingBalance), 0);
    const unallocatedLabour = Math.max(0, Number((totalSalaryDue - totalAllocatedLabour).toFixed(2)));
    const labourRecoveryRate = totalSalaryDue > 0
      ? Number(((totalAllocatedLabour / totalSalaryDue) * 100).toFixed(2))
      : 0;

    return res.json({
      success: true,
      data: records,
      summary: {
        totalSalaryDue: Number(totalSalaryDue.toFixed(2)),
        totalSalaryPaid: Number(totalSalaryPaid.toFixed(2)),
        totalPendingBalance: Number(totalPending.toFixed(2)),
        totalAllocatedLabour: Number(totalAllocatedLabour.toFixed(2)),
        unallocatedLabourCost: unallocatedLabour,
        labourRecoveryRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

const generateMonthlySalaries = async (req, res, next) => {
  try {
    const { monthYear } = req.body; // e.g. "2026-10"

    if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
      return res.status(400).json({ success: false, message: 'Valid monthYear in format YYYY-MM is required (e.g. 2026-10)' });
    }

    const workers = await prisma.worker.findMany({
      where: { isArchived: false, status: 'ACTIVE' },
    });

    const results = [];

    for (const worker of workers) {
      const salaryDue = Number(worker.agreedSalary);

      const record = await prisma.salaryRecord.upsert({
        where: {
          workerId_monthYear: {
            workerId: worker.id,
            monthYear,
          },
        },
        update: {},
        create: {
          workerId: worker.id,
          monthYear,
          salaryDue,
          salaryPaid: 0,
          advanceDeducted: 0,
          overtimePay: 0,
          additionalPay: 0,
          pendingBalance: salaryDue,
          status: 'PENDING',
        },
        include: { worker: true },
      });

      results.push(record);
    }

    return res.status(200).json({
      success: true,
      message: `Generated salary records for ${results.length} workers for ${monthYear}`,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

const recordSalaryPayment = async (req, res, next) => {
  try {
    const {
      salaryRecordId,
      workerId,
      amount,
      paymentDate,
      paymentMethod,
      referenceNo,
      notes,
    } = req.body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      let record = null;
      let targetWorkerId = workerId ? Number(workerId) : null;

      if (salaryRecordId) {
        record = await tx.salaryRecord.findUnique({
          where: { id: Number(salaryRecordId) },
        });
        if (record) {
          targetWorkerId = record.workerId;
        }
      }

      if (!targetWorkerId) {
        throw new Error('Worker ID or valid Salary Record ID is required');
      }

      // Create salary payment entry
      const payment = await tx.salaryPayment.create({
        data: {
          salaryRecordId: record ? record.id : null,
          workerId: targetWorkerId,
          amount: payAmount,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod: paymentMethod || 'CASH',
          referenceNo: referenceNo || null,
          notes: notes || null,
        },
      });

      // If associated with a salary record, update paid amount & pending balance
      if (record) {
        const newPaid = Number(record.salaryPaid) + payAmount;
        const totalPayable = Number(record.salaryDue) + Number(record.overtimePay) + Number(record.additionalPay) - Number(record.advanceDeducted);
        const newBalance = Math.max(0, totalPayable - newPaid);

        let newStatus = 'PARTIAL';
        if (newBalance <= 0) newStatus = 'PAID';
        if (newPaid === 0) newStatus = 'PENDING';

        await tx.salaryRecord.update({
          where: { id: record.id },
          data: {
            salaryPaid: newPaid,
            pendingBalance: newBalance,
            status: newStatus,
          },
        });
      }

      // Record in General Business Expenses under "Worker Salaries" category
      // (as required by critical accounting rule: actual salaries are recorded once as business expenses)
      const salaryCat = await tx.expenseCategory.findFirst({
        where: { name: { contains: 'Salaries' } },
      });

      if (salaryCat) {
        const latestExp = await tx.expense.findFirst({ orderBy: { id: 'desc' } });
        const nextExpNum = latestExp ? latestExp.id + 1 : 1;
        const worker = await tx.worker.findUnique({ where: { id: targetWorkerId } });
        await tx.expense.create({
          data: {
            expenseNumber: `GF-EXP-SAL-${String(nextExpNum).padStart(4, '0')}-${Date.now().toString().slice(-4)}`,
            expenseDate: paymentDate ? new Date(paymentDate) : new Date(),
            categoryId: salaryCat.id,
            description: `Salary Payment to ${worker ? worker.name : 'Worker'} (${notes || 'Direct payment'})`,
            amount: payAmount,
            paymentMethod: paymentMethod || 'CASH',
            isOverhead: false,
          },
        });
      }

      return payment;
    });

    return res.status(201).json({
      success: true,
      message: 'Salary payment recorded and reflected in business expenses',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalaries,
  generateMonthlySalaries,
  recordSalaryPayment,
};
