const dailyReportService = require('../services/dailyReportService');
const { sendResponse } = require('../utils/response');

/**
 * POST /daily-report
 * Create daily report without authentication
 * Validates PIN before saving
 */
const create = async (req, res, next) => {
  try {
    const result = await dailyReportService.createDailyReport(req.body);

    sendResponse(
      res,
      201,
      {
        saleId: result.sale.id,
        saleDetails: result.sale,
        expenses: result.expenses,
        whatsappMessage: result.whatsappMessage,
      },
      'Daily report recorded successfully.'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /daily-report/reports
 * Get all daily reports (admin only)
 */
const getAll = async (req, res, next) => {
  try {
    const { startDate, endDate, search } = req.query;
    const reports = await dailyReportService.getDailyReports({
      startDate,
      endDate,
      search,
    });

    sendResponse(res, 200, reports, 'Daily reports retrieved successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  getAll,
};
