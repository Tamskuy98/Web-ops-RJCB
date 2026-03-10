const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'owner', 'warehouse']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  category: z.string().min(1, 'Category is required'),
  priceCost: z.number().positive('Cost price must be positive'),
  priceSell: z.number().positive('Sell price must be positive'),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
});

const productUpdateSchema = productSchema.partial();

const saleSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive('Quantity must be positive'),
  priceSell: z.number().positive().optional(),
  date: z.string().optional(),
});

const incomingSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive('Quantity must be positive'),
  supplier: z.string().min(1, 'Supplier is required'),
  date: z.string().optional(),
  note: z.string().optional(),
});

const restockSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive('Quantity must be positive'),
  purchasePrice: z.number().positive('Purchase price must be positive'),
  supplier: z.string().min(1, 'Supplier is required'),
  date: z.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  saleSchema,
  incomingSchema,
  restockSchema,
};
