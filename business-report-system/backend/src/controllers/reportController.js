const reportService = require('../services/reportService');
const { sendResponse } = require('../utils/response');

const salesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, productId } = req.query;
    const report = await reportService.getSalesReport({ startDate, endDate, productId });
    sendResponse(res, 200, report);
  } catch (error) {
    next(error);
  }
};

const profitReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const report = await reportService.getProfitReport({ startDate, endDate });
    sendResponse(res, 200, report);
  } catch (error) {
    next(error);
  }
};

const revenueShare = async (req, res, next) => {
  try {
    const { ownerPercentage, partnerPercentage, startDate, endDate } = req.query;
    const report = await reportService.getRevenueShare({
      ownerPercentage: parseFloat(ownerPercentage) || 60,
      partnerPercentage: parseFloat(partnerPercentage) || 40,
      startDate,
      endDate,
    });
    sendResponse(res, 200, report);
  } catch (error) {
    next(error);
  }
};

const monthlySales = async (req, res, next) => {
  try {
    const data = await reportService.getMonthlySales();
    sendResponse(res, 200, data);
  } catch (error) {
    next(error);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const stats = await reportService.getDashboardStats();
    sendResponse(res, 200, stats);
  } catch (error) {
    next(error);
  }
};

module.exports = { salesReport, profitReport, revenueShare, monthlySales, dashboard };
