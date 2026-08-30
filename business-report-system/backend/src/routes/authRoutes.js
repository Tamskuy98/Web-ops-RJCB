const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate, authorize } = require("../middlewares/auth");
const validate = require("../middlewares/validate");
const { registerSchema, loginSchema } = require("../utils/validators");
const { getSessionUser } = require("../utils/session");

// Public routes
router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);

// Protected routes
router.get("/me", authenticate, authController.getMe);

// Admin routes - User management and approval
router.get(
  "/users/pending",
  authenticate,
  authorize("admin"),
  authController.getPendingUsers,
);
router.get(
  "/users",
  authenticate,
  authorize("admin"),
  authController.getAllUsers,
);
router.post(
  "/users/:userId/approve",
  authenticate,
  authorize("admin"),
  authController.approveUser,
);
router.post(
  "/users/:userId/reject",
  authenticate,
  authorize("admin"),
  authController.rejectUser,
);

router.get("/test-context", authController.testSesStoreUser);

module.exports = router;
