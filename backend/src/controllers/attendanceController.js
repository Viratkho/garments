const prisma = require('../config/database');

const getAttendance = async (req, res, next) => {
  try {
    const { date, workerId, startDate, endDate } = req.query;
    const where = {};

    if (workerId) {
      where.workerId = Number(workerId);
    }

    if (date) {
      const parsedDate = new Date(date);
      where.date = {
        gte: new Date(parsedDate.setHours(0, 0, 0, 0)),
        lte: new Date(parsedDate.setHours(23, 59, 59, 999)),
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        worker: {
          select: { id: true, name: true, salaryType: true, agreedSalary: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return res.json({ success: true, data: records });
  } catch (error) {
    next(error);
  }
};

const recordAttendance = async (req, res, next) => {
  try {
    const { workerId, date, status, workHours, overtimeHours, notes } = req.body;

    if (!workerId) {
      return res.status(400).json({ success: false, message: 'Worker is required' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const hours = workHours !== undefined ? Number(workHours) : (status === 'PRESENT' ? 8 : (status === 'HALF_DAY' ? 4 : 0));
    const overtime = Number(overtimeHours) || 0;

    const record = await prisma.attendance.upsert({
      where: {
        workerId_date: {
          workerId: Number(workerId),
          date: attendanceDate,
        },
      },
      update: {
        status: status || 'PRESENT',
        workHours: hours,
        overtimeHours: overtime,
        notes: notes || null,
      },
      create: {
        workerId: Number(workerId),
        date: attendanceDate,
        status: status || 'PRESENT',
        workHours: hours,
        overtimeHours: overtime,
        notes: notes || null,
      },
      include: { worker: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

const getMonthlyAttendanceSummary = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? Number(month) - 1 : now.getMonth();
    const targetYear = year ? Number(year) : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const workers = await prisma.worker.findMany({
      where: { isArchived: false, status: 'ACTIVE' },
      include: {
        attendances: {
          where: {
            date: {
              gte: startOfMonth,
              lte: endOfMonth,
            },
          },
        },
      },
    });

    const summary = workers.map(w => {
      const presentDays = w.attendances.filter(a => a.status === 'PRESENT').length;
      const halfDays = w.attendances.filter(a => a.status === 'HALF_DAY').length;
      const absentDays = w.attendances.filter(a => a.status === 'ABSENT').length;
      const totalHours = w.attendances.reduce((sum, a) => sum + Number(a.workHours), 0);
      const totalOvertime = w.attendances.reduce((sum, a) => sum + Number(a.overtimeHours), 0);

      return {
        workerId: w.id,
        workerName: w.name,
        salaryType: w.salaryType,
        agreedSalary: Number(w.agreedSalary),
        presentDays,
        halfDays,
        absentDays,
        totalHours,
        totalOvertime,
      };
    });

    return res.json({ success: true, data: summary });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendance,
  recordAttendance,
  getMonthlyAttendanceSummary,
};
