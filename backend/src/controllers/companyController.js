const prisma = require('../config/database');

const getCompanies = async (req, res, next) => {
  try {
    const { search, isArchived } = req.query;
    const where = {};

    if (isArchived === 'true') {
      where.isArchived = true;
    } else if (isArchived === 'all') {
      // no filter
    } else {
      where.isArchived = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { orders: true, invoices: true, payments: true },
        },
      },
    });

    return res.json({ success: true, data: companies });
  } catch (error) {
    next(error);
  }
};

const getCompanyById = async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            _count: { select: { items: true, deliveries: true } },
          },
        },
        invoices: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    return res.json({ success: true, data: company });
  } catch (error) {
    next(error);
  }
};

const createCompany = async (req, res, next) => {
  try {
    const { name, code, contactPerson, email, phone, address, gstin, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Company name is required' });
    }

    // Auto-generate code if not provided
    let companyCode = code ? code.trim().toUpperCase() : '';
    if (!companyCode) {
      const initials = name.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'CMP';
      const count = await prisma.company.count();
      companyCode = `${initials}-${String(count + 1).padStart(3, '0')}`;
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        code: companyCode,
        contactPerson: contactPerson || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        gstin: gstin || null,
        notes: notes || null,
      },
    });

    return res.status(201).json({ success: true, message: 'Company registered successfully', data: company });
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, address, gstin, notes, isArchived } = req.body;

    const company = await prisma.company.update({
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

    return res.json({ success: true, message: 'Company updated successfully', data: company });
  } catch (error) {
    next(error);
  }
};

const deleteCompany = async (req, res, next) => {
  try {
    // Soft delete / archive
    await prisma.company.update({
      where: { id: Number(req.params.id) },
      data: { isArchived: true },
    });

    return res.json({ success: true, message: 'Company archived successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
};
