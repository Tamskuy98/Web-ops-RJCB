const path = require("path");
const PDFDocument = require("pdfkit");
const {
  formatCurrency,
  formatDateLong,
  formatDateShort,
  formatDateTimeLong,
} = require("./formatters");
const {
  COLORS,
  drawBarChart,
  drawLineChart,
  drawGroupedBarChart,
  drawPercentageBars,
  drawDebtRatioGauge,
} = require("./pdfCharts");

const MARGIN = 40;
const PAGE_WIDTH = 595.28; // A4 portrait
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const HEADER_BOTTOM_Y = 148;
const FOOTER_TOP_Y = PAGE_HEIGHT - 50;
const LOGO_PATH = path.join(__dirname, "..", "assets", "logo.png");

const COMPANY_NAME = "UMKM RAJACIRENGBEKASI";
const COMPANY_UNIT =
  "Pup Sektor V Blok P9 No. 30 Kec.Babelan, Kel.Bahagia Bekasi Utara";

function drawHeader(doc, period, generatedAt) {
  const top = MARGIN;
  const textX = MARGIN + 60;
  try {
    doc.image(LOGO_PATH, MARGIN, top + 2, { width: 48, height: 48 });
  } catch (err) {
    // Logo optional: keep the report generation resilient if the asset is missing
  }

  doc.font("Helvetica-Bold").fontSize(15).fillColor(COLORS.text);
  doc.text("LAPORAN KEUANGAN", textX, top);
  doc.fontSize(12).text(COMPANY_NAME, textX, top + 18);
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted);
  doc.text(COMPANY_UNIT, textX, top + 34);

  const periodLabel =
    period.startDate && period.endDate
      ? `Periode: ${formatDateLong(period.startDate)} - ${formatDateLong(period.endDate)}`
      : "Periode: Seluruh data (tidak ada filter tanggal)";
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);
  doc.text(periodLabel, MARGIN, top + 58);
  doc
    .fillColor(COLORS.muted)
    .text(`Dibuat pada: ${formatDateTimeLong(generatedAt)}`, MARGIN, top + 72);

  doc
    .moveTo(MARGIN, HEADER_BOTTOM_Y)
    .lineTo(PAGE_WIDTH - MARGIN, HEADER_BOTTOM_Y)
    .strokeColor(COLORS.grid)
    .lineWidth(1)
    .stroke();
  doc.fillColor(COLORS.text);
}

function drawSectionTitle(doc, title, y) {
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.primary);
  doc.text(title, MARGIN, y);
  doc.fillColor(COLORS.text);
  return y + 16;
}

// Page-breaks only when the upcoming block genuinely doesn't fit; redraws the
// repeating header on the new page. This is what keeps sections flowing
// continuously instead of forcing a new page per section/table.
function ensureSpace(doc, currentY, neededHeight, period) {
  if (currentY + neededHeight > FOOTER_TOP_Y) {
    doc.addPage();
    drawHeader(doc, period, new Date());
    return HEADER_BOTTOM_Y + 14;
  }
  return currentY;
}

function drawSummaryCards(doc, summary, startY, period) {
  let y = ensureSpace(doc, startY, 190, period);
  y = drawSectionTitle(doc, "RINGKASAN KEUANGAN", y);

  const cards = [
    {
      label: "Total Saldo ( Cashflow )",
      value: summary.totalCashflow,
      source:
        "Total saldo (Cash flow) sebagai rujukan perhitungan pembagian hasil",
    },
    {
      label: "Saldo Cash (Belum Disetor)",
      value: summary.cashflowBelumDisetor,
      source:
        "Total saldo saat ini (cashflow) dari penjualan yang belum disetor ke owner",
    },
    {
      label: "Saldo Cash (Sudah Disetor)",
      value: summary.cashflowSudahDisetor,
      source:
        "Total saldo saat ini (cashflow) dari penjualan yang telah disetor ke owner",
    },
    {
      label: "QRIS",
      value: summary.cashflowQris,
      source: "Total saldo qris saat ini (cashflow) dari penjualan",
    },
    {
      label: "Total Pendapatan Kotor",
      value: summary.totalPendapatanKotor,
      source:
        "Total pendapatan kotor dari penjualan yang belum dikurangi biaya pengeluaran",
    },
    {
      label: "Total Pendapatan Bersih (Profit)",
      value: summary.totalPendapatanBersih,
      source:
        "Total pendapatan bersih (profit/margin) dari penjualan yang belum dikurangi biaya pengeluaran",
    },
    {
      label: "Total Produk (satuan) Terjual",
      value: summary.totalPcsTerjual,
      source: "Total produk (satuan) terjual dari penjualan",
      isQty: true,
    },
    {
      label: "Total Biaya Supply",
      value: summary.totalBiayaSupply,
      source: "Total uang keluar untuk biaya restock",
    },
    {
      label: "Total Biaya Operasional",
      value: summary.totalBiayaOperasional,
      source: "Total uang keluar untuk biaya operasional",
    },
    {
      label: "Total Beban Hutang (sisa hutang)",
      value: summary.totalHutangBelumLunas,
      source: "Total hutang yang belum dilunasi dari biaya pengeluaran",
    },
  ];

  const cols = 3;
  const gap = 7;
  const cardWidth = (CONTENT_WIDTH - gap * (cols - 1)) / cols;
  const cardHeight = 48;

  cards.forEach((card, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + col * (cardWidth + gap);
    const cy = y + row * (cardHeight + gap);

    doc
      .rect(x, cy, cardWidth, cardHeight)
      .fillAndStroke("#f9fafb", COLORS.grid);
    doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted);
    doc.text(card.label, x + 7, cy + 5, { width: cardWidth - 14 });
    doc.font("Helvetica-Bold").fontSize(10.5).fillColor(COLORS.text);
    doc.text(
      card.isQty
        ? `${card.value.toLocaleString("id-ID")} pcs`
        : formatCurrency(card.value),
      x + 7,
      cy + 17,
      { width: cardWidth - 14 },
    );
    doc.font("Helvetica").fontSize(5.5).fillColor(COLORS.muted);
    doc.text(card.breakdown || `sumber: ${card.source}`, x + 7, cy + 34, {
      width: cardWidth - 14,
    });
  });

  const rows = Math.ceil(cards.length / cols);
  return y + rows * (cardHeight + gap) + 8;
}

// Draws two same-size charts side by side with a vertical divider matching
// the chart row height, so left/right charts line up exactly.
function drawChartRow(doc, { y, height, leftDrawer, rightDrawer }) {
  const colGap = 20;
  const colWidth = (CONTENT_WIDTH - colGap) / 2;
  const leftX = MARGIN;
  const rightX = MARGIN + colWidth + colGap;

  leftDrawer(doc, { x: leftX, y, width: colWidth, height });
  rightDrawer(doc, { x: rightX, y, width: colWidth, height });

  const dividerX = MARGIN + colWidth + colGap / 2;
  doc
    .moveTo(dividerX, y)
    .lineTo(dividerX, y + height)
    .strokeColor(COLORS.grid)
    .lineWidth(1)
    .stroke();

  return y + height;
}

// Section 1's 4 daily charts as a compact 2x2 grid (no expense chart here -
// that one moved to the fund-usage section per the requested order).
function drawChartsGrid(doc, dailyBreakdown, startY, period) {
  const rowHeight = 150;
  let y = ensureSpace(doc, startY, rowHeight * 2 + 8, period);

  const formatChartDate = (date) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(date));
  const toSeries = (key) =>
    dailyBreakdown
      .filter((day) => day.grossIncome > 0)
      .map((day) => ({ label: formatChartDate(day.date), value: day[key] }));
  const cashflowSeries = dailyBreakdown
    .map((d, i) => ({
      label: formatChartDate(d.date),
      valueA: d.cashIn,
      valueB: d.cashOut,
    }))
    .filter((day) => day.valueA !== 0 || day.valueB !== 0);

  y = drawChartRow(doc, {
    y,
    height: rowHeight,
    leftDrawer: (doc, box) =>
      drawGroupedBarChart(doc, {
        ...box,
        title: "1. Chart Cashflow Harian",
        data: cashflowSeries,
        seriesA: "IN",
        seriesB: "OUT",
        colorA: COLORS.secondary,
        colorB: COLORS.primary,
      }),
    rightDrawer: (doc, box) =>
      drawBarChart(doc, {
        ...box,
        title: "2. Chart Pendapatan Harian Kotor",
        data: toSeries("grossIncome"),
        color: COLORS.secondary,
      }),
  });

  y += 8;

  y = drawChartRow(doc, {
    y,
    height: rowHeight,
    leftDrawer: (doc, box) =>
      drawLineChart(doc, {
        ...box,
        title: "3. Chart Pendapatan Harian Bersih",
        data: toSeries("netIncome"),
        color: COLORS.success,
      }),
    rightDrawer: (doc, box) =>
      drawBarChart(doc, {
        ...box,
        title: "4. Chart Jumlah Terjual (Pcs)",
        data: toSeries("quantity"),
        color: COLORS.warning,
      }),
  });

  return y + 10;
}

// Bagi hasil (profit share) footer: percentage + nominal per pihak, computed
// from the same "Akumulasi Total Saldo (Cash Flow)" basis as ProfitSharePage.
function drawProfitShareSection(doc, profitShare, startY, period) {
  const blockHeight = 18 + 18 + profitShare.items.length * 24 + 10;
  let y = ensureSpace(doc, startY, blockHeight, period);
  y = drawSectionTitle(doc, "PEMBAGIAN HASIL (PROFIT SHARE)", y);

  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
  doc.text(
    `Basis Pembagian: Akumulasi Total Saldo (Cash Flow) = ${formatCurrency(profitShare.totalCashflow)}`,
    MARGIN,
    y,
  );
  y += 16;

  const colors = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.success,
    COLORS.warning,
  ];
  const items = profitShare.items.map((item, i) => ({
    ...item,
    color: colors[i % colors.length],
  }));

  y =
    drawPercentageBars(doc, {
      x: MARGIN,
      y,
      width: CONTENT_WIDTH,
      title: "",
      items,
    }) + 6;

  return y + 8;
}

function drawFundUsageSection(
  doc,
  dailyBreakdown,
  cashflowUsage,
  debtRatio,
  startY,
  period,
) {
  const expenseChartHeight = 150;
  let y = ensureSpace(doc, startY, 20 + expenseChartHeight + 20, period);
  y = drawSectionTitle(doc, "ANALISIS PENGGUNAAN DANA", y);

  const labels = dailyBreakdown.map((d) => formatDateShort(d.date));
  const expenseData = dailyBreakdown.map((d, i) => ({
    label: labels[i],
    valueA: d.operationalCost,
    valueB: d.restockCost,
  }));
  const totalOps = dailyBreakdown.reduce((s, d) => s + d.operationalCost, 0);
  const totalRestock = dailyBreakdown.reduce((s, d) => s + d.restockCost, 0);
  y = drawGroupedBarChart(doc, {
    x: MARGIN,
    y,
    width: CONTENT_WIDTH,
    height: expenseChartHeight,
    title: "Chart Biaya Pengeluaran",
    data: expenseData,
    seriesA: "Operasional",
    seriesB: "Restock",
  });
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.text);
  doc.text(
    `Rincian: Operasional:${formatCurrency(totalOps)} Restock:${formatCurrency(totalRestock)} | Total Pengeluaran: ${formatCurrency(totalOps + totalRestock)}`,
    MARGIN,
    y,
  );
  y += 16;

  // 4.1 Persentase penggunaan dana
  const usageBlockHeight = 18 + 18 + cashflowUsage.items.length * 24 + 10;
  y = ensureSpace(doc, y, usageBlockHeight, period);
  y = drawSectionTitle(doc, "PERSENTASE PENGGUNAAN DANA CASHFLOW", y);
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
  doc.text(
    `Total Pendapatan Kotor: ${formatCurrency(cashflowUsage.totalCashflow)}`,
    MARGIN,
    y,
  );
  y += 16;

  const colors = [
    COLORS.warning,
    COLORS.secondary,
    COLORS.primary,
    COLORS.success,
  ];
  const items = cashflowUsage.items.map((item, i) => ({
    ...item,
    color: colors[i % colors.length],
  }));
  y =
    drawPercentageBars(doc, {
      x: MARGIN,
      y,
      width: CONTENT_WIDTH,
      title: "",
      items,
    }) + 6;

  // 4.2 Rasio hutang
  const ratioBlockHeight = 18 + 13 * 3 + 65;
  y = ensureSpace(doc, y, ratioBlockHeight, period);
  y = drawSectionTitle(doc, "RASIO HUTANG", y);
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);
  doc.text(
    `Total Cashflow : ${formatCurrency(debtRatio.totalCashflow)}`,
    MARGIN,
    y,
  );
  doc.text(
    `Total Hutang   : ${formatCurrency(debtRatio.totalHutang)}`,
    MARGIN,
    y + 13,
  );
  doc.text(
    `Rasio Hutang   : ${debtRatio.ratioPercent.toFixed(1)}%`,
    MARGIN,
    y + 26,
  );
  doc
    .font("Helvetica-Bold")
    .fillColor(
      debtRatio.riskStatus === "AMAN" ? COLORS.success : COLORS.primary,
    );
  doc.text(`Status Risiko  : ${debtRatio.riskStatus}`, MARGIN, y + 39);
  doc.fillColor(COLORS.text);
  y += 76;

  y = drawDebtRatioGauge(doc, {
    x: MARGIN,
    y,
    width: CONTENT_WIDTH,
    safeLimitPercent: debtRatio.safeLimitPercent,
    currentPercent: debtRatio.ratioPercent,
  });

  return y + 8;
}

// Generic paginated table renderer used by all Section 5 detail tables.
// Continues on the current page when there's room; only page-breaks when the
// title + header + at least one row (or the empty message) won't fit, so a
// table header is never left alone at the bottom of a page.
function drawTable(
  doc,
  { title, columns, rows, period, emptyMessage, startY },
) {
  const rowHeight = 14;
  const headerHeight = 15;
  const titleHeight = 16;
  const minBlock =
    titleHeight +
    headerHeight +
    (rows && rows.length ? rowHeight : rowHeight * 2);

  let y = ensureSpace(doc, startY, minBlock, period);
  y = drawSectionTitle(doc, title, y);

  const drawTableHeader = () => {
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#fff");
    doc.rect(MARGIN, y, CONTENT_WIDTH, headerHeight).fill(COLORS.text);
    let cx = MARGIN;
    columns.forEach((col) => {
      doc.fillColor("#fff").text(col.label, cx + 3, y + 4, {
        width: col.width - 6,
        align: col.align || "left",
      });
      cx += col.width;
    });
    doc.fillColor(COLORS.text);
    y += headerHeight;
  };

  drawTableHeader();

  if (!rows || rows.length === 0) {
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted);
    doc.text(
      emptyMessage || "Belum ada transaksi pada periode ini.",
      MARGIN,
      y + 8,
      {
        width: CONTENT_WIDTH,
        align: "center",
      },
    );
    return y + 26;
  }

  doc.font("Helvetica").fontSize(7);
  rows.forEach((row, idx) => {
    if (y + rowHeight > FOOTER_TOP_Y) {
      doc.addPage();
      drawHeader(doc, period, new Date());
      y = HEADER_BOTTOM_Y + 14;
      drawTableHeader();
    }

    if (idx % 2 === 0) {
      doc.rect(MARGIN, y, CONTENT_WIDTH, rowHeight).fill("#f9fafb");
    }
    doc.fillColor(COLORS.text);

    let cx = MARGIN;
    columns.forEach((col) => {
      let value = col.render ? col.render(row) : row[col.key];
      if (col.key === "refId" && value != null) {
        value = String(value).toLowerCase();
      }
      doc.text(String(value ?? "-"), cx + 3, y + 3, {
        width: col.width - 6,
        align: col.align || "left",
      });
      cx += col.width;
    });
    y += rowHeight;
  });

  return y + 10;
}

function drawFooters(doc) {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;
  const footerY = PAGE_HEIGHT - MARGIN - 10;

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const pageNumber = i - range.start + 1;
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted);
    doc.text(
      `Business Report System - Laporan Keuangan | Halaman ${pageNumber} dari ${totalPages}`,
      MARGIN,
      footerY,
      { width: CONTENT_WIDTH, align: "center" },
    );
  }
}

/**
 * Builds the financial report PDF and pipes it to the given writable stream (res).
 */
function buildFinancialReportPdf(res, reportData) {
  const doc = new PDFDocument({
    margin: MARGIN,
    size: "A4",
    bufferPages: true,
  });
  const generatedAt = new Date();

  res.setHeader("Content-Type", "application/pdf");
  const { startDate, endDate } = reportData.period;
  const filenameSuffix =
    startDate && endDate ? `${startDate}_${endDate}` : "semua-periode";
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=laporan-keuangan-${filenameSuffix}.pdf`,
  );
  doc.pipe(res);

  drawHeader(doc, reportData.period, generatedAt);
  let y = drawSummaryCards(
    doc,
    reportData.summary,
    HEADER_BOTTOM_Y + 14,
    reportData.period,
  );
  y = drawChartsGrid(doc, reportData.dailyBreakdown, y, reportData.period);
  y = drawFundUsageSection(
    doc,
    reportData.dailyBreakdown,
    reportData.cashflowUsage,
    reportData.debtRatio,
    y,
    reportData.period,
  );

  y = drawTable(doc, {
    title: "DETAIL TRANSAKSI SALDO",
    period: reportData.period,
    startY: y,
    columns: [
      {
        key: "date",
        label: "Tanggal",
        width: 42,
        render: (r) => formatDateShort(r.date),
      },
      { key: "refId", label: "Referensi", width: 72 },
      { key: "modul", label: "Modul", width: 50 },
      { key: "type", label: "Tipe", width: 38 },
      { key: "typePayment", label: "Metode Bayar", width: 68 },
      {
        key: "before",
        label: "Saldo Sebelum",
        width: 70,
        align: "right",
        render: (r) => formatCurrency(r.before),
      },
      {
        key: "total",
        label: "Nominal",
        width: 60,
        align: "right",
        render: (r) => formatCurrency(r.total),
      },
      {
        key: "after",
        label: "Saldo Sesudah",
        width: 70,
        align: "right",
        render: (r) => formatCurrency(r.after),
      },
      // { key: "jenisSaldo", label: "Jenis Saldo", width: 70 },
      { key: "status", label: "Status", width: 45 },
    ],
    rows: reportData.detailSaldo,
    emptyMessage:
      "Belum ada transaksi saldo pada periode ini. (Catatan: log transaksi saat ini hanya mencatat modul penjualan.)",
  });

  y = drawTable(doc, {
    title: "DETAIL DATA PENJUALAN",
    period: reportData.period,
    startY: y,
    columns: [
      {
        key: "date",
        label: "Tanggal",
        width: 52,
        render: (r) => formatDateShort(r.date),
      },
      { key: "refId", label: "ID Transaksi", width: 70 },
      { key: "product", label: "Produk", width: 130 },
      { key: "quantity", label: "Qty", width: 32, align: "right" },
      {
        key: "priceSell",
        label: "Harga Jual",
        width: 75,
        align: "right",
        render: (r) => formatCurrency(r.priceSell),
      },
      {
        key: "total",
        label: "Total",
        width: 75,
        align: "right",
        render: (r) => formatCurrency(r.total),
      },
      // { key: "jenisSaldo", label: "Jenis Saldo", width: 80 },
      {
        key: "typePayment",
        label: "Metode Bayar",
        width: 81,
        render: (r) => String(r.typePayment ?? "-").toUpperCase(),
      },
    ],
    rows: reportData.detailSales,
    emptyMessage: "Belum ada transaksi penjualan pada periode ini.",
  });

  y = drawTable(doc, {
    title: " DETAIL DATA BELANJA OPERASIONAL",
    period: reportData.period,
    startY: y,
    columns: [
      {
        key: "date",
        label: "Tanggal",
        width: 48,
        render: (r) => formatDateShort(r.date),
      },
      { key: "refId", label: "Referensi", width: 55 },
      { key: "name", label: "Nama Barang", width: 120 },
      { key: "quantity", label: "Qty", width: 32, align: "right" },
      {
        key: "unitPrice",
        label: "Harga Satuan",
        width: 65,
        align: "right",
        render: (r) => formatCurrency(r.unitPrice),
      },
      {
        key: "total",
        label: "Total",
        width: 65,
        align: "right",
        render: (r) => formatCurrency(r.total),
      },
      { key: "typePayment", label: "Metode Bayar", width: 80 },
      { key: "status", label: "Status", width: 50 },
    ],
    rows: reportData.detailOperational,
    emptyMessage: "Belum ada transaksi belanja operasional pada periode ini.",
  });

  y = drawTable(doc, {
    title: "5.4 DETAIL DATA RESTOCK",
    period: reportData.period,
    startY: y,
    columns: [
      {
        key: "date",
        label: "Tanggal",
        width: 42,
        render: (r) => formatDateShort(r.date),
      },
      { key: "refId", label: "Referensi", width: 55 },
      { key: "supplier", label: "Supplier", width: 60 },
      { key: "product", label: "Produk", width: 85 },
      { key: "quantity", label: "Qty", width: 22, align: "right" },
      {
        key: "price",
        label: "Harga Satuan",
        width: 58,
        align: "right",
        render: (r) => formatCurrency(r.price),
      },
      {
        key: "total",
        label: "Total",
        width: 58,
        align: "right",
        render: (r) => formatCurrency(r.total),
      },
      { key: "typePayment", label: "Metode Bayar", width: 85 },
      { key: "status", label: "Status", width: 50 },
    ],
    rows: reportData.detailRestock,
    emptyMessage: "Belum ada transaksi restock pada periode ini.",
  });

  y = drawTable(doc, {
    title: "5.5 DETAIL DATA HUTANG",
    period: reportData.period,
    startY: y,
    columns: [
      {
        key: "date",
        label: "Tanggal",
        width: 55,
        render: (r) => formatDateShort(r.date),
      },
      { key: "refId", label: "Referensi", width: 70 },
      { key: "party", label: "Pihak Terkait", width: 110 },
      {
        key: "totalDebt",
        label: "Total Hutang",
        width: 80,
        align: "right",
        render: (r) => formatCurrency(r.totalDebt),
      },
      {
        key: "paid",
        label: "Nominal Pembayaran",
        width: 80,
        align: "right",
        render: (r) => formatCurrency(r.paid),
      },
      {
        key: "outstandingPay",
        label: "Sisa Hutang",
        width: 75,
        align: "right",
        render: (r) => formatCurrency(r.outstandingPay),
      },
      { key: "status", label: "Status", width: 45 },
    ],
    rows: reportData.detailDebt,
    emptyMessage: "Belum ada transaksi hutang pada periode ini.",
  });

  drawProfitShareSection(doc, reportData.profitShare, y, reportData.period);

  drawFooters(doc);
  doc.end();
}

module.exports = { buildFinancialReportPdf };
