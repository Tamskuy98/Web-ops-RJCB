const createSession = (req, user) => {
  req.session.user = {
    id: user.id,
    username: user.name,
    role: user.role,
    branchName: user.branch,
  };
};

const getSessionUser = (req) => {
  return req.session?.user ?? null;
};

const destroySession = (req) => {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    });
  });
};

module.exports = {
  createSession,
  getSessionUser,
  destroySession,
};
