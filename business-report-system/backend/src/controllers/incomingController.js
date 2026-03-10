const incomingService = require('../services/incomingService');
const { sendResponse } = require('../utils/response');

const getAll = async (req, res, next) => {
  try {
    const items = await incomingService.getAllIncoming();
    sendResponse(res, 200, items);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const item = await incomingService.createIncoming(req.body);
    sendResponse(res, 201, item, 'Incoming goods recorded.');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await incomingService.deleteIncoming(parseInt(req.params.id));
    sendResponse(res, 200, null, 'Incoming record deleted.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, remove };
