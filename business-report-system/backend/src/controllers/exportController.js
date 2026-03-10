const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = require('../prisma/client');

const exportSalesCSV = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { product: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    const header = 'Date,Product,Quantity,Price,Total,Profit\n';
    const rows = sales.map((s) => {
      const date = new Date(s.date).toISOString().split('T')[0];
      return `${date},${s.product.name},${s.quantity},${Number(s.priceSell)},${Number(s.total)},${Number(s.profit)}`;
    }).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
    res.send(header + rows);
  } catch (error) {
    next(error);
  }
};

const exportSalesExcel = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { product: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sales Report');

    sheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Product', key: 'product', width: 30 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Price', key: 'price', width: 18 },
      { header: 'Total', key: 'total', width: 18 },
      { header: 'Profit', key: 'profit', width: 18 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    sales.forEach((s) => {
      sheet.addRow({
        date: new Date(s.date).toISOString().split('T')[0],
        product: s.product.name,
        quantity: s.quantity,
        price: Number(s.priceSell),
        total: Number(s.total),
        profit: Number(s.profit),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

const exportSalesPDF = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') };
    }

    const sales = await prisma.sale.findMany({
      where,
      include: { product: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    doc.pipe(res);

    doc.fontSize(18).text('Sales Report', { align: 'center' });
    if (startDate && endDate) {
      doc.fontSize(10).text(`Period: ${startDate} to ${endDate}`, { align: 'center' });
    }
    doc.moveDown();

    const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit), 0);

    doc.fontSize(11).text(`Total Sales: Rp ${totalSales.toLocaleString('id-ID')}`);
    doc.text(`Total Profit: Rp ${totalProfit.toLocaleString('id-ID')}`);
    doc.text(`Total Transactions: ${sales.length}`);
    doc.moveDown();

    const tableTop = doc.y;
    const cols = [40, 120, 280, 340, 410, 480];
    const headers = ['Date', 'Product', 'Qty', 'Price', 'Total', 'Profit'];

    doc.fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => doc.text(h, cols[i], tableTop, { width: 80 }));

    doc.moveTo(40, tableTop + 15).lineTo(555, tableTop + 15).stroke();

    doc.font('Helvetica').fontSize(8);
    let y = tableTop + 20;

    sales.forEach((s) => {
      if (y > 750) {
        doc.addPage();
        y = 40;
      }
      doc.text(new Date(s.date).toISOString().split('T')[0], cols[0], y, { width: 75 });
      doc.text(s.product.name.substring(0, 22), cols[1], y, { width: 155 });
      doc.text(String(s.quantity), cols[2], y, { width: 55 });
      doc.text(Number(s.priceSell).toLocaleString('id-ID'), cols[3], y, { width: 65 });
      doc.text(Number(s.total).toLocaleString('id-ID'), cols[4], y, { width: 65 });
      doc.text(Number(s.profit).toLocaleString('id-ID'), cols[5], y, { width: 65 });
      y += 15;
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = { exportSalesCSV, exportSalesExcel, exportSalesPDF };
