const prisma = require("../../prisma/client");

const getCartsSalesPerMount = async () => {
  const sales = await prisma.hsale.findMany({
    select: {
      date: true,
      allquantity: true,
      total: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  const result = {};

  for (const sale of sales) {
    const month = sale.date.toISOString().slice(0, 7); // YYYY-MM

    if (!result[month]) {
      result[month] = {
        month,
        sales: 0,
        revenue: 0,
      };
    }

    result[month].sales += sale.allquantity;
    result[month].revenue += sale.total;
  }

  return Object.values(result);
};

const dayKey = (date) => new Date(date).toISOString().split("T")[0];

/**
 * Daily breakdown used by the financial report PDF (Section 3 charts).
 * Groups the already date-filtered rows in memory (single query per source,
 * same pattern as getCartsSalesPerMount/getMonthlySales) - no per-day queries.
 */
const getDailyBreakdown = async (where) => {
  const [sales, operational, restock] = await Promise.all([
    prisma.hsale.findMany({
      where,
      select: {
        date: true,
        allquantity: true,
        total: true,
        profit: true,
        cash: true,
        qris: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.operational.findMany({
      where,
      select: { date: true, totalPayment: true },
      orderBy: { date: "asc" },
    }),
    prisma.restock.findMany({
      where,
      select: { date: true, totalPayment: true },
      orderBy: { date: "asc" },
    }),
  ]);

  const daily = {};
  const ensureDay = (key) => {
    if (!daily[key]) {
      daily[key] = {
        date: key,
        cashflow: 0,
        cashIn: 0,
        cashOut: 0,
        grossIncome: 0,
        netIncome: 0,
        quantity: 0,
        operationalCost: 0,
        restockCost: 0,
      };
    }
    return daily[key];
  };

  sales.forEach((s) => {
    const key = dayKey(s.date);
    const entry = ensureDay(key);
    const paymentTotal = Number(s.cash || 0) + Number(s.qris || 0);
    entry.cashflow += paymentTotal;
    entry.cashIn += paymentTotal;
    entry.grossIncome += Number(s.total || 0);
    entry.netIncome += Number(s.profit || 0);
    entry.quantity += Number(s.allquantity || 0);
  });

  operational.forEach((o) => {
    const entry = ensureDay(dayKey(o.date));
    const totalPayment = Number(o.totalPayment || 0);
    entry.operationalCost += totalPayment;
    entry.cashOut += totalPayment;
  });

  restock.forEach((r) => {
    const entry = ensureDay(dayKey(r.date));
    const totalPayment = Number(r.totalPayment || 0);
    entry.restockCost += totalPayment;
    entry.cashOut += totalPayment;
  });

  return Object.values(daily).sort((a, b) => (a.date < b.date ? -1 : 1));
};

module.exports = {
  getCartsSalesPerMount,
  getDailyBreakdown,
};
