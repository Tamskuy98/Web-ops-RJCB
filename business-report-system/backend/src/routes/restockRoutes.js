const express = require('express');
const router = express.Router();
const restockController = require('../controllers/restockController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { restockSchema } = require('../utils/validators');

router.use(authenticate);

router.get('/', restockController.getAll);
router.post('/', authorize('admin', 'owner', 'warehouse'), validate(restockSchema), restockController.create);

module.exports = router;
