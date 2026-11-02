const PDFDocument = require('pdfkit');
const prisma = require('../config/database');

class PdfService {
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

    // Fetch shop settings
    const settings = await prisma.applicationSetting.findMany({
      where: {
        settingKey: {
          in: ['shop_name', 'shop_address', 'shop_phone', 'shop_email', 'shop_gstin', 'gst_enabled']
        }
      }
    });

    const shop = {};
    settings.forEach(s => { shop[s.settingKey] = s.settingValue; });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);

    doc.pipe(res);

    // --- Header ---
    doc.fillColor('#172B4D').fontSize(22).font('Helvetica-Bold').text('GARMENTFLOW', 40, 40);
    doc.fillColor('#4B5563').fontSize(9).font('Helvetica').text('Garment Manufacturing & Business Management', 40, 65);

    doc.fillColor('#1F2937').fontSize(10).font('Helvetica-Bold').text(shop.shop_name || 'GarmentFlow Manufacturing', 40, 85);
    doc.font('Helvetica').fontSize(9).fillColor('#4B5563')
      .text(shop.shop_address || '', 40, 98)
      .text(`Phone: ${shop.shop_phone || 'N/A'} | Email: ${shop.shop_email || 'N/A'}`, 40, 110);
    if (shop.shop_gstin) {
      doc.text(`GSTIN: ${shop.shop_gstin}`, 40, 122);
    }

    // Top Right Invoice Box
    doc.rect(380, 40, 175, 80).fill('#F5F7FA').stroke('#DBEAFE');
    doc.fillColor('#2563EB').fontSize(14).font('Helvetica-Bold').text('TAX INVOICE', 390, 50);
    doc.fillColor('#1F2937').fontSize(9).font('Helvetica')
      .text(`Invoice No: ${invoice.invoiceNumber}`, 390, 70)
      .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString('en-IN')}`, 390, 83)
      .text(`Order Ref: ${invoice.order.orderNumber}`, 390, 96)
      .text(`Status: ${invoice.status}`, 390, 109);

    // Separator line
    doc.moveTo(40, 140).lineTo(555, 140).strokeColor('#E5E7EB').stroke();

    // Bill To Section
    doc.fillColor('#172B4D').fontSize(10).font('Helvetica-Bold').text('BILL TO:', 40, 150);
    doc.fillColor('#1F2937').fontSize(10).text(invoice.company.name, 40, 165);
    doc.font('Helvetica').fontSize(9).fillColor('#4B5563')
      .text(`Attn: ${invoice.company.contactPerson || 'Purchasing Team'}`, 40, 178)
      .text(`Phone: ${invoice.company.phone || 'N/A'} | Email: ${invoice.company.email || 'N/A'}`, 40, 190)
      .text(`Address: ${invoice.company.address || 'N/A'}`, 40, 202);
    if (invoice.company.gstin) {
      doc.text(`Client GSTIN: ${invoice.company.gstin}`, 40, 214);
    }

    // Table Header
    const tableTop = 235;
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
      // Row background
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
      .text(invoice.notes || 'Goods once delivered in good condition cannot be returned.', 40, currentY - 15, { width: 280 })
      .text(invoice.terms || 'Payment terms: Balance payable upon delivery or within agreed credit terms.', 40, currentY, { width: 280 });

    // Footer signature
    const footerY = 740;
    doc.moveTo(380, footerY).lineTo(530, footerY).strokeColor('#9CA3AF').stroke();
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#1F2937').text('Authorized Signatory', 410, footerY + 8);
    doc.font('Helvetica').fontSize(8).fillColor('#9CA3AF').text('Generated by GarmentFlow System', 40, footerY + 25);

    doc.end();
  }
}

module.exports = new PdfService();
