const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const prisma = require('../config/database');

class PdfService {
  /**
   * Helper to retrieve company branding settings
   */
  async getCompanySettings() {
    const settings = await prisma.applicationSetting.findMany({
      where: {
        settingKey: {
          in: ['shop_name', 'shop_address', 'shop_phone', 'shop_email', 'shop_gstin', 'gst_enabled', 'shop_logo'],
        },
      },
    });

    const shop = {};
    settings.forEach((s) => {
      shop[s.settingKey] = s.settingValue;
    });

    return {
      shop_name: (shop.shop_name && shop.shop_name.trim()) || 'DP ENTERPRISES',
      shop_address: (shop.shop_address && shop.shop_address.trim()) || '',
      shop_phone: (shop.shop_phone && shop.shop_phone.trim()) || '',
      shop_email: (shop.shop_email && shop.shop_email.trim()) || '',
      shop_gstin: (shop.shop_gstin && shop.shop_gstin.trim()) || '',
      shop_logo: (shop.shop_logo && shop.shop_logo.trim()) || '',
      gst_enabled: shop.gst_enabled === 'true',
    };
  }

  /**
   * Draw header with logo or clean typographic monogram identity
   */
  drawCompanyHeader(doc, shop, startX = 40, startY = 40) {
    let logoDrawn = false;

    if (shop.shop_logo) {
      const filename = path.basename(shop.shop_logo);
      const localLogoPath = path.resolve(__dirname, '../../uploads', filename);
      if (fs.existsSync(localLogoPath)) {
        try {
          doc.image(localLogoPath, startX, startY, { fit: [130, 45] });
          logoDrawn = true;
        } catch (e) {
          console.error('Error drawing logo in PDF:', e.message);
        }
      }
    }

    if (!logoDrawn) {
      // Clean typographic DP ENTERPRISES identity emblem
      doc.roundedRect(startX, startY, 36, 36, 6).fill('#172B4D');
      doc.fillColor('#60A5FA').fontSize(16).font('Helvetica-Bold').text('DP', startX + 6, startY + 9);
      doc.fillColor('#172B4D').fontSize(18).font('Helvetica-Bold').text(shop.shop_name, startX + 46, startY + 4);
      doc.fillColor('#6B7280').fontSize(8.5).font('Helvetica').text('Garment Manufacturing, Bulk Order & Stitching Management', startX + 46, startY + 24);
    } else {
      doc.fillColor('#172B4D').fontSize(16).font('Helvetica-Bold').text(shop.shop_name, startX + 140, startY + 4);
      doc.fillColor('#6B7280').fontSize(8.5).font('Helvetica').text('Garment Manufacturing & Business Management', startX + 140, startY + 24);
    }

    // Company Contact & Address Details (rendered only if actually configured by owner)
    let infoY = startY + 44;
    doc.font('Helvetica').fontSize(8.5).fillColor('#4B5563');

    if (shop.shop_address) {
      doc.text(shop.shop_address, startX, infoY, { width: 320 });
      infoY += 12;
    }

    const contacts = [];
    if (shop.shop_phone) contacts.push(`Phone: ${shop.shop_phone}`);
    if (shop.shop_email) contacts.push(`Email: ${shop.shop_email}`);
    if (contacts.length > 0) {
      doc.text(contacts.join(' | '), startX, infoY);
      infoY += 12;
    }

    if (shop.shop_gstin) {
      doc.text(`GSTIN: ${shop.shop_gstin}`, startX, infoY);
      infoY += 12;
    }

    return Math.max(infoY, startY + 50);
  }

  /**
   * Generates a PDF invoice stream
   */
  async generateInvoicePdf(invoiceId, res) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(invoiceId) },
      include: {
        order: true,
        company: true,
        items: true,
      },
    });

    if (!invoice) {
      throw new Error(`Invoice with ID ${invoiceId} not found`);
    }

    const shop = await this.getCompanySettings();
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);

    doc.pipe(res);

    // --- Header ---
    const headerBottom = this.drawCompanyHeader(doc, shop, 40, 40);

    // Top Right Invoice Box
    doc.rect(380, 40, 175, 82).fill('#F5F7FA').stroke('#DBEAFE');
    doc.fillColor('#2563EB').fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 390, 50);
    doc.fillColor('#1F2937').fontSize(9).font('Helvetica')
      .text(`Invoice No: ${invoice.invoiceNumber}`, 390, 70)
      .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 390, 83)
      .text(`Order Ref: ${invoice.order.orderNumber}`, 390, 96)
      .text(`Status: ${invoice.status}`, 390, 109);

    // Separator line
    const sepY = Math.max(headerBottom + 12, 136);
    doc.moveTo(40, sepY).lineTo(555, sepY).strokeColor('#E5E7EB').stroke();

    // Bill To Section
    const billToY = sepY + 10;
    doc.fillColor('#172B4D').fontSize(10).font('Helvetica-Bold').text('BILL TO:', 40, billToY);
    doc.fillColor('#1F2937').fontSize(10).text(invoice.company.name, 40, billToY + 14);
    doc.font('Helvetica').fontSize(9).fillColor('#4B5563');

    let clientY = billToY + 28;
    if (invoice.company.contactPerson) {
      doc.text(`Attn: ${invoice.company.contactPerson}`, 40, clientY);
      clientY += 12;
    }
    const clientContacts = [];
    if (invoice.company.phone) clientContacts.push(`Phone: ${invoice.company.phone}`);
    if (invoice.company.email) clientContacts.push(`Email: ${invoice.company.email}`);
    if (clientContacts.length > 0) {
      doc.text(clientContacts.join(' | '), 40, clientY);
      clientY += 12;
    }
    if (invoice.company.address) {
      doc.text(`Address: ${invoice.company.address}`, 40, clientY, { width: 320 });
      clientY += 12;
    }
    if (invoice.company.gstin) {
      doc.text(`Client GSTIN: ${invoice.company.gstin}`, 40, clientY);
      clientY += 12;
    }

    // Table Header
    const tableTop = Math.max(clientY + 15, 235);
    doc.rect(40, tableTop, 515, 22).fill('#172B4D');
    doc.fillColor('#FFFFFF').fontSize(9).font('Helvetica-Bold')
      .text('#', 50, tableTop + 6)
      .text('Item & Description', 80, tableTop + 6)
      .text('Qty', 320, tableTop + 6, { width: 50, align: 'right' })
      .text('Unit Rate (Rs.)', 380, tableTop + 6, { width: 80, align: 'right' })
      .text('Amount (Rs.)', 470, tableTop + 6, { width: 75, align: 'right' });

    let currentY = tableTop + 26;
    doc.font('Helvetica').fontSize(9).fillColor('#1F2937');

    let idx = 1;
    for (const item of invoice.items) {
      if (idx % 2 === 0) {
        doc.rect(40, currentY - 4, 515, 20).fill('#F9FAFB');
      }
      doc.fillColor('#1F2937')
        .text(String(idx), 50, currentY)
        .text(item.description, 80, currentY, { width: 230 })
        .text(`${Number(item.quantity)} ${item.unit || 'PCS'}`, 320, currentY, { width: 50, align: 'right' })
        .text(Number(item.unitPrice).toFixed(2), 380, currentY, { width: 80, align: 'right' })
        .text(Number(item.totalAmount).toFixed(2), 470, currentY, { width: 75, align: 'right' });

      currentY += 22;
      idx++;
    }

    doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor('#E5E7EB').stroke();
    currentY += 15;

    // Totals Box (Right aligned)
    const totalsX = 350;
    doc.fontSize(9).font('Helvetica')
      .text('Subtotal:', totalsX, currentY, { width: 100, align: 'left' })
      .text(`Rs. ${Number(invoice.subtotal).toFixed(2)}`, 450, currentY, { width: 95, align: 'right' });
    currentY += 16;

    if (Number(invoice.discount) > 0) {
      doc.text('Discount:', totalsX, currentY, { width: 100, align: 'left' })
        .text(`- Rs. ${Number(invoice.discount).toFixed(2)}`, 450, currentY, { width: 95, align: 'right' });
      currentY += 16;
    }

    if (Number(invoice.taxAmount) > 0) {
      doc.text(`Tax / GST (${Number(invoice.taxPercent)}%):`, totalsX, currentY, { width: 100, align: 'left' })
        .text(`Rs. ${Number(invoice.taxAmount).toFixed(2)}`, 450, currentY, { width: 95, align: 'right' });
      currentY += 16;
    }

    doc.rect(totalsX - 5, currentY - 2, 210, 22).fill('#EFF6FF');
    doc.fillColor('#172B4D').font('Helvetica-Bold').fontSize(10)
      .text('Total Invoiced:', totalsX, currentY + 4, { width: 100, align: 'left' })
      .text(`Rs. ${Number(invoice.totalAmount).toFixed(2)}`, 450, currentY + 4, { width: 95, align: 'right' });
    currentY += 28;

    doc.fillColor('#1F2937').font('Helvetica').fontSize(9)
      .text('Payments Received:', totalsX, currentY, { width: 100, align: 'left' })
      .text(`Rs. ${Number(invoice.paidAmount).toFixed(2)}`, 450, currentY, { width: 95, align: 'right' });
    currentY += 18;

    doc.rect(totalsX - 5, currentY - 2, 210, 22).fill('#FEF2F2');
    doc.fillColor('#DC2626').font('Helvetica-Bold').fontSize(10)
      .text('Balance Due:', totalsX, currentY + 4, { width: 100, align: 'left' })
      .text(`Rs. ${Number(invoice.balanceDue).toFixed(2)}`, 450, currentY + 4, { width: 95, align: 'right' });

    // Terms and Notes
    doc.fillColor('#172B4D').font('Helvetica-Bold').fontSize(9).text('Notes & Terms:', 40, currentY - 30);
    doc.font('Helvetica').fontSize(8).fillColor('#6B7280')
      .text(invoice.notes || 'Goods once delivered in good condition are subject to agreed contract.', 40, currentY - 15, { width: 280 })
      .text(invoice.terms || 'Payment terms: Balance payable upon delivery or within agreed credit terms.', 40, currentY, { width: 280 });

    // Footer signature
    const footerY = 740;
    doc.moveTo(370, footerY).lineTo(540, footerY).strokeColor('#9CA3AF').stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1F2937').text(`Authorized Signatory for ${shop.shop_name}`, 370, footerY + 8, { width: 170, align: 'center' });
    doc.font('Helvetica').fontSize(8).fillColor('#9CA3AF').text(`Generated by ${shop.shop_name} – GarmentFlow System`, 40, footerY + 25);

    doc.end();
  }

  /**
   * Generates Executive Profit & Loss Statement PDF
   */
  async generateProfitLossPdf(pnlData, res) {
    const shop = await this.getCompanySettings();
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="DP_ENTERPRISES_Profit_Loss_Report.pdf"');

    doc.pipe(res);

    this.drawCompanyHeader(doc, shop, 40, 40);

    // Title Box
    doc.rect(360, 40, 195, 65).fill('#F5F7FA').stroke('#DBEAFE');
    doc.fillColor('#172B4D').fontSize(12).font('Helvetica-Bold').text('PROFIT & LOSS REPORT', 370, 50);
    doc.fillColor('#4B5563').fontSize(8.5).font('Helvetica')
      .text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 370, 68)
      .text(`Period: ${new Date(pnlData.period.startDate).toLocaleDateString('en-IN')} - ${new Date(pnlData.period.endDate).toLocaleDateString('en-IN')}`, 370, 81);

    doc.moveTo(40, 125).lineTo(555, 125).strokeColor('#E5E7EB').stroke();

    // Summary KPI Block
    let y = 145;
    doc.fillColor('#172B4D').fontSize(12).font('Helvetica-Bold').text('EXECUTIVE FINANCIAL SUMMARY', 40, y);
    y += 20;

    const summary = pnlData.summary;
    const cards = [
      { label: 'Gross Billed Revenue', val: `Rs. ${summary.totalRevenue.toLocaleString('en-IN')}`, color: '#172B4D' },
      { label: 'Total Business Outflows', val: `Rs. ${summary.totalBusinessExpenses.toLocaleString('en-IN')}`, color: '#B45309' },
      { label: 'Net Operating Profit', val: `Rs. ${summary.netOperatingProfit.toLocaleString('en-IN')}`, color: summary.netOperatingProfit >= 0 ? '#16A34A' : '#DC2626' },
      { label: 'Net Operating Margin', val: `${summary.netProfitMargin}%`, color: '#2563EB' },
    ];

    cards.forEach((c, i) => {
      const cardX = 40 + i * 130;
      doc.rect(cardX, y, 120, 50).fill('#F8FAFC').stroke('#E2E8F0');
      doc.fillColor('#64748B').fontSize(7.5).font('Helvetica-Bold').text(c.label.toUpperCase(), cardX + 8, y + 8, { width: 104 });
      doc.fillColor(c.color).fontSize(12).font('Helvetica-Bold').text(c.val, cardX + 8, y + 26);
    });

    y += 70;

    // Labour Capacity Absorption Analysis
    doc.fillColor('#172B4D').fontSize(11).font('Helvetica-Bold').text('LABOUR RECOVERY & ABSORPTION ANALYSIS', 40, y);
    y += 18;

    doc.rect(40, y, 515, 60).fill('#EFF6FF').stroke('#BFDBFE');
    doc.fillColor('#1E40AF').fontSize(9).font('Helvetica-Bold')
      .text(`Total Salaries Disbursed: Rs. ${summary.totalSalaryExpenses.toLocaleString('en-IN')}`, 55, y + 12)
      .text(`Allocated Labour to Active Jobs: Rs. ${summary.totalAllocatedLabourCost.toLocaleString('en-IN')}`, 55, y + 28)
      .text(`Unallocated Labour Overhead: Rs. ${summary.unallocatedLabourCost.toLocaleString('en-IN')} (${summary.labourRecoveryRate}% absorbed)`, 55, y + 44);

    y += 80;

    // Expenses Breakdown Table
    doc.fillColor('#172B4D').fontSize(11).font('Helvetica-Bold').text('CONSOLIDATED EXPENDITURE BY CATEGORY', 40, y);
    y += 16;

    doc.rect(40, y, 515, 20).fill('#172B4D');
    doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold')
      .text('Expense Category', 55, y + 6)
      .text('Amount (Rs.)', 420, y + 6, { width: 120, align: 'right' });
    y += 22;

    doc.font('Helvetica').fontSize(8.5).fillColor('#1F2937');
    if (pnlData.expensesByCategory && pnlData.expensesByCategory.length > 0) {
      pnlData.expensesByCategory.forEach((cat, idx) => {
        if (idx % 2 === 0) doc.rect(40, y - 2, 515, 18).fill('#F9FAFB');
        doc.fillColor('#1F2937')
          .text(cat.category, 55, y + 2)
          .text(`Rs. ${cat.amount.toLocaleString('en-IN')}`, 420, y + 2, { width: 120, align: 'right' });
        y += 18;
      });
    }

    // Footer
    const footerY = 740;
    doc.moveTo(40, footerY).lineTo(555, footerY).strokeColor('#E5E7EB').stroke();
    doc.font('Helvetica').fontSize(8).fillColor('#9CA3AF').text(`Official Executive Statement • ${shop.shop_name} – GarmentFlow ERP System`, 40, footerY + 10);

    doc.end();
  }
}

module.exports = new PdfService();
