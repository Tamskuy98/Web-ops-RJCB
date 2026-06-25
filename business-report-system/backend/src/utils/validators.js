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

// Expense item schema for daily report
const dailyReportExpenseSchema = z.object({
  namaBarang: z.string().min(1, 'Item name is required'),
  qty: z.number().int().positive('Quantity must be positive'),
  harga: z.number().positive('Unit price must be positive'),
  total: z.number().positive('Total must be positive'),
  attachment: z.string().optional(), // Base64 or URL
});

// Daily report schema (public endpoint - no login required)
const dailyReportSchema = z.object({
  productId: z.number().int().positive('Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  priceSell: z.number().positive().optional(), // defaults to product price
  qris: z.number().min(0).optional(), // QRIS payment amount
  expenses: z.array(dailyReportExpenseSchema).optional(), // optional expense list
  pin: z.string().min(4, 'PIN must be at least 4 characters'), // validation PIN
  date: z.string().optional(), // defaults to now
});

module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  saleSchema,
  incomingSchema,
  restockSchema,
  dailyReportSchema,
  dailyReportExpenseSchema,
};
