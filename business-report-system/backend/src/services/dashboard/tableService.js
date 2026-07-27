const prisma = require("../../prisma/client");

const getLowProduct = async () => {
  const allProductsList = await prisma.product.findMany();
  const lowStock = allProductsList.filter((p) => p.stock <= p.minStock);

  return {
    lowStockProducts: lowStock,
  };
};

module.exports = {
  getLowProduct,
};
