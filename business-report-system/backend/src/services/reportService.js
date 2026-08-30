const { getCards } = require("./dashboard/cardService");
const { getCartsSalesPerMount } = require("./dashboard/chartService");
const { getLowProduct } = require("./dashboard/tableService");

// const { getTables } = require("./dashboard/tables.service");
const prisma = require("../prisma/client");

const getSalesReport = async ({ startDate, endDate, productId }) => {
  const where = {};

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate + "T23:59:59.999Z"),
    };
  }

  if (productId) {
    where.productId = parseInt(productId);
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { product: { select: { name: true, category: true } } },
    orderBy: { date: "desc" },
  });

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit), 0);
  const totalTransactions = sales.length;

  return {
    sales,
    summary: { totalSales, totalProfit, totalTransactions },
  };
};

const getProfitReport = async ({ startDate, endDate }) => {
  const where = {};

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate + "T23:59:59.999Z"),
    };
  }

  const sales = await prisma.sale.findMany({ where });

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit), 0);
  const totalTransactions = sales.length;

  return { totalSales, totalProfit, totalTransactions };
};

const getRevenueShare = async ({
  ownerPercentage,
  pelakuusahaPercentage,
  pemilikasettetapPercentage,
  pemilikasetmahalPercentage,
  startDate,
  endDate,
  cardsOverride,
}) => {
  const where = {};

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate + "T23:59:59.999Z"),
    };
  }

  // Reuse the same cardService figures the Dashboard/PDF already show, so the
  // share base always matches "Akumulasi Total Saldo (Cash Flow)" 1:1.
  // Callers that already fetched cards (e.g. financialReportService) can pass
  // cardsOverride to avoid an extra aggregate query.
  const cards = cardsOverride || (await getCards(where));

  const cashflowBelumDisetor = cards.realtimeCashHold;
  const cashflowSudahDisetor = cards.realtimeCashHand;
  const cashflowQris = cards.realtimeQris;
  const totalCashflow =
    cashflowBelumDisetor + cashflowSudahDisetor + cashflowQris;
  const totalHutangBelumLunas = cards.realtimeOutstandingPay;
  const totalProfit = cards.totalProfit;
  // Total Pengeluaran = biaya operasional + biaya restock + biaya bayar hutang
  const totalPengeluaran =
    cards.totalOpsCost + cards.totalSupplyCost + cards.totalPayDebt;

  // Bagi hasil dihitung dari akumulasi total saldo (cashflow), bukan profit.
  const shareBase = totalCashflow;
  const ownerShare = (shareBase * ownerPercentage) / 100;
  const pelakuusahaShare = (shareBase * pelakuusahaPercentage) / 100;
  const pemilikasettetapShare = (shareBase * pemilikasettetapPercentage) / 100;
  const pemilikasetmahalShare = (shareBase * pemilikasetmahalPercentage) / 100;

  return {
    totalProfit,
    totalCashflow,
    cashflowBelumDisetor,
    cashflowSudahDisetor,
    cashflowQris,
    totalHutangBelumLunas,
    totalPengeluaran,
    shareBase,
    ownerPercentage,
    pelakuusahaPercentage,
    pemilikasettetapPercentage,
    pemilikasetmahalPercentage,
    ownerShare: Math.round(ownerShare * 100) / 100,
    pelakuusahaShare: Math.round(pelakuusahaShare * 100) / 100,
    pemilikasettetapShare: Math.round(pemilikasettetapShare * 100) / 100,
    pemilikasetmahalShare: Math.round(pemilikasetmahalShare * 100) / 100,
  };
};

const getMonthlySales = async () => {
  const sales = await prisma.sale.findMany({
    orderBy: { date: "asc" },
  });

  const monthly = {};
  sales.forEach((s) => {
    const key = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, "0")}`;
    if (!monthly[key]) {
      monthly[key] = {
        month: key,
        totalSales: 0,
        totalProfit: 0,
        transactions: 0,
      };
    }
    monthly[key].totalSales += Number(s.total);
    monthly[key].totalProfit += Number(s.profit);
    monthly[key].transactions += 1;
  });

  return Object.values(monthly);
};

// const getDashboardStats = async () => {
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   const tomorrow = new Date(today);
//   tomorrow.setDate(tomorrow.getDate() + 1);

//   // Get start of current month
//   const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

//   const [todaySales, allProducts, lowStockProducts, monthlySales, periodSales] =
//     await Promise.all([
//       prisma.sale.findMany({
//         where: { date: { gte: today, lt: tomorrow } },
//       }),
//       prisma.product.count(),
//       prisma.product.findMany({
//         where: { stock: { lte: prisma.product.fields?.minStock || 5 } },
//       }),
//       getMonthlySales(),
//       prisma.sale.findMany({
//         where: { date: { gte: monthStart, lt: tomorrow } },
//       }),
//     ]);

//   // Get low stock products manually
//   const allProductsList = await prisma.product.findMany();
//   const lowStock = allProductsList.filter((p) => p.stock <= p.minStock);

//   const todayTotalSales = todaySales.reduce(
//     (sum, s) => sum + Number(s.total),
//     0,
//   );
//   const todayTotalProfit = todaySales.reduce(
//     (sum, s) => sum + Number(s.profit),
//     0,
//   );
//   const periodTotalProfit = periodSales.reduce(
//     (sum, s) => sum + Number(s.profit),
//     0,
//   );

//   return {
//     todaySales: todayTotalSales,
//     todayProfit: todayTotalProfit,
//     periodProfit: periodTotalProfit,
//     totalProducts: allProducts,
//     lowStockCount: lowStock.length,
//     lowStockProducts: lowStock,
//     monthlySales,
//   };
// };

const getDashboardStats = async ({ startDate, endDate }) => {
  const where = {};
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }
  const [cards, charts, tables] = await Promise.all([
    getCards(where),
    getCartsSalesPerMount(),
    getLowProduct(),
  ]);

  return {
    cards,
    charts,
    tables,
  };
};

const getCardsHold = async () => {
  const data = await getCards();

  return data;
};

module.exports = {
  getSalesReport,
  getProfitReport,
  getRevenueShare,
  getMonthlySales,
  getDashboardStats,
  getCartsSalesPerMount,
  getLowProduct,
  getCardsHold,
};
