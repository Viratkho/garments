const prisma = require('../config/database');

const getPayments = async (req, res, next) => {
  try {
    const { orderId, companyId, paymentType, startDate, endDate, search } = req.query;
    const where = {};

    if (orderId) where.orderId = Number(orderId);
    if (companyId) where.companyId = Number(companyId);
    if (paymentType) where.paymentType = paymentType;

    if (startDate && endDate) {
      where.paymentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (search) {
      where.OR = [
        { paymentNumber: { contains: search } },
        { referenceNo: { contains: search } },
        { company: { name: { contains: search } } },
        { order: { orderNumber: { contains: search } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, code: true, phone: true } },
        order: { select: { id: true, orderNumber: true, title: true, totalRevenue: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });

    return res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

const getPaymentById = async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        company: true,
        order: true,
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    return res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

const createPayment = async (req, res, next) => {
  try {
    const {
      orderId,
      companyId,
      amount,
      paymentDate,
      paymentMethod,
      paymentType,
      referenceNo,
      notes,
    } = req.body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    let targetCompanyId = companyId ? Number(companyId) : null;
    let targetOrderId = orderId ? Number(orderId) : null;

    if (targetOrderId && !targetCompanyId) {
      const order = await prisma.order.findUnique({ where: { id: targetOrderId } });
      if (order) targetCompanyId = order.companyId;
    }

    if (!targetCompanyId) {
      return res.status(400).json({ success: false, message: 'Company ID is required' });
    }

    const count = await prisma.payment.count();
    const paymentNumber = `GF-PAY-${String(count + 1).padStart(4, '0')}`;

    const payment = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.payment.create({
        data: {
          paymentNumber,
          orderId: targetOrderId,
          companyId: targetCompanyId,
          amount: payAmount,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod: paymentMethod || 'BANK_TRANSFER',
          paymentType: paymentType || 'ADVANCE',
          referenceNo: referenceNo || null,
          notes: notes || null,
        },
        include: {
          company: true,
          order: true,
        },
      });

      // If linked to an order, update related invoice paid amounts if any
      if (targetOrderId) {
        const invoices = await tx.invoice.findMany({
          where: { orderId: targetOrderId, status: { not: 'CANCELLED' } },
        });

        for (const inv of invoices) {
          const allPayments = await tx.payment.findMany({
            where: { orderId: targetOrderId },
          });
          const totalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
          const totalInvAmount = Number(inv.totalAmount);
          const newBalance = Math.max(0, totalInvAmount - totalPaid);

          let newStatus = 'PARTIAL';
          if (newBalance <= 0) newStatus = 'PAID';
          if (totalPaid === 0) newStatus = 'ISSUED';

          await tx.invoice.update({
            where: { id: inv.id },
            data: {
              paidAmount: totalPaid,
              balanceDue: newBalance,
              status: newStatus,
            },
          });
        }
      }

      return newPayment;
    });

    return res.status(201).json({
      success: true,
      message: `Payment of Rs. ${payAmount} recorded successfully`,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const deletePayment = async (req, res, next) => {
  try {
    await prisma.payment.delete({
      where: { id: Number(req.params.id) },
    });
    return res.json({ success: true, message: 'Payment record deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  deletePayment,
};
