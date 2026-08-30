const prisma = require("../prisma/client");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const emailService = require("./emailService");

const register = async ({
  name,
  email,
  password,
  role,
  branch = "BKSI-PUP",
}) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error("Email already registered.");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      branch,
      status: "pending", // New registrations start as pending
    },
  });

  // Send approval request email to admins
  await emailService.sendRegistrationApprovalRequest({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branch: user.branch,
  });

  // Return pending status, no token yet
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      status: user.status,
    },
    message: "Registration successful! Awaiting admin approval.",
  };
};

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  // Check if user is approved
  if (user.status !== "approved") {
    const error = new Error(
      `Your account is ${user.status}. Please contact your administrator.`,
    );
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      status: user.status,
    },
    token,
  };
};

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branch: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Approve a pending user registration
 * @param {number} userId - User ID to approve
 * @returns {Promise<Object>} - Approved user
 */
const approveUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (user.status !== "pending") {
    const error = new Error(`User status is '${user.status}', cannot approve.`);
    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: "approved" },
  });

  // Send approval email
  await emailService.sendApprovalConfirmation(updatedUser);

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    branch: updatedUser.branch,
    status: updatedUser.status,
  };
};

/**
 * Reject a pending user registration
 * @param {number} userId - User ID to reject
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} - Rejected user
 */
const rejectUser = async (userId, reason = "") => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  if (user.status !== "pending") {
    const error = new Error(`User status is '${user.status}', cannot reject.`);
    error.statusCode = 400;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { status: "rejected" },
  });

  // Send rejection email
  await emailService.sendRejectionNotification(updatedUser, reason);

  return {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    branch: updatedUser.branch,
    status: updatedUser.status,
  };
};

/**
 * Get all pending user registrations
 * @returns {Promise<Array>} - Array of pending users
 */
const getPendingUsers = async () => {
  const pendingUsers = await prisma.user.findMany({
    where: { status: "pending" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branch: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return pendingUsers;
};

/**
 * Get all users with approval status
 * @param {string} status - Filter by status (optional): pending, approved, rejected
 * @returns {Promise<Array>} - Array of users
 */
const getAllUsers = async (status = null) => {
  const where = status ? { status } : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      branch: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
};

module.exports = {
  register,
  login,
  getMe,
  approveUser,
  rejectUser,
  getPendingUsers,
  getAllUsers,
};
