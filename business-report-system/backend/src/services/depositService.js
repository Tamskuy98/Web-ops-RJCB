const { empty } = require("@prisma/client/runtime/library");
const prisma = require("../prisma/client");

// const getAllDebt = async ({ search, startDate, endDate }) => {
//   const where = {};

//   if (startDate && endDate) {
//     where.date = {
//       gte: new Date(startDate),
//       lte: new Date(endDate + "T23:59:59.999Z"),
//     };
//   }

//   // if (search) {
//   //   where.debt = {
//   //     some: {
//   //       product: {
//   //         name: { contains: search },
//   //       },
//   //     },
//   //   };
//   // }

//   return prisma.debt.findMany({
//     where,
//     orderBy: { date: "desc" },
//   });
// };

const createDeposit = async (payload = {}) => {
  const data = payload;

  if (!Array.isArray(data.id) || data.id.length === 0) {
    throw new Error("Data id is error");
  }

  const result = await prisma.$transaction(async (tx) => {
    const sale = await tx.hsale.findMany({
      where: {
        id: {
          in: data.id,
        },
      },
    });

    //CHECK DEPOSITED
    const depositedIds = sale
      .filter((sale) => sale.isDeposit === "Y")
      .map((sale) => sale.id);

    if (depositedIds.length > 0) {
      throw new Error(`Sale already deposited: ${depositedIds.join(", ")}`);
    }

    // CHECK DUPLICATE ID
    const duplicateIds = data.id.filter(
      (id, index) => data.id.indexOf(id) !== index,
    );

    if (duplicateIds.length > 0) {
      throw new Error(
        `ID duplicated: ${[...new Set(duplicateIds)].join(", ")}`,
      );
    }

    // ID yang ada di database
    const dbIds = sale.map((item) => item.id);

    // CHECK MISSING ID
    const missingIds = data.id.filter((id) => !dbIds.includes(id));

    if (missingIds.length > 0) {
      throw new Error(`Sale not found for id ${missingIds.join(", ")}`);
    }

    // CHECK CASH
    const invalidCash = sale.find((item) => item.cash <= 0);

    if (invalidCash) {
      throw new Error("Total Cash not Found for Deposit");
    }

    // TOTAL DEPOSIT
    const totalDeposit = sale.reduce((sum, item) => sum + Number(item.cash), 0);

    if (totalDeposit !== Number(data.totalDeposit)) {
      throw new Error("Total Deposit not Match");
    }

    // UPDATE FLAG DEPOSIT
    await tx.hsale.updateMany({
      where: {
        id: {
          in: dbIds,
        },
      },
      data: {
        isDeposit: "Y",
      },
    });

    const strId = dbIds.map((id) => `'${id}'`).join(",");

    const deposit = await tx.deposit.create({
      data: {
        hsaleId: strId,
        totalDeposit,
        receivedBy: "OWNER",
        date: new Date(),
      },
    });

    return deposit;
  });

  return result;
};

const useCashHold = async (cashHold) => {
  // const Hold = cashHold;
  // return console.log(Hold);

  const sales = await prisma.hsale.findMany({
    where: {
      cash: {
        gt: 0,
      },
      isDeposit: "N",
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      cash: true,
    },
  });

  let remaining = cashHold;
  const updates = [];
  // return console.log(cashHold);

  for (const sale of sales) {
    if (remaining <= 0) break;

    const payment = Math.min(remaining, sale.cash);

    updates.push(
      prisma.hsale.update({
        where: {
          id: sale.id,
        },
        data: {
          cash: sale.cash - payment,
        },
      }),
    );

    remaining -= payment;
  }

  if (updates.length > 0) {
    await prisma.$transaction(updates);
  }
};

module.exports = {
  createDeposit,
  useCashHold,
};
