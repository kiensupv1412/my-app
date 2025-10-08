// server/middleware/auth.js
const { verifyAccess } = require("../utils/jwt");

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Missing access token" });
  try {
    const payload = verifyAccess(token);
    req.user = { id: payload.id, email: payload.email, name: payload.name };
    next();
  } catch (e) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid/Expired token" });
  }
}

module.exports = { auth };
