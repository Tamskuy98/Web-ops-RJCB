const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');

/**
 * Validate PIN against hashed PIN (similar to password validation)
 * @param {string} plainPin - Plain text PIN input from user
 * @param {string} hashedPin - Hashed PIN from database
 * @returns {Promise<boolean>} - True if PIN matches
 */
const validatePin = async (plainPin, hashedPin) => {
  return await bcrypt.compare(plainPin, hashedPin);
};

/**
 * Create daily report: save sale + expenses, update stock, generate WhatsApp message
 * @param {Object} data - { productId, quantity, priceSell, qris, expenses, pin }
 * @returns {Promise<Object>} - { sale, expenses, whatsappMessage }
 */
const createDailyReport = async (data) => {
  const { productId, quantity, priceSell, qris, expenses, pin, date } = data;

  // Step 1: Validate product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    const error = new Error('Product not found.');
    error.statusCode = 404;
    throw error;
  }

  // Step 2: Check if PIN is provided and valid (get admin user for PIN validation)
  // For now, we'll validate PIN against the first admin user (or a specific admin)
  // In production, you might have a separate PIN in User or config
  const adminUser = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (!adminUser) {
    const error = new Error('Admin user not configured for PIN validation.');
    error.statusCode = 500;
    throw error;
  }

  if (!adminUser.adminPin) {
    const error = new Error('Admin PIN not configured. Please set up PIN first.');
    error.statusCode = 500;
    throw error;
  }

  const isPinValid = await validatePin(pin, adminUser.adminPin);
  if (!isPinValid) {
    const error = new Error('Invalid PIN.');
    error.statusCode = 401;
    throw error;
  }

  // Step 3: Check stock availability
  if (product.stock < quantity) {
    const error = new Error(
      `Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`
    );
    error.statusCode = 400;
    throw error;
  }

  // Step 4: Calculate totals
  const finalPrice = priceSell || product.priceSell; // use provided or default to product price
  const totalRevenue = finalPrice * quantity;
  const profit = (finalPrice - product.priceCost) * quantity;

  // Calculate total expenses
  let totalPengeluaran = 0;
  if (expenses && expenses.length > 0) {
    totalPengeluaran = expenses.reduce((sum, expense) => sum + expense.total, 0);
  }

  const totalFinal = totalRevenue - totalPengeluaran;
  const totalSetoran = totalFinal - (qris || 0);

  // Step 5: Create Sale + SaleExpense records in atomic transaction
  const sale = await prisma.$transaction(async (tx) => {
    // Create sale record
    const newSale = await tx.sale.create({
      data: {
        productId,
        quantity,
        priceSell: finalPrice,
        total: totalRevenue,
        profit,
        qris: qris || 0,
        totalPengeluaran,
        totalSetoran,
        date: date ? new Date(date) : new Date(),
      },
      include: { product: true },
    });

    // Create sale expense records if provided
    if (expenses && expenses.length > 0) {
      await tx.saleExpense.createMany({
        data: expenses.map((expense) => ({
          saleId: newSale.id,
          namaBarang: expense.namaBarang,
          qty: expense.qty,
          harga: expense.harga,
          total: expense.total,
          attachment: expense.attachment || null,
        })),
      });
    }

    // Update product stock (decrement)
    await tx.product.update({
      where: { id: productId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    return newSale;
  });

  // Step 6: Fetch full expense record for message generation
  const expenseRecords = await prisma.saleExpense.findMany({
    where: { saleId: sale.id },
  });

  // Step 7: Generate WhatsApp message
  const whatsappMessage = generateWhatsAppMessage(
    sale,
    expenseRecords,
    qris || 0,
    totalSetoran
  );

  return {
    sale,
    expenses: expenseRecords,
    whatsappMessage,
  };
};

/**
 * Generate formatted WhatsApp message for daily report
 * @param {Object} sale - Sale record with product info
 * @param {Array} expenses - SaleExpense records
 * @param {number} qrisAmount - QRIS payment amount
 * @param {number} totalSetoran - Final cash to deposit
 * @returns {string} - Formatted WhatsApp message
 */
const generateWhatsAppMessage = (sale, expenses, qrisAmount, totalSetoran) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  let message = `📋 *Laporan Harian*\n`;
  message += `_${formatDate(sale.date)}_\n\n`;

  // Revenue section
  message += `💰 *Pendapatan:* ${formatCurrency(sale.total)}\n`;

  // Expenses section
  if (expenses && expenses.length > 0) {
    message += `📤 *Pengeluaran:* ${formatCurrency(sale.totalPengeluaran)}\n`;
    message += `\n_Detail Pengeluaran:_\n`;
    expenses.forEach((expense) => {
      message += `• ${expense.namaBarang} x${expense.qty} = ${formatCurrency(expense.total)}\n`;
    });
    message += '\n';
  }

  // Sales by category section
  message += `\n📦 *#Terjual*\n`;
  message += `• ${sale.product.name} (${sale.product.category}): ${sale.quantity} pcs\n`;

  // Settlement section
  message += `\n💵 *Setor:*\n`;
  if (qrisAmount > 0) {
    message += `.qris: ${formatCurrency(qrisAmount)}\n`;
  }
  message += `.cash: ${formatCurrency(totalSetoran)}\n`;

  return message;
};

/**
 * Get all daily reports (for admin dashboard)
 * @param {Object} filters - Query filters { startDate, endDate, search }
 * @returns {Promise<Array>} - Array of sales with expenses
 */
const getDailyReports = async (filters = {}) => {
  const { startDate, endDate, search } = filters;
  const where = {};

  // Date range filter
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  // Product name search
  if (search) {
    where.product = {
      name: {
        contains: search,
        mode: 'insensitive',
      },
    };
  }

  return await prisma.sale.findMany({
    where,
    include: {
      product: true,
      expenses: true,
    },
    orderBy: { date: 'desc' },
  });
};

module.exports = {
  validatePin,
  createDailyReport,
  generateWhatsAppMessage,
  getDailyReports,
};
