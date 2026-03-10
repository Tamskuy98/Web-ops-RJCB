const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { authenticate } = require('../middlewares/auth');

router.use(authenticate);

router.get('/sales/csv', exportController.exportSalesCSV);
router.get('/sales/excel', exportController.exportSalesExcel);
router.get('/sales/pdf', exportController.exportSalesPDF);

module.exports = router;
