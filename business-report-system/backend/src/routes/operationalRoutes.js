const express = require("express");
const router = express.Router();
const operationalController = require("../controllers/operationalController");
const { authenticate, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { operationalSchema } = require("../utils/validators");

router.use(authenticate);

router.get("/", operationalController.getAll);
router.post(
  "/",
  authorize("admin", "owner", "warehouse"),
  validate(operationalSchema),
  operationalController.create,
);
router.delete("/:id", authorize("admin"), operationalController.remove);

module.exports = router;
