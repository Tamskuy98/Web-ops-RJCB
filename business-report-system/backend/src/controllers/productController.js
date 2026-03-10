const productService = require('../services/productService');
const { sendResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const { search } = req.query;
    const products = await productService.getAllProducts(search);
    sendResponse(res, 200, products);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const product = await productService.getProductById(parseInt(req.params.id));
    sendResponse(res, 200, product);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const product = await productService.createProduct(req.body);
    sendResponse(res, 201, product, 'Product created.');
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const product = await productService.updateProduct(parseInt(req.params.id), req.body);
    sendResponse(res, 200, product, 'Product updated.');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await productService.deleteProduct(parseInt(req.params.id));
    sendResponse(res, 200, null, 'Product deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
