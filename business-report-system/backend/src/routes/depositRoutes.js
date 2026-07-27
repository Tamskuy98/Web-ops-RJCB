const express = require("express");
const router = express.Router();
const depositController = require("../controllers/depositController");
const { authenticate, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { depositCreateSchema } = require("../utils/validators");

router.use(authenticate);

// router.get("/", depositController.getAll);
router.post(
  "/",
  authorize("admin", "owner"),
  validate(depositCreateSchema),
  depositController.create,
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
