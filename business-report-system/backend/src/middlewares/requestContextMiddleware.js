const { requestContext, getContext } = require("../utils/requestContext");
const { getSessionUser } = require("../utils/session");

const requestContextMiddleware = (req, res, next) => {
  const user = getSessionUser(req);

  const context = {
    userId: user?.id ?? null,
    username: user?.username ?? null,
    role: user?.role ?? null,
    branchName: user?.branchName ?? null,
  };

  console.log("CONTEXT BEFORE RUN:", context);

  requestContext.run(context, () => {
    console.log("CONTEXT INSIDE RUN:", getContext());
    next();
  });
};

module.exports = requestContextMiddleware;
