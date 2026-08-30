const prisma = require("../prisma/client");
const { getContext } = require("../utils/requestContext");

const BALANCE_TYPES = {
  CASH_UNSETTLED: "CASH H",
  CASH_SETTLED: "CASH S",
  QRIS: "QRIS",
  DEBT: "HUTANG",
};

const getCreatedBy = () => {
  const context = getContext() || {};
  if (context.username || context.role) {
    return [context.username, context.role].filter(Boolean).join("-");
  }
  return null;
};

const createTransactionLog = async ({
  db = prisma,
  modulId,
  modul,
  balanceType,
  type,
  amount,
  balanceBefore,
  status = "success",
  createdBy,
  createdDate = new Date(),
}) => {
  const numericAmount = Number(amount) || 0;
  const numericBefore = Number(balanceBefore) || 0;
  const numericAfter =
    type === "OUT"
      ? numericBefore - numericAmount
      : numericBefore + numericAmount;

  if (numericAmount <= 0) return null;

  return db.logTransaction.create({
    data: {
      refId: `${modul}-${modulId}`,
      total: numericAmount,
      modul,
      typePayment: balanceType,
      type,
      before: numericBefore,
      after: numericAfter,
      status,
      created_by: createdBy ?? getCreatedBy(),
      created_date: createdDate,
    },
  });
};

const createTransactionLogs = async ({
  db = prisma,
  modulId,
  modul,
  entries,
  createdBy,
  createdDate,
}) => {
  const logs = [];
  for (const entry of entries) {
    const log = await createTransactionLog({
      db,
      modulId,
      modul,
      ...entry,
      createdBy,
      createdDate,
    });
    if (log) logs.push(log);
  }
  return logs;
};

const listTransactionLogs = async ({ startDate, endDate, modul, type }) => {
  const where = {};
  if (startDate || endDate) {
    where.created_date = {};
    if (startDate) where.created_date.gte = new Date(startDate);
    if (endDate) {
      where.created_date.lte = new Date(`${endDate}T23:59:59.999Z`);
    }
  }
  if (modul) where.modul = modul;
  if (type) where.type = type;

  const logs = await prisma.logTransaction.findMany({
    where,
    orderBy: { created_date: "desc" },
  });

  return logs.map((log) => ({
    id: log.id,
    amount: Number(log.total),
    type: log.type,
    balanceType: log.typePayment || "-",
    modul: log.modul,
    refId: log.refId,
    status: log.status,
    description: `${log.modul} - ${log.typePayment || "Transaksi"}`,
    date: log.created_date,
    source: log.typePayment || "-",
    paymentMethod: log.typePayment || "-",
    createdBy: log.created_by || "-",
    transactionId: log.refId,
    balanceBefore: Number(log.before),
    balanceAfter: Number(log.after),
  }));
};

const getTransactionLogDetail = async (id) => {
  const log = await prisma.logTransaction.findUnique({
    where: { id: Number(id) },
  });

  if (!log) {
    const error = new Error("Transaction log not found.");
    error.statusCode = 404;
    throw error;
  }

  const sourceId = Number(String(log.refId).split("-").pop());
  let detail = null;

  if (log.modul === "sales") {
    detail = await prisma.hsale.findUnique({
      where: { id: sourceId },
      include: {
        sales: {
          include: {
            product: { select: { id: true, name: true, category: true } },
          },
        },
      },
    });
  } else if (log.modul === "operational") {
    detail = await prisma.operational.findUnique({
      where: { id: sourceId },
      include: { opsdetail: true, debt: true },
    });
  } else if (log.modul === "restock") {
    detail = await prisma.restock.findUnique({
      where: { id: sourceId },
      include: { restockDetail: true, debt: true },
    });
  } else if (log.modul === "paydebt") {
    detail = await prisma.paydebt.findUnique({ where: { id: sourceId } });
  }

  return {
    id: log.id,
    amount: Number(log.total),
    type: log.type,
    balanceType: log.typePayment || "-",
    modul: log.modul,
    refId: log.refId,
    status: log.status,
    date: log.created_date,
    source: log.typePayment || "-",
    paymentMethod: log.typePayment || "-",
    createdBy: log.created_by || "-",
    transactionId: log.refId,
    balanceBefore: Number(log.before),
    balanceAfter: Number(log.after),
    detail,
  };
};

module.exports = {
  BALANCE_TYPES,
  createTransactionLog,
  createTransactionLogs,
  listTransactionLogs,
  getTransactionLogDetail,
};
