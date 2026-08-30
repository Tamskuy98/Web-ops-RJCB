const prisma = require("../prisma/client");
const { getCards } = require("./dashboard/cardService");
const { getDailyBreakdown } = require("./dashboard/chartService");
const { getRevenueShare } = require("./reportService");

// NOTE: No existing "safe debt ratio" business rule was found in the project
// (schema/config/services). 30% is used as a conservative default and is
// intentionally isolated here so it can be reviewed/configured by the business
// without touching calculation logic elsewhere.
const DEBT_SAFE_LIMIT_PERCENT = 30;

// Same defaults reportController uses for /report/revenue-share, kept here so
// the PDF's profit-share section matches ProfitSharePage's defaults 1:1.
const DEFAULT_SHARE_PERCENTAGES = {
  ownerPercentage: 30,
  pelakuusahaPercentage: 30,
  pemilikasettetapPercentage: 20,
  pemilikasetmahalPercentage: 20,
};

const buildDateWhere = (startDate, endDate) => {
  if (!startDate || !endDate) return {};
  return {
    date: {
      gte: new Date(startDate),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    },
  };
};

const buildLogTransactionWhere = (startDate, endDate) => {
  if (!startDate || !endDate) return {};
  return {
    created_date: {
      gte: new Date(startDate),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    },
  };
};

// Derives a display-only "Jenis Saldo" label from fields that already exist
// on Hsale (isDeposit/typePayment) - same rule SalesPage.jsx already uses.
const deriveJenisSaldo = (typePayment, isDeposit) => {
  if (typePayment === "Qris") return "QRIS";
  if (isDeposit === "Y") return "Cash S";
  if (isDeposit === "N") return "Cash H";
  return "-";
};

/**
 * Gathers every figure the financial report PDF needs, reusing the same
 * services/formulas the Dashboard already uses (cardService.getCards,
 * chartService daily breakdown) plus the detail records for section 5.
 */
const getFinancialReportData = async ({ startDate, endDate }) => {
  const where = buildDateWhere(startDate, endDate);
  const logWhere = buildLogTransactionWhere(startDate, endDate);

  const [
    cards,
    dailyBreakdown,
    salesDetail,
    operationalDetail,
    restockDetail,
    debtDetail,
    logTransactions,
  ] = await Promise.all([
    getCards(where),
    getDailyBreakdown(where),
    prisma.sale.findMany({
      where,
      include: {
        product: { select: { name: true } },
        headersale: { select: { typePayment: true, isDeposit: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.operational.findMany({
      where,
      include: { opsdetail: true },
      orderBy: { date: "asc" },
    }),
    prisma.restock.findMany({
      where,
      include: {
        restockDetail: { include: { product: { select: { name: true } } } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.debt.findMany({
      where,
      orderBy: { date: "asc" },
    }),
    prisma.logTransaction.findMany({
      where: logWhere,
      orderBy: { created_date: "asc" },
    }),
  ]);

  // ---- Section 2: Ringkasan Keuangan (reuse cardService figures 1:1) ----
  const summary = {
    cashflowBelumDisetor: cards.realtimeCashHold, // Cash Hold => belum disetor
    cashflowSudahDisetor: cards.realtimeCashHand, // Cash Hand => sudah disetor & dipakai
    cashflowQris: cards.realtimeQris,
    totalCashflow:
      cards.realtimeCashHold + cards.realtimeCashHand + cards.realtimeQris,
    totalPendapatanKotor: cards.totalRevenue,
    totalPendapatanBersih: cards.totalProfit,
    totalPcsTerjual: cards.totalSales,
    totalBiayaSupply: cards.totalSupplyCost,
    totalBiayaOperasional: cards.totalOpsCost,
    totalBiayaHutang: cards.totalPayDebt,
    totalHutangBelumLunas: cards.realtimeOutstandingPay,
  };

  // ---- Section 4.1: Persentase penggunaan dana cashflow ----
  // const usageBase = summary.totalCashflow;

  // Usage base is now totalPendapatanKotor instead of totalCashflow
  const usageBase = summary.totalPendapatanKotor;
  const usageBase2 = summary.totalCashflow;
  const usedForOperational = summary.totalBiayaOperasional;
  const usedForRestock = summary.totalBiayaSupply;
  const usedForDebt = summary.totalBiayaHutang;
  const remaining = Math.max(
    usageBase - usedForOperational - usedForRestock - usedForDebt,
    0,
  );

  const pct = (value) => (usageBase > 0 ? (value / usageBase) * 100 : 0);

  const cashflowUsage = {
    totalCashflow: usageBase,
    items: [
      {
        label: "Biaya Operasional",
        value: usedForOperational,
        percentage: pct(usedForOperational),
      },
      {
        label: "Biaya Restock",
        value: usedForRestock,
        percentage: pct(usedForRestock),
      },
      {
        label: "Pembayaran Hutang",
        value: usedForDebt,
        percentage: pct(usedForDebt),
      },
      { label: "Dana Tersisa", value: remaining, percentage: pct(remaining) },
    ],
  };

  // ---- Section 4.2: Rasio hutang ----
  const debtRatioPercent =
    usageBase2 > 0 ? (summary.totalHutangBelumLunas / usageBase2) * 100 : 0;
  const debtRatio = {
    totalCashflow: usageBase2,
    totalHutang: summary.totalHutangBelumLunas,
    ratioPercent: debtRatioPercent,
    safeLimitPercent: DEBT_SAFE_LIMIT_PERCENT,
    riskStatus:
      debtRatioPercent <= DEBT_SAFE_LIMIT_PERCENT ? "AMAN" : "PERLU PERHATIAN",
  };

  // ---- Section 5: detail tables (map to actual schema fields only) ----
  // LogTransaction has no isDeposit of its own; batch-lookup the source Hsale
  // rows it references (refId = "sales-{hsaleId}") to derive Jenis Saldo
  // without doing one query per row.
  const saleLogIds = logTransactions
    .filter((t) => t.modul === "sales")
    .map((t) => Number(String(t.refId).replace("sales-", "")))
    .filter((id) => Number.isInteger(id));

  const referencedHsales = saleLogIds.length
    ? await prisma.hsale.findMany({
        where: { id: { in: saleLogIds } },
        select: { id: true, isDeposit: true, typePayment: true },
      })
    : [];
  const hsaleById = new Map(referencedHsales.map((h) => [h.id, h]));

  const detailSaldo = logTransactions.map((t) => {
    const sourceId = Number(String(t.refId).replace("sales-", ""));
    const source = hsaleById.get(sourceId);
    return {
      date: t.created_date,
      refId: t.refId,
      modul: t.modul,
      type: t.type,
      typePayment: t.typePayment || "-",
      before: Number(t.before),
      total: Number(t.total),
      after: Number(t.after),
      jenisSaldo: source
        ? deriveJenisSaldo(source.typePayment, source.isDeposit)
        : "-",
      status: t.status,
    };
  });

  const detailSales = salesDetail.map((s) => ({
    date: s.date,
    refId: `SALE-${s.id}`,
    product: s.product?.name || "-",
    quantity: s.quantity,
    priceSell: Number(s.priceSell),
    total: Number(s.total),
    jenisSaldo: deriveJenisSaldo(
      s.headersale?.typePayment,
      s.headersale?.isDeposit,
    ),
    typePayment: s.headersale?.typePayment || "-",
  }));

  const detailOperational = operationalDetail.flatMap((o) =>
    (o.opsdetail.length ? o.opsdetail : [null]).map((item) => ({
      date: o.date,
      refId: `OPS-${o.id}`,
      name: item?.name || o.category,
      quantity: item?.qty ?? o.allQty,
      unitPrice: item ? Number(item.price) : 0,
      total: item ? Number(item.totalPrice) : Number(o.totalPayment),
      typePayment: o.typePayment,
      status: o.status,
    })),
  );

  const detailRestock = restockDetail.flatMap((r) =>
    (r.restockDetail.length ? r.restockDetail : [null]).map((item) => ({
      date: r.date,
      refId: `RESTOCK-${r.id}`,
      supplier: r.supplier,
      product: item?.product?.name || item?.name || "-",
      quantity: item?.qty ?? r.allQty,
      price: item && item.qty ? Number(item.price) / item.qty : 0,
      total: item ? Number(item.price) : Number(r.totalPayment),
      typePayment: r.typePayment,
      status: r.status,
    })),
  );

  const detailDebt = debtDetail.map((d) => ({
    date: d.date,
    refId: `DEBT-${d.id}`,
    party: d.nameDebt,
    totalDebt: Number(d.totalDebt),
    paid: Number(d.totalDebt) - Number(d.outstandingPay || 0),
    outstandingPay: Number(d.outstandingPay || 0),
    status: d.status,
  }));

  // ---- Profit share (bagi hasil) footer: reuse reportService.getRevenueShare
  // with the already-fetched cards so the base matches "Akumulasi Total Saldo"
  // 1:1 without an extra aggregate query. ----
  const revenueShare = await getRevenueShare({
    ...DEFAULT_SHARE_PERCENTAGES,
    startDate,
    endDate,
    cardsOverride: cards,
  });

  const profitShare = {
    totalCashflow: revenueShare.totalCashflow,
    shareBase: revenueShare.shareBase,
    items: [
      {
        label: "Owner",
        percentage: revenueShare.ownerPercentage,
        value: revenueShare.ownerShare,
      },
      {
        label: "Pelaku Usaha",
        percentage: revenueShare.pelakuusahaPercentage,
        value: revenueShare.pelakuusahaShare,
      },
      {
        label: "Pemilik Aset Tetap",
        percentage: revenueShare.pemilikasettetapPercentage,
        value: revenueShare.pemilikasettetapShare,
      },
      {
        label: "Pemilik Aset Mahal",
        percentage: revenueShare.pemilikasetmahalPercentage,
        value: revenueShare.pemilikasetmahalShare,
      },
    ],
  };

  return {
    period: { startDate: startDate || null, endDate: endDate || null },
    summary,
    dailyBreakdown,
    cashflowUsage,
    debtRatio,
    profitShare,
    detailSaldo,
    detailSales,
    detailOperational,
    detailRestock,
    detailDebt,
  };
};

module.exports = {
  getFinancialReportData,
  DEBT_SAFE_LIMIT_PERCENT,
};
