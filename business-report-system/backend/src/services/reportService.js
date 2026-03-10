const prisma = require('../prisma/client');

const getSalesReport = async ({ startDate, endDate, productId }) => {
  const where = {};

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z'),
    };
  }

  if (productId) {
    where.productId = parseInt(productId);
  }

  const sales = await prisma.sale.findMany({
    where,
    include: { product: { select: { name: true, category: true } } },
    orderBy: { date: 'desc' },
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
      lte: new Date(endDate + 'T23:59:59.999Z'),
    };
  }

  const sales = await prisma.sale.findMany({ where });

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0);
  const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit), 0);
  const totalTransactions = sales.length;

  return { totalSales, totalProfit, totalTransactions };
};

const getRevenueShare = async ({ ownerPercentage, partnerPercentage, startDate, endDate }) => {
  const where = {};

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z'),
    };
  }

  const sales = await prisma.sale.findMany({ where });
  const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit), 0);

  const ownerShare = (totalProfit * ownerPercentage) / 100;
  const partnerShare = (totalProfit * partnerPercentage) / 100;

  return {
    totalProfit,
    ownerPercentage,
    partnerPercentage,
    ownerShare: Math.round(ownerShare * 100) / 100,
    partnerShare: Math.round(partnerShare * 100) / 100,
  };
};

const getMonthlySales = async () => {
  const sales = await prisma.sale.findMany({
    orderBy: { date: 'asc' },
  });

  const monthly = {};
  sales.forEach((s) => {
    const key = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthly[key]) {
      monthly[key] = { month: key, totalSales: 0, totalProfit: 0, transactions: 0 };
    }
    monthly[key].totalSales += Number(s.total);
    monthly[key].totalProfit += Number(s.profit);
    monthly[key].transactions += 1;
  });

  return Object.values(monthly);
};

const getDashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todaySales, allProducts, lowStockProducts, monthlySales] = await Promise.all([
    prisma.sale.findMany({
      where: { date: { gte: today, lt: tomorrow } },
    }),
    prisma.product.count(),
    prisma.product.findMany({
      where: { stock: { lte: prisma.product.fields?.minStock || 5 } },
    }),
    getMonthlySales(),
  ]);

  // Get low stock products manually
  const allProductsList = await prisma.product.findMany();
  const lowStock = allProductsList.filter((p) => p.stock <= p.minStock);

  const todayTotalSales = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const todayTotalProfit = todaySales.reduce((sum, s) => sum + Number(s.profit), 0);

  return {
    todaySales: todayTotalSales,
    todayProfit: todayTotalProfit,
    totalProducts: allProducts,
    lowStockCount: lowStock.length,
    lowStockProducts: lowStock,
    monthlySales,
  };
};

module.exports = { getSalesReport, getProfitReport, getRevenueShare, getMonthlySales, getDashboardStats };
