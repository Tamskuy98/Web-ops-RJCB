const { AsyncLocalStorage } = require("async_hooks");

const requestContext = new AsyncLocalStorage();

const getContext = () => {
  return requestContext.getStore();
};

module.exports = {
  requestContext,
  getContext,
};