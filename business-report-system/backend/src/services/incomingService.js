const prisma = require('../prisma/client');

const getAllIncoming = async () => {
  return prisma.incomingGood.findMany({
    include: { product: { select: { name: true, category: true } } },
    orderBy: { date: 'desc' },
  });
};

const createIncoming = async ({ productId, quantity, supplier, date, note }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  const [incoming] = await prisma.$transaction([
    prisma.incomingGood.create({
      data: {
        productId,
        quantity,
        supplier,
        date: date ? new Date(date) : new Date(),
        note,
      },
      include: { product: { select: { name: true, category: true } } },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    }),
  ]);

  return incoming;
};

const deleteIncoming = async (id) => {
  const incoming = await prisma.incomingGood.findUnique({ where: { id } });
  if (!incoming) {
    const error = new Error('Incoming record not found.');
    error.statusCode = 404;
    throw error;
  }

  await prisma.$transaction([
    prisma.incomingGood.delete({ where: { id } }),
    prisma.product.update({
      where: { id: incoming.productId },
      data: { stock: { decrement: incoming.quantity } },
    }),
  ]);

  return incoming;
};

module.exports = { getAllIncoming, createIncoming, deleteIncoming };
