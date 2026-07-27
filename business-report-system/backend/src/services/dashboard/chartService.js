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

module.exports = {
  getCartsSalesPerMount,
};
