const saleService = require("../services/saleService");
const { sendResponse } = require("../utils/response");

const getAll = async (req, res, next) => {
  try {
    const { search, startDate, endDate } = req.query;
    const sales = await saleService.getAllSales({ search, startDate, endDate });
    sendResponse(res, 200, sales);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const sale = await saleService.createSale(req.body);
    sendResponse(res, 201, sale, "Sale recorded.");
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const sale = await saleService.updateSale(
      parseInt(req.params.id),
      req.body,
    );
    sendResponse(res, 200, sale, "Sale updated.");
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await saleService.deleteSale(parseInt(req.params.id));
    sendResponse(res, 200, null, "Sale deleted.");
  } catch (error) {
    next(error);
  }
};

const sendToWhatsApp = async (req, res, next) => {
  try {
    // Implementation for sending to WhatsApp
    const sendwa = await saleService.sendToWhatsApp(req.body);
    sendResponse(res, 200, null, "Message sent to WhatsApp.");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, update, remove, sendToWhatsApp };
