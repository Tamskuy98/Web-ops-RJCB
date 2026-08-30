const authService = require("../services/authService");
const { createSession } = require("../utils/session");
const { sendResponse } = require("../utils/response");
const { getContext } = require("../utils/requestContext");

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    sendResponse(
      res,
      201,
      result,
      "Registration successful. Please wait for admin approval.",
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    createSession(req, result.user);
    // console.log("SESSION USER:", req.session.user);
    sendResponse(res, 200, result, "Login successful.");
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    sendResponse(res, 200, user);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all pending user registrations (Admin only)
 */
const getPendingUsers = async (req, res, next) => {
  try {
    const pendingUsers = await authService.getPendingUsers();
    sendResponse(
      res,
      200,
      pendingUsers,
      "Pending users retrieved successfully.",
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all users with optional filtering by status (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { status } = req.query;
    const users = await authService.getAllUsers(status);
    sendResponse(res, 200, users, "Users retrieved successfully.");
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a pending user registration (Admin only)
 */
const approveUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await authService.approveUser(parseInt(userId));
    sendResponse(
      res,
      200,
      user,
      "User approved successfully. Confirmation email sent.",
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reject a pending user registration (Admin only)
 */
const rejectUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const user = await authService.rejectUser(parseInt(userId), reason);
    sendResponse(res, 200, user, "User rejected. Notification email sent.");
  } catch (error) {
    next(error);
  }
};

const testSesStoreUser = async (req, res) => {
  console.log("CONTROLLER CONTEXT:", getContext());

  return res.json({
    context: getContext(),
  });
};

module.exports = {
  register,
  login,
  getMe,
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  testSesStoreUser,
};
