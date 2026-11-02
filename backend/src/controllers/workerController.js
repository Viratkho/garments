const prisma = require('../config/database');

const getWorkers = async (req, res, next) => {
  try {
    const { status, search, isArchived } = req.query;
    const where = {};

    if (isArchived === 'true') {
      where.isArchived = true;
    } else if (isArchived !== 'all') {
      where.isArchived = false;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const workers = await prisma.worker.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            attendances: true,
            salaryRecords: true,
            labourAllocations: true,
          },
        },
      },
    });

    // Compute productive hourly rate for each worker
    const enriched = workers.map(w => {
      const salary = Number(w.agreedSalary);
      const hours = w.productiveHoursPerMonth || 200;
      const hourlyRate = hours > 0 ? Number((salary / hours).toFixed(2)) : 0;
      return {
        ...w,
        agreedSalary: salary,
        computedHourlyRate: hourlyRate,
      };
    });

    return res.json({ success: true, data: enriched });
  } catch (error) {
    next(error);
  }
};

const getWorkerById = async (req, res, next) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        attendances: {
          orderBy: { date: 'desc' },
          take: 31,
        },
        salaryRecords: {
          orderBy: { monthYear: 'desc' },
          include: { payments: true },
        },
        labourAllocations: {
          orderBy: { createdAt: 'desc' },
          include: {
            order: { include: { company: true } },
          },
          take: 20,
        },
      },
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found' });
    }

    const salary = Number(worker.agreedSalary);
    const hours = worker.productiveHoursPerMonth || 200;
    const hourlyRate = hours > 0 ? Number((salary / hours).toFixed(2)) : 0;

    return res.json({
      success: true,
      data: {
        ...worker,
        agreedSalary: salary,
        computedHourlyRate: hourlyRate,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createWorker = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      address,
      joiningDate,
      salaryType,
      agreedSalary,
      productiveHoursPerMonth,
      notes,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Worker name is required' });
    }

    const worker = await prisma.worker.create({
      data: {
        name: name.trim(),
        phone: phone || null,
        address: address || null,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        salaryType: salaryType || 'MONTHLY',
        agreedSalary: Number(agreedSalary || 0),
        productiveHoursPerMonth: Number(productiveHoursPerMonth) || 200,
        status: 'ACTIVE',
        notes: notes || null,
      },
    });

    return res.status(201).json({ success: true, message: 'Worker registered successfully', data: worker });
  } catch (error) {
    next(error);
  }
};

const updateWorker = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      address,
      salaryType,
      agreedSalary,
      productiveHoursPerMonth,
      status,
      notes,
      isArchived,
    } = req.body;

    const updated = await prisma.worker.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name && { name: name.trim() }),
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined,
        salaryType: salaryType || undefined,
        agreedSalary: agreedSalary !== undefined ? Number(agreedSalary) : undefined,
        productiveHoursPerMonth: productiveHoursPerMonth !== undefined ? Number(productiveHoursPerMonth) : undefined,
        status: status || undefined,
        notes: notes !== undefined ? notes : undefined,
        isArchived: isArchived !== undefined ? Boolean(isArchived) : undefined,
      },
    });

    return res.json({ success: true, message: 'Worker details updated', data: updated });
  } catch (error) {
    next(error);
  }
};

const deleteWorker = async (req, res, next) => {
  try {
    await prisma.worker.update({
      where: { id: Number(req.params.id) },
      data: { isArchived: true, status: 'INACTIVE' },
    });
    return res.json({ success: true, message: 'Worker archived successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkers,
  getWorkerById,
  createWorker,
  updateWorker,
  deleteWorker,
};
