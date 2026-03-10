const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { productSchema, productUpdateSchema } = require('../utils/validators');

router.use(authenticate);

router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', authorize('admin', 'owner'), validate(productSchema), productController.create);
router.put('/:id', authorize('admin', 'owner'), validate(productUpdateSchema), productController.update);
router.delete('/:id', authorize('admin'), productController.remove);

module.exports = router;
