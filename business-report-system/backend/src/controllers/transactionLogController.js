const transactionLogService = require("../services/transactionLogService");
const { sendResponse } = require("../utils/response");

const getAll = async (req, res, next) => {
  try {
    const { startDate, endDate, modul, type } = req.query;
    const logs = await transactionLogService.listTransactionLogs({
      startDate,
      endDate,
      modul,
      type,
    });
    sendResponse(res, 200, logs, "Transaction logs retrieved.");
  } catch (error) {
    next(error);
  }
};

const getDetail = async (req, res, next) => {
  try {
    const detail = await transactionLogService.getTransactionLogDetail(
      req.params.id,
    );
    sendResponse(res, 200, detail, "Transaction log detail retrieved.");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getDetail };
