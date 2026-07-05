const { truncate } = require("fs");
const prisma = require("../prisma/client");

const getAlloperational = async () => {
  // return prisma.operational.findMany({
  //   include: { product: { select: { name: true, category: true } } },
  //   orderBy: { date: "desc" },
  // });
  return prisma.operational.findMany({
    include: { opsdetail: true },
    orderBy: { date: "desc" },
  });
};

const createoperational = async ({
  productId,
  quantity,
  supplier,
  date,
  note,
}) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  const [operational] = await prisma.$transaction([
    prisma.operational.create({
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

  return operational;
};

const deleteoperational = async (id) => {
  const operational = await prisma.operational.findUnique({
    where: { id },
  });
  if (!operational) {
    const error = new Error("operational record not found.");
    error.statusCode = 404;
    throw error;
  }

  await prisma.$transaction([
    prisma.operational.delete({ where: { id } }),
    prisma.product.update({
      where: { id: operational.productId },
      data: { stock: { decrement: operational.quantity } },
    }),
  ]);

  return operational;
};

module.exports = { getAlloperational, createoperational, deleteoperational };
