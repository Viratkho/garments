const prisma = require('../config/database');

const getSettings = async (req, res, next) => {
  try {
    const settings = await prisma.applicationSetting.findMany({
      orderBy: { settingGroup: 'asc' },
    });

    // Format as key-value object as well as array
    const settingsMap = {};
    settings.forEach(s => {
      settingsMap[s.settingKey] = s.settingValue;
    });

    return res.json({
      success: true,
      data: {
        list: settings,
        map: settingsMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const updates = req.body; // e.g. { shop_name: "ABC", productive_monthly_hours: "208", ... }

    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const setting = await prisma.applicationSetting.upsert({
        where: { settingKey: key },
        update: { settingValue: String(value) },
        create: {
          settingKey: key,
          settingValue: String(value),
          settingGroup: 'GENERAL',
        },
      });
      results.push(setting);
    }

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
