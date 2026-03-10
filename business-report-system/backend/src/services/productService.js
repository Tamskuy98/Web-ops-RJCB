const prisma = require('../prisma/client');

const getAllProducts = async (search) => {
  const where = search
    ? {
        OR: [
          { name: { contains: search } },
          { category: { contains: search } },
        ],
      }
    : {};

  return prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
};

const getProductById = async (id) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }
  return product;
};

const createProduct = async (data) => {
  return prisma.product.create({ data });
};

const updateProduct = async (id, data) => {
  await getProductById(id);
  return prisma.product.update({ where: { id }, data });
};

const deleteProduct = async (id) => {
  await getProductById(id);
  return prisma.product.delete({ where: { id } });
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
