const restockService = require('../services/restockService');
const { sendResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const restocks = await restockService.getAllRestocks();
    sendResponse(res, 200, restocks);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const restock = await restockService.createRestock(req.body);
    sendResponse(res, 201, restock, 'Restock recorded.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create };
