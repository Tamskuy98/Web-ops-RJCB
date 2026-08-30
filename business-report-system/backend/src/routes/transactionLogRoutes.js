const express = require("express");
const router = express.Router();
const transactionLogController = require("../controllers/transactionLogController");
const { authenticate } = require("../middlewares/auth");

router.use(authenticate);

router.get("/", transactionLogController.getAll);
router.get("/:id", transactionLogController.getDetail);

module.exports = router;
