const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");
const { authenticate, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { saleSchema, saleCreateSchema } = require("../utils/validators");

router.use(authenticate);

router.get("/", saleController.getAll);
router.post(
  "/",
  authorize("admin", "owner"),
  validate(saleCreateSchema),
  saleController.create,
);
router.put(
  "/:id",
  authorize("admin", "owner"),
  validate(saleSchema),
  saleController.update,
);
router.delete("/:id", authorize("admin"), saleController.remove);

//SEND TO WA
router.post(
  "/send-to-wa",
  authorize("admin", "owner"),
  validate(saleSchema),
  saleController.sendToWhatsApp,
);

module.exports = router;
