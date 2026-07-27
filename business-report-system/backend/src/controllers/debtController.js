const debtService = require("../services/debtService");
const { sendResponse } = require("../utils/response");

const getAll = async (req, res, next) => {
  try {
    const { search, startDate, endDate } = req.query;
    const debt = await debtService.getAllDebt({ search, startDate, endDate });
    sendResponse(res, 200, debt);
  } catch (error) {
    next(error);
  }
};

const payDebt = async (req, res, next) => {
  try {
    console.log(req.body);
    const data = await debtService.payDebt(req.body);
    sendResponse(res, 201, data, "payment debt recorded.");
  } catch (error) {
    next(error);
  }
};

// const update = async (req, res, next) => {
//   try {
//     const sale = await saleService.updateSale(
//       parseInt(req.params.id),
//       req.body,
//     );
//     sendResponse(res, 200, sale, "Sale updated.");
//   } catch (error) {
//     next(error);
//   }
// };

// const remove = async (req, res, next) => {
//   try {
//     await saleService.deleteSale(parseInt(req.params.id));
//     sendResponse(res, 200, null, "Sale deleted.");
//   } catch (error) {
//     next(error);
//   }
// };

// const sendToWhatsApp = async (req, res, next) => {
//   try {
//     // Implementation for sending to WhatsApp
//     const sendwa = await saleService.sendToWhatsApp(req.body);
//     sendResponse(res, 200, null, "Message sent to WhatsApp.");
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = { getAll, payDebt, update, remove, sendToWhatsApp };
module.exports = { getAll, payDebt };
