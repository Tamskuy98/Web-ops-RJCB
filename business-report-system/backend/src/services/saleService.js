const prisma = require('../prisma/client');

const getAllSales = async ({ search, startDate, endDate }) => {
  const where = {};

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate + 'T23:59:59.999Z'),
    };
  }

  if (search) {
    where.product = {
      name: { contains: search },
    };
  }

  return prisma.sale.findMany({
    where,
    include: { product: { select: { name: true, category: true, priceCost: true } } },
    orderBy: { date: 'desc' },
  });
};

const createSale = async ({ productId, quantity, priceSell, date }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  if (product.stock < quantity) {
    const error = new Error(`Insufficient stock. Available: ${product.stock}`);
    error.statusCode = 400;
    throw error;
  }

  const sellPrice = priceSell || Number(product.priceSell);
  const total = sellPrice * quantity;
  const profit = (sellPrice - Number(product.priceCost)) * quantity;

  const [sale] = await prisma.$transaction([
    prisma.sale.create({
      data: {
        productId,
        quantity,
        priceSell: sellPrice,
        total,
        profit,
        date: date ? new Date(date) : new Date(),
      },
      include: { product: { select: { name: true, category: true } } },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } },
    }),
  ]);

  return sale;
};

const updateSale = async (id, { productId, quantity, priceSell, date }) => {
  const existingSale = await prisma.sale.findUnique({ where: { id } });
  if (!existingSale) {
    const error = new Error('Sale not found.');
    error.statusCode = 404;
    throw error;
  }

  const product = await prisma.product.findUnique({ where: { id: productId || existingSale.productId } });
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  // Restore old stock, then deduct new quantity
  const newQuantity = quantity || existingSale.quantity;
  const newPriceSell = priceSell || Number(existingSale.priceSell);
  const stockDiff = existingSale.quantity - newQuantity;

  const restoredStock = product.stock + existingSale.quantity;
  if (restoredStock < newQuantity) {
    const error = new Error(`Insufficient stock. Available: ${restoredStock}`);
    error.statusCode = 400;
    throw error;
  }

  const total = newPriceSell * newQuantity;
  const profit = (newPriceSell - Number(product.priceCost)) * newQuantity;

  const [sale] = await prisma.$transaction([
    prisma.sale.update({
      where: { id },
      data: {
        productId: productId || existingSale.productId,
        quantity: newQuantity,
        priceSell: newPriceSell,
        total,
        profit,
        date: date ? new Date(date) : existingSale.date,
      },
      include: { product: { select: { name: true, category: true } } },
    }),
    prisma.product.update({
      where: { id: productId || existingSale.productId },
      data: { stock: { increment: stockDiff } },
    }),
  ]);

  return sale;
};

const deleteSale = async (id) => {
  const sale = await prisma.sale.findUnique({ where: { id } });
  if (!sale) {
    const error = new Error('Sale not found.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.$transaction([
    prisma.sale.delete({ where: { id } }),
    prisma.product.update({
      where: { id: sale.productId },
      data: { stock: { increment: sale.quantity } },
    }),
  ]);

  return sale;
};

module.exports = { getAllSales, createSale, updateSale, deleteSale };
