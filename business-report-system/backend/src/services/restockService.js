const prisma = require("../prisma/client");
const { useCashHold } = require("./depositService.js");

const getAllRestocks = async () => {
  return prisma.restock.findMany({
    include: {
      restockDetail: true,
      debt: true,
    },
    orderBy: { date: "desc" },
  });
};

const createRestock = async (payload = {}) => {
  try {
    const data = payload?.data ?? payload;
    const items = Array.isArray(data?.items) ? data.items : [];

    // VALIDASI REQUIRED FIELDS
    if (!data?.typePayment) {
      throw new Error("typePayment is required");
    }
    if (items.length === 0) {
      throw new Error("items cannot be empty");
    }
    if (!data?.supplier) {
      throw new Error("supplier is required");
    }

    // HANDLE ALLQTY
    const totalQuantity = items.reduce(
      (sum, item) => sum + Number(item.qty || 0),
      0,
    );

    if (Number(totalQuantity) !== Number(data.allQty)) {
      throw new Error("All Quantity not Match");
    }

    // HANDLE TOTALPAYMENT
    const totalPayment = items.reduce(
      (sum, item) => sum + Number(item.price || 0),
      0,
    );

    if (Number(totalPayment) !== Number(data.totalPayment)) {
      throw new Error("Total Payment not Match");
    }

    // HANDLE CASH PAYMENT (CASHONHAND, CASHHOLD, QRIS)
    const cashOnHand = Number(data.cashOnHand || 0);
    const cashHold = Number(data.cashHold || 0);
    const qris = Number(data.qris || 0);

    const cekPayment = cashOnHand + cashHold + qris;
    if (Number(cekPayment) >= Number(totalPayment)) {
      throw new Error("Total Payment not Match");
    }

    // HANDLE TYPEPAYMENT
    const tempType = [];
    if (cashOnHand > 0) tempType.push("CASH ON HAND");
    if (cashHold > 0) tempType.push("CASH HOLD");
    if (qris > 0) tempType.push("QRIS");
    const typePayment = tempType.join(";") || "HUTANG";

    // HANDLE OUTSTANDINGPAY
    const outstandingPay = totalPayment - (cashOnHand + cashHold + qris);

    if (Number(outstandingPay) !== Number(data.outstandingPay)) {
      throw new Error("Total debt not Match");
    }

    if (
      Number(data.outstandingPay) &&
      Number(data.outstandingPay) !== Number(outstandingPay)
    ) {
      throw new Error("Outstanding Payment not Match");
    }

    // HANDLE STATUS
    const status = outstandingPay > 0 ? "HUTANG" : "LUNAS";

    // HANDLE ATTACHMENT TYPE
    const attachmentType =
      data.attachmentType?.toUpperCase() === "FOTO"
        ? "FOTO"
        : data.attachmentType?.toUpperCase() === "URL"
          ? "URL"
          : null;

    // HANDLE CATEGORY
    const category =
      data?.category && data.category !== "" ? data.category : "RESTOCK";

    const result = await prisma.$transaction(async (tx) => {
      // CREATE RESTOCK RECORD
      const restock = await tx.restock.create({
        data: {
          allQty: totalQuantity,
          totalPayment: totalPayment,
          typePayment: typePayment,
          cashOnHand: cashOnHand,
          cashHold: cashHold,
          qris: qris,
          supplier: data.supplier,
          date: data?.date ? new Date(data.date) : new Date(),
          attachment: data.attachment,
          attachmentType: attachmentType,
          note: data.note,
          category: category,
          outstandingPay: outstandingPay > 0 ? outstandingPay : 0,
          status: status,
        },
      });

      if (cashHold > 0) {
        await useCashHold(cashHold);
      }

      // CREATE RESTOCK DETAILS & UPDATE PRODUCT STOCK
      for (const item of items) {
        const productId = item.productid || item.product_id || item.productId;

        // Check product exists
        const product = await tx.product.findUnique({
          where: { id: Number(productId) },
        });

        if (!product) {
          throw new Error(`Product with id ${productId} not found`);
        }

        // Create restock detail
        await tx.restockDetail.create({
          data: {
            restockId: restock.id,
            productId: Number(productId),
            name: item.name || product.name,
            qty: Number(item.qty || 0),
            price: Number(item.price || 0),
          },
        });

        // Update product stock
        await tx.product.update({
          where: { id: Number(productId) },
          data: {
            stock: { increment: Number(item.qty || 0) },
          },
        });
      }

      // CREATE DEBT RECORD JIKA ADA OUTSTANDING PAYMENT
      if (outstandingPay > 0) {
        await tx.debt.create({
          data: {
            restockId: restock.id,
            totalDebt: outstandingPay,
            nameDebt: data.supplier,
            type: "restock",
            outstandingPay: outstandingPay,
            status: "HUTANG",
            date: new Date(),
          },
        });
      }

      return restock.id;
    });

    // RETURN COMPLETE DATA
    return await prisma.restock.findUnique({
      where: { id: result },
      include: {
        restockDetail: {
          include: {
            product: {
              select: { id: true, name: true, category: true, stock: true },
            },
          },
        },
        debt: true,
      },
    });
  } catch (error) {
    console.error("Error creating restock:", error);
    throw error;
  }
};

module.exports = { getAllRestocks, createRestock };
