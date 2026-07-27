const operationalService = require("../services/operationalService");
const { sendResponse } = require("../utils/response");

const getAll = async (req, res, next) => {
  try {
    const items = await operationalService.getAlloperational();
    sendResponse(res, 200, items);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const item = await operationalService.createoperational(req.body);
    sendResponse(res, 201, item, "operational goods recorded.");
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await operationalService.deleteoperational(parseInt(req.params.id));
    sendResponse(res, 200, null, "operational record deleted.");
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, remove };
