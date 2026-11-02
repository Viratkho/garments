const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Database Seeding ---');

  // 1. Admin User
  const passwordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@garmentflow.com' },
    update: {},
    create: {
      name: 'Shop Owner / Admin',
      email: 'admin@garmentflow.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`✓ Admin user created: ${admin.email}`);

  // 2. Production Stages
  const defaultStages = [
    { stageName: 'Order Received', stageOrder: 1, description: 'Order created and details verified' },
    { stageName: 'Materials Arranged', stageOrder: 2, description: 'Fabrics and trims sourced or allocated' },
    { stageName: 'Cutting / Preparation', stageOrder: 3, description: 'Patterns cut and fabric panels prepared' },
    { stageName: 'Collar Stitching', stageOrder: 4, description: 'Collar assembly and prep stitching' },
    { stageName: 'Pocket Stitching', stageOrder: 5, description: 'Pocket preparation and attachment' },
    { stageName: 'Main Stitching', stageOrder: 6, description: 'Assembly of body, sleeves, and finishing seams' },
    { stageName: 'Finishing', stageOrder: 7, description: 'Buttoning, trimming, pressing and ironing' },
    { stageName: 'Quality Checking', stageOrder: 8, description: 'Final QC inspection and defect review' },
    { stageName: 'Completed', stageOrder: 9, description: 'Garments packed and stored in dispatch area' },
    { stageName: 'Delivered', stageOrder: 10, description: 'Order dispatched and delivered to client' },
  ];

  for (const stage of defaultStages) {
    await prisma.productionStage.upsert({
      where: { stageName: stage.stageName },
      update: { stageOrder: stage.stageOrder, description: stage.description },
      create: stage,
    });
  }
  console.log('✓ 10 Production Stages configured');

  // 3. Material Categories
  const materialCategories = [
    { name: 'Fabrics', description: 'Cotton, Polyester, Denim, Silk, Blends' },
    { name: 'Threads', description: 'Sewing, embroidery, and overlock threads' },
    { name: 'Buttons & Fasteners', description: 'Plastic, metal, snap and wooden buttons' },
    { name: 'Zippers', description: 'Nylon, metal, concealed zippers' },
    { name: 'Collars & Cuffs', description: 'Fusible canvas, collar stays, knitted ribs' },
    { name: 'Linings & Interlinings', description: 'Micro-lining, fusing sheets' },
    { name: 'Packaging Materials', description: 'Poly bags, boxes, hangtags, stickers' },
    { name: 'Labels & Tags', description: 'Woven labels, care labels, size tags' },
    { name: 'Custom Materials', description: 'Order-specific decorative trims and items' },
  ];

  for (const cat of materialCategories) {
    await prisma.materialCategory.upsert({
      where: { name: cat.name },
      update: { description: cat.description },
      create: cat,
    });
  }
  console.log('✓ Material categories seeded');

  // 4. Expense Categories
  const expenseCategories = [
    { name: 'Materials & Raw Goods', isOverhead: false },
    { name: 'Direct Labour & Subcontracting', isOverhead: false },
    { name: 'Worker Salaries', isOverhead: false },
    { name: 'Electricity & Utilities', isOverhead: true },
    { name: 'Shop Rent', isOverhead: true },
    { name: 'Transportation & Logistics', isOverhead: false },
    { name: 'Packaging Supplies', isOverhead: false },
    { name: 'Machine Repairs & Maintenance', isOverhead: true },
    { name: 'Office & Miscellaneous Overheads', isOverhead: true },
  ];

  for (const cat of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { name: cat.name },
      update: { isOverhead: cat.isOverhead },
      create: cat,
    });
  }
  console.log('✓ Expense categories seeded');

  // 5. Application Settings (Branded for DP ENTERPRISES)
  const settings = [
    { settingKey: 'shop_name', settingValue: 'DP ENTERPRISES', settingGroup: 'COMPANY', description: 'Official business name' },
    { settingKey: 'app_title', settingValue: 'DP ENTERPRISES – GarmentFlow', settingGroup: 'COMPANY', description: 'Application title' },
    { settingKey: 'app_description', settingValue: 'Garment Manufacturing, Bulk Order, Stitching and Business Management System', settingGroup: 'COMPANY', description: 'Business description' },
    { settingKey: 'shop_logo', settingValue: '', settingGroup: 'COMPANY', description: 'Business logo URL (optional)' },
    { settingKey: 'shop_address', settingValue: '', settingGroup: 'COMPANY', description: 'Shop physical address' },
    { settingKey: 'shop_phone', settingValue: '', settingGroup: 'COMPANY', description: 'Primary phone contact' },
    { settingKey: 'shop_email', settingValue: '', settingGroup: 'COMPANY', description: 'Business email' },
    { settingKey: 'shop_gstin', settingValue: '', settingGroup: 'COMPANY', description: 'GSTIN (Optional)' },
    { settingKey: 'gst_enabled', settingValue: 'false', settingGroup: 'FINANCIAL', description: 'Enable GST on invoices (false if unregistered)' },
    { settingKey: 'default_gst_percent', settingValue: '5.0', settingGroup: 'FINANCIAL', description: 'Default GST percentage when enabled' },
    { settingKey: 'productive_monthly_hours', settingValue: '200', settingGroup: 'FINANCIAL', description: 'Standard monthly productive working hours for hourly rate derivation' },
    { settingKey: 'currency_symbol', settingValue: '₹', settingGroup: 'GENERAL', description: 'Display currency symbol' },
    { settingKey: 'costing_method', settingValue: 'WEIGHTED_AVERAGE', settingGroup: 'FINANCIAL', description: 'Default material costing algorithm' },
    { settingKey: 'invoice_prefix', settingValue: 'GF-INV-', settingGroup: 'GENERAL', description: 'Prefix for invoices' },
    { settingKey: 'order_prefix', settingValue: 'GF-ORD-', settingGroup: 'GENERAL', description: 'Prefix for order numbers' },
  ];

  for (const setting of settings) {
    await prisma.applicationSetting.upsert({
      where: { settingKey: setting.settingKey },
      update: { settingValue: setting.settingValue, settingGroup: setting.settingGroup, description: setting.description },
      create: setting,
    });
  }
  console.log('✓ Application settings seeded');

  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
