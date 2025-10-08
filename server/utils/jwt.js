const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

const signAccess = (payload) =>
  jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: Number(process.env.ACCESS_EXPIRES),
  });

const signRefresh = (payload) =>
  jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: Number(process.env.REFRESH_EXPIRES),
  });

const verifyAccess = (token) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET);

const verifyRefresh = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET);

module.exports = {
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh,
};
