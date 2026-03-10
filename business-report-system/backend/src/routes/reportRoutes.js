const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/dashboard', reportController.dashboard);
router.get('/sales', reportController.salesReport);
router.get('/profit', reportController.profitReport);
router.get('/revenue-share', reportController.revenueShare);
router.get('/monthly-sales', reportController.monthlySales);

module.exports = router;
