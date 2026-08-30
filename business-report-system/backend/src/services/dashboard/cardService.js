const prisma = require("../../prisma/client");

const getCards = async (where) => {
  const [
    salesSummary,
    salesCashDeposit,
    salesCashHold,
    salesQris,
    operationalSummary,
    restockSummary,
    payDebtSummary,
    debtSummary,
  ] = await Promise.all([
    prisma.hsale.aggregate({
      where,
      _sum: {
        allquantity: true,
        total: true,
        profit: true,
      },
    }),

    prisma.hsale.aggregate({
      where: {
        ...where,
        isDeposit: "Y",
      },
      _sum: {
        cash: true,
      },
    }),

    prisma.hsale.aggregate({
      where: {
        ...where,
        isDeposit: "N",
      },
      _sum: {
        cash: true,
      },
    }),

    prisma.hsale.aggregate({
      where,
      _sum: {
        qris: true,
      },
    }),

    prisma.operational.aggregate({
      where,
      _sum: {
        totalPayment: true,
        cashOnHand: true,
        cashHold: true,
        qris: true,
      },
    }),

    prisma.restock.aggregate({
      where,
      _sum: {
        totalPayment: true,
        cashOnHand: true,
        cashHold: true,
        qris: true,
      },
    }),

    prisma.paydebt.aggregate({
      where,
      _sum: {
        totalPayment: true,
        cashHand: true,
        cashHold: true,
        qris: true,
      },
    }),

    prisma.debt.aggregate({
      where: {
        ...where,
        status: "HUTANG",
        outstandingPay: {
          gt: 0,
        },
      },
      _sum: {
        outstandingPay: true,
      },
    }),
  ]);

  // =======================
  // HISTORY
  // =======================

  const totalSales = salesSummary._sum.allquantity ?? 0;
  const totalRevenue = salesSummary._sum.total ?? 0;
  // Net income (Pendapatan Bersih): sum of Hsale.profit within the same date range
  const totalProfit = salesSummary._sum.profit ?? 0;

  const totalOpsCost = operationalSummary._sum.totalPayment ?? 0;
  const totalSupplyCost = restockSummary._sum.totalPayment ?? 0;
  const totalPayDebt = payDebtSummary._sum.totalPayment ?? 0;

  // =======================
  // REALTIME BALANCE
  // =======================

  const realtimeCashHand =
    (salesCashDeposit._sum.cash ?? 0) -
    (operationalSummary._sum.cashOnHand ?? 0) -
    (restockSummary._sum.cashOnHand ?? 0) -
    (payDebtSummary._sum.cashHand ?? 0);

  const realtimeCashHold = salesCashHold._sum.cash ?? 0;

  console.log("ini sales" + salesCashHold._sum.cash);
  console.log("ini ops" + operationalSummary._sum.cashHold);

  const realtimeQris =
    (salesQris._sum.qris ?? 0) -
    (operationalSummary._sum.qris ?? 0) -
    (restockSummary._sum.qris ?? 0) -
    (payDebtSummary._sum.qris ?? 0);

  const realtimeOutstandingPay = debtSummary._sum.outstandingPay ?? 0;

  return {
    totalSales,
    totalRevenue,
    totalProfit,
    totalOpsCost,
    totalSupplyCost,
    totalPayDebt,

    realtimeCashHand,
    realtimeCashHold,
    realtimeQris,
    realtimeOutstandingPay,
  };
};

module.exports = {
  getCards,
};
