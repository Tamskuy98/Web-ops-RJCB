const express = require('express');
const router = express.Router();
const incomingController = require('../controllers/incomingController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { incomingSchema } = require('../utils/validators');

router.use(authenticate);

router.get('/', incomingController.getAll);
router.post('/', authorize('admin', 'owner', 'warehouse'), validate(incomingSchema), incomingController.create);
router.delete('/:id', authorize('admin'), incomingController.remove);

module.exports = router;
