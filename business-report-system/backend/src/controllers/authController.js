const authService = require('../services/authService');
const { sendResponse } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    sendResponse(res, 201, result, 'Registration successful.');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    sendResponse(res, 200, result, 'Login successful.');
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

module.exports = { register, login, getMe };
