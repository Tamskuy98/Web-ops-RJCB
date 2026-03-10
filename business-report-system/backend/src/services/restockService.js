const prisma = require('../prisma/client');

const getAllRestocks = async () => {
  return prisma.restock.findMany({
    include: { product: { select: { name: true, category: true } } },
    orderBy: { date: 'desc' },
  });
};

const createRestock = async ({ productId, quantity, purchasePrice, supplier, date }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const [restock] = await prisma.$transaction([
    prisma.restock.create({
      data: {
        productId,
        quantity,
        purchasePrice,
        supplier,
        date: date ? new Date(date) : new Date(),
      },
      include: { product: { select: { name: true, category: true } } },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    }),
  ]);

  return restock;
};

module.exports = { getAllRestocks, createRestock };
