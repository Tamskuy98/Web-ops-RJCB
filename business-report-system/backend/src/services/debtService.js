const { empty } = require("@prisma/client/runtime/library");
const prisma = require("../prisma/client");
const { useCashHold } = require("./depositService.js");

const getAllDebt = async ({ search, startDate, endDate }) => {
  const where = {};

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate),
      lte: new Date(endDate + "T23:59:59.999Z"),
    };
  }

  // if (search) {
  //   where.debt = {
  //     some: {
  //       product: {
  //         name: { contains: search },
  //       },
  //     },
  //   };
  // }

  return prisma.debt.findMany({
    where,
    orderBy: { date: "desc" },
  });
};

const payDebt = async (payload = {}) => {
  const data = payload;

  console.log(data);
  // if (!data?.typePayment) {
  //   throw new Error("typePayment is required");
  // }
  //validasi
  const totalPayment = data.cashHand + data.cashHold + data.qris;

  // if (totalPayment !== data.totalPayment) {
  //   throw new Error("Total Payment not Match");
  // }

  const tempType = [];
  if (Number(data.cashHand) > 0) tempType.push("CASH ON HAND");
  if (Number(data.cashHold) > 0) tempType.push("CASH HOLD");
  if (Number(data.qris) > 0) tempType.push("QRIS");
  const typePayment = tempType.join(";");

  // HANDLE DATA PAYMENT

  // HANDLE PAYMENT PROCESS
  return await prisma.$transaction(async (tx) => {
    const payDebt = await tx.paydebt.create({
      data: {
        totalPayment: totalPayment,
        typePayment: typePayment,
        cashHand: data.cashHand || 0,
        cashHold: data.cashHold || 0,
        qris: data.qris || 0,
        status: "BAYAR HUTANG",
        date: data?.date ? new Date(data.date) : new Date(),
      },
    });

    const updatedDebts = [];
    let remaining = Number(totalPayment);

    if (remaining <= 0) {
      throw new Error("Total pembayaran harus lebih dari 0");
    }

    const debts = await tx.debt.findMany({
      where: {
        status: "HUTANG",
        outstandingPay: {
          gt: 0,
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    console.log(debts);

    if (debts.length === 0) {
      throw new Error("Tidak ada data Hutang");
    }

    for (const debt of debts) {
      let updated;
      if (remaining <= 0) break;
      if (remaining >= debt.outstandingPay) {
        remaining -= debt.outstandingPay;

        updated = await tx.debt.update({
          where: {
            id: debt.id,
          },
          data: {
            outstandingPay: 0,
            status: "LUNAS",
          },
        });
      } else {
        updated = await tx.debt.update({
          where: {
            id: debt.id,
          },
          data: {
            outstandingPay: debt.outstandingPay - remaining,
          },
        });

        remaining = 0;
      }

      updatedDebts.push(updated);
    }

    if (data.cashHold > 0) {
      await useCashHold(data.cashHold);
    }

    return {
      updatedDebts,
      remainingPayment: remaining,
    };
  });

  //declare and get data totalPayment

  //loop sampai sisa = 0
  //find asc record debt status = HUTANG && OUTSTANDING PAY > 0
  //update outstandingpay && status where id debt

  //sisa = totalPayment - outstandingpay

  //RETURN
};

// const createSale = async ({
//   Date: saleDateInput,
//   totalPayment,
//   TotalQuantity,
//   cash,
//   qris,
//   list,
// }) => {
//   const cashAmount = Number(cash) || 0;
//   const qrisAmount = Number(qris) || 0;
//   const totalQuantity = Number(TotalQuantity);
//   const totalPay = Number(totalPayment);
//   const saleDate = saleDateInput ? new Date(saleDateInput) : new Date();

//   const startOfDay = new Date(saleDate);
//   startOfDay.setHours(0, 0, 0, 0);
//   const endOfDay = new Date(saleDate);
//   endOfDay.setHours(23, 59, 59, 999);

//   const existingHeader = await prisma.hsale.findFirst({
//     where: {
//       date: {
//         gte: startOfDay,
//         lte: endOfDay,
//       },
//     },
//   });

//   if (existingHeader) {
//     const error = new Error(
//       `A sales header already exists for ${saleDate.toISOString().split("T")[0]}.`,
//     );
//     error.statusCode = 400;
//     throw error;
//   }

//   let costsupply = 0;
//   for (const item of list) {
//     const product = await prisma.product.findUnique({
//       where: { id: item.productid },
//     });
//     if (!product) {
//       const error = new Error(`Product not found: ${item.productid}`);
//       error.statusCode = 404;
//       throw error;
//     }
//     costsupply += Number(product.priceCost) * Number(item.quantity);
//   }
//   const profit = totalPay - costsupply;

//   if (!Array.isArray(list) || list.length === 0) {
//     const error = new Error("Sale list must contain at least one item.");
//     error.statusCode = 400;
//     throw error;
//   }

//   const paymentTotal = cashAmount + qrisAmount;
//   if (paymentTotal !== totalPay) {
//     const error = new Error(
//       `Payment mismatch: cash + qris (${paymentTotal}) must equal totalPayment (${totalPay}).`,
//     );
//     error.statusCode = 400;
//     throw error;
//   }

//   const allquantity = list.reduce(
//     (sum, item) => sum + Number(item.quantity),
//     0,
//   );
//   if (allquantity !== totalQuantity) {
//     const error = new Error(
//       `TotalQuantity mismatch: sum of item quantities (${allquantity}) must equal TotalQuantity (${totalQuantity}).`,
//     );
//     error.statusCode = 400;
//     throw error;
//   }

//   const headersale = await prisma.hsale.create({
//     data: {
//       allquantity,
//       total: totalPay,
//       profit: profit,
//       date: saleDate,
//       typePayment:
//         cashAmount > 0 && qrisAmount > 0
//           ? "Cash;Qris"
//           : cashAmount > 0
//             ? "Cash"
//             : "Qris",
//       cash: cashAmount,
//       qris: qrisAmount,
//     },
//   });

//   const createdSales = [];
//   for (const item of list) {
//     const product = await prisma.product.findUnique({
//       where: { id: item.productid },
//     });
//     if (!product) {
//       const error = new Error(`Product not found: ${item.productid}`);
//       error.statusCode = 404;
//       throw error;
//     }

//     if (product.stock < Number(item.quantity)) {
//       const error = new Error(
//         `Insufficient stock for product ${product.name}. Available: ${product.stock}`,
//       );
//       error.statusCode = 400;
//       throw error;
//     }

//     const priceSell = Number(item.priceSell);
//     const quantity = Number(item.quantity);
//     const total = priceSell * quantity;
//     const profit = (priceSell - Number(product.priceCost)) * quantity;

//     const sale = await prisma.sale.create({
//       data: {
//         productId: item.productid,
//         hsaleid: headersale.id,
//         quantity,
//         priceSell,
//         total,
//         profit,
//         date: saleDate,
//       },
//       include: { product: { select: { name: true, category: true } } },
//     });

//     await prisma.product.update({
//       where: { id: item.productid },
//       data: { stock: { decrement: quantity } },
//     });

//     createdSales.push(sale);
//   }

//   return {
//     headersale,
//     sales: createdSales,
//   };
// };

// const updateSale = async (id, { productId, quantity, priceSell, date }) => {
//   const existingSale = await prisma.sale.findUnique({ where: { id } });
//   if (!existingSale) {
//     const error = new Error("Sale not found.");
//     error.statusCode = 404;
//     throw error;
//   }

//   const product = await prisma.product.findUnique({
//     where: { id: productId || existingSale.productId },
//   });
//   if (!product) {
//     const error = new Error("Product not found.");
//     error.statusCode = 404;
//     throw error;
//   }

//   // Restore old stock, then deduct new quantity
//   const newQuantity = quantity || existingSale.quantity;
//   const newPriceSell = priceSell || Number(existingSale.priceSell);
//   const stockDiff = existingSale.quantity - newQuantity;

//   const restoredStock = product.stock + existingSale.quantity;
//   if (restoredStock < newQuantity) {
//     const error = new Error(`Insufficient stock. Available: ${restoredStock}`);
//     error.statusCode = 400;
//     throw error;
//   }

//   const total = newPriceSell * newQuantity;
//   const profit = (newPriceSell - Number(product.priceCost)) * newQuantity;

//   const [sale] = await prisma.$transaction([
//     prisma.sale.update({
//       where: { id },
//       data: {
//         productId: productId || existingSale.productId,
//         quantity: newQuantity,
//         priceSell: newPriceSell,
//         total,
//         profit,
//         date: date ? new Date(date) : existingSale.date,
//       },
//       include: { product: { select: { name: true, category: true } } },
//     }),
//     prisma.product.update({
//       where: { id: productId || existingSale.productId },
//       data: { stock: { increment: stockDiff } },
//     }),
//   ]);

//   return sale;
// };

// const deleteSale = async (id) => {
//   const sale = await prisma.sale.findUnique({ where: { id } });
//   if (!sale) {
//     const error = new Error("Sale not found.");
//     error.statusCode = 404;
//     throw error;
//   }

//   await prisma.$transaction([
//     prisma.sale.delete({ where: { id } }),
//     prisma.product.update({
//       where: { id: sale.productId },
//       data: { stock: { increment: sale.quantity } },
//     }),
//   ]);

//   return sale;
// };

// const sendToWhatsApp = async (data) => {
//   const { phoneNumber, message } = data;
//   // Implementation for sending to WhatsApp
//   // This function can be implemented using a third-party service or API
// };

// module.exports = {
//   getAllSales,
//   createSale,
//   updateSale,
//   deleteSale,
//   sendToWhatsApp,
// };

module.exports = {
  getAllDebt,
  payDebt,
};
