const { z } = require("zod");

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z
    .enum(["admin", "owner", "warehouse", "operator", "investor"])
    .optional(),
  branch: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  priceCost: z.number().positive("Cost price must be positive"),
  priceSell: z.number().positive("Sell price must be positive"),
  stock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
});

const productUpdateSchema = productSchema.partial();

const saleSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be positive"),
  priceSell: z.number().positive().optional(),
  date: z.string().optional(),
});

const saleCreateSchema = z.object({
  Date: z.string().optional(),
  totalPayment: z.number().positive("Total payment must be positive"),
  TotalQuantity: z.number().int().positive("Total quantity must be positive"),
  cash: z.number().min(0, "Cash must be non-negative"),
  qris: z.number().min(0, "QRIS must be non-negative"),
  list: z
    .array(
      z.object({
        productid: z.number().int().positive(),
        quantity: z.number().int().positive("Quantity must be positive"),
        priceSell: z.number().positive("Price must be positive"),
      }),
    )
    .min(1, "List must contain at least one item"),
});

const operationalSchema = z
  .object({
    date: z.string().optional(),
    supplier: z.string().optional(),
    attachmentType: z.string().optional(),
    attachmentUrl: z.string().optional(),
    attachmentFile: z.any().optional(),
    cashOnHand: z.coerce.number().min(0).optional(),
    cashHold: z.coerce.number().min(0).optional(),
    qris: z.coerce.number().min(0).optional(),
    totalPaid: z.coerce.number().min(0).optional(),
    typePayment: z.string().optional(),
    status: z.string().optional(),
    note: z.string().optional(),
    outstandingPay: z.coerce.number().min(0).optional(),
    items: z
      .array(
        z.object({
          kategoriBarang: z.string().optional(),
          kategoriLainnyaText: z.string().optional(),
          jumlahBarang: z.coerce.number().int().positive().optional(),
          hargaBarang: z.coerce.number().positive().optional(),
          total: z.coerce.number().positive().optional(),
          name: z.string().optional(),
          quantity: z.coerce.number().int().positive().optional(),
          purchasePrice: z.coerce.number().positive().optional(),
          price: z.coerce.number().positive().optional(),
        }),
      )
      .optional(),
    name: z.string().optional(),
    itemName: z.string().optional(),
    quantity: z.coerce.number().int().positive().optional(),
    purchasePrice: z.coerce.number().positive().optional(),
    price: z.coerce.number().positive().optional(),
  })
  .passthrough();

const restockSchema = z
  .object({
    date: z.string().optional(),
    supplier: z.string().optional(),
    attachmentType: z.string().optional(),
    attachment: z.string().optional(),
    // attachmentFile: z.any().optional(),
    cashOnHand: z.coerce.number().min(0).optional(),
    cashHold: z.coerce.number().min(0).optional(),
    qris: z.coerce.number().min(0).optional(),
    totalPayment: z.coerce.number().min(0).optional(),
    typePayment: z.string().optional(),
    status: z.string().optional(),
    note: z.string().optional(),
    outstandingPay: z.coerce.number().min(0).optional(),
    items: z
      .array(
        z.object({
          productid: z.coerce.number().positive().optional(),
          name: z.string().optional(),
          qty: z.coerce.number().int().positive().optional(),
          price: z.coerce.number().positive().optional(),
        }),
      )
      .optional(),
  })
  .passthrough();

// Expense item schema for daily report

const dailyReportExpenseSchema = z.object({
  namaBarang: z.string().min(1, "Item name is required"),
  qty: z.number().int().positive("Quantity must be positive"),
  harga: z.number().positive("Unit price must be positive"),
  total: z.number().positive("Total must be positive"),
  attachment: z.string().optional(), // Base64 or URL
});

// Daily report schema (public endpoint - no login required)
const dailyReportSchema = z.object({
  productId: z.number().int().positive("Product ID is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  priceSell: z.number().positive().optional(), // defaults to product price
  qris: z.number().min(0).optional(), // QRIS payment amount
  expenses: z.array(dailyReportExpenseSchema).optional(), // optional expense list
  pin: z.string().min(4, "PIN must be at least 4 characters"), // validation PIN
  date: z.string().optional(), // defaults to now
});

const PaydebtSchema = z.object({
  TotalPayment: z.coerce.number().min(0).optional(),
  typePayment: z.string().optional(),
  cashHand: z.coerce.number().min(0).optional(),
  cashHold: z.coerce.number().min(0).optional(),
  qris: z.coerce.number().min(0).optional(),
  status: z.string().optional(),
  Date: z.string().optional(),
});

const depositCreateSchema = z.object({
  id: z.array(z.number()).min(1, "select one data"),
  totalDeposit: z.coerce.number().min(0),
  Date: z.string().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  productSchema,
  productUpdateSchema,
  saleSchema,
  saleCreateSchema,
  operationalSchema,
  restockSchema,
  dailyReportSchema,
  dailyReportExpenseSchema,
  PaydebtSchema,
  depositCreateSchema,
};
