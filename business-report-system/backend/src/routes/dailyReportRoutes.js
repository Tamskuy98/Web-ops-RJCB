const express = require('express');
const dailyReportController = require('../controllers/dailyReportController');
const validate = require('../middlewares/validate');
const { dailyReportSchema } = require('../utils/validators');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

/**
 * POST /api/daily-report
 * Public endpoint - no authentication required
 * Validates PIN and saves daily report with expenses
 */
router.post('/', validate(dailyReportSchema), dailyReportController.create);

/**
 * GET /api/daily-report/reports
 * Get all daily reports - admin only
 */
router.get('/reports', authenticate, authorize('admin', 'owner'), dailyReportController.getAll);

module.exports = router;
