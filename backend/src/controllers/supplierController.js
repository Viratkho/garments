const prisma = require('../config/database');

const getSuppliers = async (req, res, next) => {
  try {
    const { search, isArchived } = req.query;
    const where = {};

    if (isArchived === 'true') {
      where.isArchived = true;
    } else if (isArchived !== 'all') {
      where.isArchived = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { purchases: true } },
      },
    });

    return res.json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        purchases: {
          include: {
            items: { include: { material: true } },
          },
          orderBy: { purchaseDate: 'desc' },
        },
      },
    });

    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    return res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

const createSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, address, gstin, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Supplier name is required' });
    }

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        gstin: gstin || null,
        notes: notes || null,
      },
    });

    return res.status(201).json({ success: true, message: 'Supplier created', data: supplier });
  } catch (error) {
    next(error);
  }
};

const updateSupplier = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, address, gstin, notes, isArchived } = req.body;

    const updated = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name && { name: name.trim() }),
        contactPerson: contactPerson !== undefined ? contactPerson : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        gstin: gstin !== undefined ? gstin : undefined,
        notes: notes !== undefined ? notes : undefined,
        isArchived: isArchived !== undefined ? Boolean(isArchived) : undefined,
      },
    });

    return res.json({ success: true, message: 'Supplier updated', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteSupplier = async (req, res, next) => {
  try {
    await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: { isArchived: true },
    });
    return res.json({ success: true, message: 'Supplier archived' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};
