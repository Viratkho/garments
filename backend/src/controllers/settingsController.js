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
    const updates = req.body; // e.g. { shop_name: "DP ENTERPRISES", ... }

    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const setting = await prisma.applicationSetting.upsert({
        where: { settingKey: key },
        update: { settingValue: String(value ?? '') },
        create: {
          settingKey: key,
          settingValue: String(value ?? ''),
          settingGroup: key.startsWith('shop_') ? 'COMPANY' : 'GENERAL',
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

const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No logo image file uploaded' });
    }

    const logoUrl = `/uploads/${req.file.filename}`;

    const setting = await prisma.applicationSetting.upsert({
      where: { settingKey: 'shop_logo' },
      update: { settingValue: logoUrl },
      create: {
        settingKey: 'shop_logo',
        settingValue: logoUrl,
        settingGroup: 'COMPANY',
        description: 'Business logo image URL',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Business logo uploaded successfully',
      data: {
        logoUrl,
        setting,
      },
    });
  } catch (error) {
    next(error);
  }
};

const removeLogo = async (req, res, next) => {
  try {
    await prisma.applicationSetting.upsert({
      where: { settingKey: 'shop_logo' },
      update: { settingValue: '' },
      create: {
        settingKey: 'shop_logo',
        settingValue: '',
        settingGroup: 'COMPANY',
        description: 'Business logo image URL',
      },
    });

    return res.json({
      success: true,
      message: 'Logo removed. Typographic DP ENTERPRISES identity restored.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  uploadLogo,
  removeLogo,
};
