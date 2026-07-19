const prisma = require("../prisma/client");

const getAlloperational = async () => {
  return prisma.operational.findMany({
    include: { opsdetail: true, debt: true },
    orderBy: { date: "desc" },
  });
};

const createoperational = async (payload = {}) => {
  try {
    const data = payload?.data ?? payload;
    const items = Array.isArray(data?.items) ? data.items : [];

    if (!data?.typePayment) {
      throw new Error("typePayment is required");
    }
    if (items.length === 0) {
      throw new Error("items cannot be empty");
    }

    //HANDLE ALLQTY
    const totalQuantity = items.reduce(
      (sum, item) => sum + Number(item.qty || 0),
      0,
    );

    if (Number(totalQuantity) !== Number(data.allQty)) {
      return "All Quantity not Match";
    }

    //HANDLE TYPEPAYMENT
    const tempType = [];
    if (Number(data.cashOnHand) > 0) tempType.push("CASH ON HAND");
    if (Number(data.cashHold) > 0) tempType.push("CASH HOLD");
    if (Number(data.qris) > 0) tempType.push("QRIS");
    const typePayment = tempType.join(";");

    //HANDLE TOTALPAYMENT
    const totalPayment = items.reduce(
      (sum, item) => sum + Number(item.totalPrice || 0),
      0,
    );

    if (Number(totalPayment) !== Number(data.totalPayment)) {
      return "Total Payment not Match";
    }

    //HANDLE CASH PAYMENT (CASHONHAND, CASHHOLD, QRIS)
    const cashOnHand = Number(data.cashOnHand);
    const cashHold = Number(data.cashHold);
    const qris = Number(data.qris);

    //HANDLE STATUS
    const status = data.outstandingPayment > 0 ? "HUTANG" : "LUNAS";

    //SUPLIER ON FE
    //DATE ON PRISMA
    //ATTACHEMENT ON FE HOLD

    //ATTACHMENT TYPE
    const attachmentType =
      data.attachementType === "FOTO" || "foto"
        ? "FOTO"
        : data.attachementType === "URL" || "url"
          ? "URL"
          : null;

    //HANDLE NOTE ON FE

    //HANDLE CATEGORY
    const category = data?.category === null ? "OPERATIONAL" : "OTHER";

    //HANDLE OUTSTANDINGPAY
    const outstandingPay = totalPayment - (cashOnHand + cashHold + qris);
    if (Number(data.outstandingPay) !== Number(outstandingPay)) {
      return "Outstanding Payment not Match";
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create operational record
      const operational = await tx.operational.create({
        data: {
          allQty: totalQuantity,
          typePayment: typePayment,
          totalPayment: totalPayment,
          cashOnHand: cashOnHand,
          cashHold: cashHold,
          qris: qris,
          status: status,
          supplier: data.supplier,
          date: data?.date ? new Date(data.date) : new Date(),
          attachment: data.attachment,
          attachmentType: attachmentType,
          note: data.note,
          category: category,
          outstandingPay: outstandingPay,
        },
      });

      // Create operational details
      if (items.length > 0) {
        await tx.opsdetail.createMany({
          data: items.map((item) => ({
            operationalId: operational.id,
            name: item.name,
            price: Number(item.price || 0),
            qty: Number(item.qty || 0),
            totalPrice: Number(item.totalPrice || 0),
          })),
        });
      }

      // Create debt record jika ada outstanding payment
      if (outstandingPay > 0) {
        await tx.debt.create({
          data: {
            totalDebt: outstandingPay,
            nameDebt: "OWNER",
            operationalId: operational.id,
            type: "operational",
            outstandingPay: outstandingPay,
            status: "HUTANG",
            date: new Date(),
          },
        });
      }
      return operational.id;
    });

    // 6. Return complete data
    return await prisma.operational.findUnique({
      where: { id: result },
      include: {
        opsdetail: true,
        debt: true,
      },
    });
  } catch (error) {
    console.error("Error creating operational:", error);
    throw error;
  }
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

  await prisma.$transaction(async (tx) => {
    await tx.operational.delete({ where: { id } });
  });

  return operational;
};

module.exports = { getAlloperational, createoperational, deleteoperational };
