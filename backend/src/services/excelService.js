const ExcelJS = require('exceljs');
const prisma = require('../config/database');

class ExcelService {
  /**
   * Helper to fetch company name from settings
   */
  async getBusinessName() {
    const setting = await prisma.applicationSetting.findUnique({
      where: { settingKey: 'shop_name' },
    });
    return (setting && setting.settingValue && setting.settingValue.trim()) || 'DP ENTERPRISES';
  }

  /**
   * Generates Order Profit Report in Excel
   */
  async exportOrderCostingReport(orderCostings, res) {
    const businessName = await this.getBusinessName();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = `${businessName} – GarmentFlow ERP`;
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Order Costing & Profit');

    // Title Block
    sheet.mergeCells('A1:L1');
    sheet.getCell('A1').value = `${businessName} - ORDER COSTING & PROFITABILITY REPORT`;
    sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF172B4D' },
    };
    sheet.getRow(1).height = 32;

    // Subtitle & Timestamp Row
    sheet.mergeCells('A2:L2');
    sheet.getCell('A2').value = `Generated on: ${new Date().toLocaleDateString('en-IN')} | System: DP ENTERPRISES – GarmentFlow`;
    sheet.getCell('A2').font = { size: 9, italic: true, color: { argb: 'FF4B5563' } };
    sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    // Header Row
    const headers = [
      'Order #', 'Customer Company', 'Garment Description', 'Status', 'Pieces',
      'Revenue (Rs.)', 'Material Cost (Rs.)', 'Labour Cost (Rs.)', 'Direct Expenses (Rs.)',
      'Total Order Cost (Rs.)', 'Net Profit (Rs.)', 'Margin (%)'
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.height = 26;

    // Data rows
    let totalRev = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalPcs = 0;

    orderCostings.forEach(item => {
      totalRev += item.financials.revenue;
      totalCost += item.financials.totalOrderCost;
      totalProfit += item.financials.netProfit;
      totalPcs += (item.totalPieces || 0);

      const row = sheet.addRow([
        item.orderNumber,
        item.company.name,
        item.title,
        item.status,
        item.totalPieces,
        item.financials.revenue,
        item.financials.actualMaterialCost,
        item.financials.actualLabourCost,
        item.financials.directExpenseCost + item.financials.allocatedOverheadCost,
        item.financials.totalOrderCost,
        item.financials.netProfit,
        item.financials.profitMargin,
      ]);

      // Highlight positive vs negative profit
      const profitCell = row.getCell(11);
      if (item.financials.netProfit >= 0) {
        profitCell.font = { color: { argb: 'FF16A34A' }, bold: true };
      } else {
        profitCell.font = { color: { argb: 'FFDC2626' }, bold: true };
      }
    });

    // Summary Totals Row
    const overallMargin = totalRev > 0 ? Number(((totalProfit / totalRev) * 100).toFixed(2)) : 0;
    const totalsRow = sheet.addRow([
      'TOTALS', '', '', '', totalPcs,
      totalRev, '', '', '',
      totalCost, totalProfit, overallMargin
    ]);
    totalsRow.font = { bold: true, color: { argb: 'FF172B4D' }, size: 10 };
    totalsRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    totalsRow.height = 24;

    // Formatting widths
    sheet.columns.forEach(col => {
      col.width = 16;
    });
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 24;
    sheet.getColumn(3).width = 26;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="DP_ENTERPRISES_Orders_Profit_Report.xlsx"');

    await workbook.xlsx.write(res);
  }

  /**
   * Generates Inventory Stock Report in Excel
   */
  async exportInventoryReport(materials, res) {
    const businessName = await this.getBusinessName();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventory Valuation');

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = `${businessName} - RAW MATERIALS INVENTORY & VALUATION REPORT`;
    sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF172B4D' },
    };
    sheet.getRow(1).height = 32;

    sheet.mergeCells('A2:G2');
    sheet.getCell('A2').value = `Generated on: ${new Date().toLocaleDateString('en-IN')} | System: DP ENTERPRISES – GarmentFlow`;
    sheet.getCell('A2').font = { size: 9, italic: true, color: { argb: 'FF4B5563' } };
    sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 20;

    const headers = [
      'Material Name', 'Category', 'Unit', 'Current Stock',
      'Min Level', 'Weighted Avg Cost (Rs.)', 'Total Valuation (Rs.)'
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.height = 26;

    let totalValuationSum = 0;
    materials.forEach(m => {
      const stock = Number(m.currentStock);
      const avgCost = Number(m.weightedAvgCost);
      const valuation = stock * avgCost;
      totalValuationSum += valuation;

      sheet.addRow([
        m.name,
        m.category ? m.category.name : 'N/A',
        m.unit,
        stock,
        Number(m.minStockLevel),
        avgCost,
        Number(valuation.toFixed(2)),
      ]);
    });

    // Summary Totals Row
    const totalRow = sheet.addRow([
      'TOTAL INVENTORY VALUATION', '', '', '', '', '', Number(totalValuationSum.toFixed(2))
    ]);
    totalRow.font = { bold: true, color: { argb: 'FF172B4D' }, size: 10 };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' },
    };
    totalRow.height = 24;

    sheet.columns.forEach(col => { col.width = 18; });
    sheet.getColumn(1).width = 26;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="DP_ENTERPRISES_Inventory_Report.xlsx"');

    await workbook.xlsx.write(res);
  }
}

module.exports = new ExcelService();
