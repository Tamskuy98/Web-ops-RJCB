const express = require("express");
const router = express.Router();
const debtController = require("../controllers/debtController");
const { authenticate, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { PaydebtSchema } = require("../utils/validators");

router.use(authenticate);

router.get("/", debtController.getAll);

router.post(
  "/",
  authorize("admin", "owner"),
  validate(PaydebtSchema),
  debtController.payDebt,
);

// router.put(
//   "/:id",
//   authorize("admin", "owner"),
//   validate(saleSchema),
//   saleController.update,
// );
// router.delete("/:id", authorize("admin"), saleController.remove);

// //SEND TO WA
// router.post(
//   "/send-to-wa",
//   authorize("admin", "owner"),
//   validate(saleSchema),
//   saleController.sendToWhatsApp,
// );

module.exports = router;
