const ExcelJS = require('exceljs');

class ExcelService {
  /**
   * Generates Order Profit Report in Excel
   */
  async exportOrderCostingReport(orderCostings, res) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'GarmentFlow ERP';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Order Costing & Profit');

    // Title Block
    sheet.mergeCells('A1:L1');
    sheet.getCell('A1').value = 'GARMENTFLOW - ORDER COSTING & PROFITABILITY REPORT';
    sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF172B4D' },
    };
    sheet.getRow(1).height = 30;

    // Header Row
    const headers = [
      'Order #', 'Company', 'Title', 'Status', 'Pieces',
      'Revenue (Rs.)', 'Material Cost', 'Labour Cost', 'Direct Expenses',
      'Total Cost', 'Net Profit', 'Margin (%)'
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };
    headerRow.height = 24;

    // Data rows
    orderCostings.forEach(item => {
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

    // Formatting widths
    sheet.columns.forEach(col => {
      col.width = 16;
    });
    sheet.getColumn(1).width = 15;
    sheet.getColumn(2).width = 24;
    sheet.getColumn(3).width = 24;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="GarmentFlow_Orders_Profit_Report.xlsx"');

    await workbook.xlsx.write(res);
  }

  /**
   * Generates Inventory Stock Report in Excel
   */
  async exportInventoryReport(materials, res) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inventory Valuation');

    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'GARMENTFLOW - RAW MATERIALS INVENTORY & VALUATION';
    sheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF172B4D' },
    };
    sheet.getRow(1).height = 30;

    const headers = [
      'Material Name', 'Category', 'Unit', 'Current Stock',
      'Min Level', 'Weighted Avg Cost (Rs.)', 'Total Valuation (Rs.)'
    ];
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };

    materials.forEach(m => {
      const stock = Number(m.currentStock);
      const avgCost = Number(m.weightedAvgCost);
      const valuation = stock * avgCost;

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

    sheet.columns.forEach(col => { col.width = 18; });
    sheet.getColumn(1).width = 24;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="GarmentFlow_Inventory_Report.xlsx"');

    await workbook.xlsx.write(res);
  }
}

module.exports = new ExcelService();
