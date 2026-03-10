const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  if (err.name === 'ZodError' || err.issues) {
    return sendError(res, 400, 'Validation error', err.issues || err.errors);
  }

  if (err.code === 'P2002') {
    return sendError(res, 409, 'A record with this value already exists.');
  }

  if (err.code === 'P2025') {
    return sendError(res, 404, 'Record not found.');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  return sendError(res, statusCode, message);
};

module.exports = errorHandler;
