const prisma = require('../config/database');
const pdfService = require('../services/pdfService');

const getInvoices = async (req, res, next) => {
  try {
    const { orderId, companyId, status, search } = req.query;
    const where = {};

    if (orderId) where.orderId = Number(orderId);
    if (companyId) where.companyId = Number(companyId);
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { company: { name: { contains: search } } },
        { order: { orderNumber: { contains: search } } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, code: true, phone: true } },
        order: { select: { id: true, orderNumber: true, title: true } },
        items: true,
      },
      orderBy: { invoiceDate: 'desc' },
    });

    return res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        company: true,
        order: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    return res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const {
      orderId,
      invoiceDate,
      dueDate,
      discount = 0,
      taxPercent = 0,
      notes,
      terms,
      items,
    } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Generate Invoice Number
    const count = await prisma.invoice.count();
    const invoiceNumber = `GF-INV-${String(count + 1).padStart(4, '0')}`;

    // Line items calculation
    let lineItems = items;
    if (!lineItems || lineItems.length === 0) {
      if (order.items && order.items.length > 0) {
        lineItems = order.items.map(i => ({
          description: `${i.garmentType} ${i.color ? `(${i.color})` : ''} ${i.size ? `Size: ${i.size}` : ''}`.trim(),
          quantity: Number(i.quantity),
          unit: 'PIECE',
          unitPrice: Number(i.unitPrice),
          totalAmount: Number(i.totalAmount),
        }));
      } else {
        lineItems = [
          {
            description: order.title,
            quantity: Number(order.totalPieces || 1),
            unit: 'PIECE',
            unitPrice: Number(order.unitRate || order.totalRevenue),
            totalAmount: Number(order.totalRevenue),
          },
        ];
      }
    }

    const subtotal = lineItems.reduce((sum, item) => sum + Number(item.totalAmount), 0);
    const disc = Number(discount) || 0;
    const taxable = Math.max(0, subtotal - disc);
    const taxRate = Number(taxPercent) || 0;
    const taxAmt = Number(((taxable * taxRate) / 100).toFixed(2));
    const totalAmount = Number((taxable + taxAmt).toFixed(2));

    // Sum existing payments for this order
    const totalPaid = order.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const balanceDue = Math.max(0, totalAmount - totalPaid);

    let status = 'ISSUED';
    if (balanceDue <= 0) status = 'PAID';
    else if (totalPaid > 0) status = 'PARTIAL';

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          companyId: order.companyId,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          subtotal,
          discount: disc,
          taxPercent: taxRate,
          taxAmount: taxAmt,
          totalAmount,
          paidAmount: totalPaid,
          balanceDue,
          status,
          notes: notes || 'Thank you for your business!',
          terms: terms || 'Payment due within 15 days of invoice date.',
        },
      });

      for (const item of lineItems) {
        await tx.invoiceItem.create({
          data: {
            invoiceId: inv.id,
            description: item.description,
            quantity: Number(item.quantity),
            unit: item.unit || 'PIECE',
            unitPrice: Number(item.unitPrice),
            totalAmount: Number(item.totalAmount),
          },
        });
      }

      return inv;
    });

    return res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};

const downloadInvoicePdf = async (req, res, next) => {
  try {
    const invoiceId = Number(req.params.id);
    await pdfService.generateInvoicePdf(invoiceId, res);
  } catch (error) {
    next(error);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const { status, notes, terms, dueDate } = req.body;
    const updated = await prisma.invoice.update({
      where: { id: Number(req.params.id) },
      data: {
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        terms: terms !== undefined ? terms : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
    });

    return res.json({ success: true, message: 'Invoice updated', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    await prisma.invoice.update({
      where: { id: Number(req.params.id) },
      data: { status: 'CANCELLED' },
    });
    return res.json({ success: true, message: 'Invoice marked as cancelled' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  downloadInvoicePdf,
  updateInvoice,
  deleteInvoice,
};
