// server/middleware/auth.js
const UserTokens = require("../models/user_tokens.model");
const Users = require("../models/users.model");
const { verifySessionCookie } = require("../utils/session");

const NonAuthenticatedPaths = ["/api/_auth/session", "/api/"];
const AdminPaths = ["/api/"];

function startsWithAny(path, list) {
  return list.some((p) => path.startsWith(p));
}

async function auth(req, res, next) {
  try {
    // Cho phép preflight
    if (req.method === "OPTIONS") return next();

    const path = req.path || req.originalUrl || "";
    if (!path.startsWith("/api")) return next();
    if (startsWithAny(path, NonAuthenticatedPaths)) return next();

    const sess = await verifySessionCookie(req);
    if (!sess?.sub) return res.status(401).json({ message: "Unauthorized" });

    // Lấy user & tokens từ DB
    const user = await Users.findByPk(sess.sub);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    const tokens = await UserTokens.findOne({
      where: { user_id: user.id, provider: "google" },
      order: [["id", "DESC"]],
    });
    if (!tokens?.access_token) {
      return res.status(401).json({ message: "No Google tokens" });
    }

    // Chặn admin nếu cần (nếu chưa có cột role, dùng email)
    if (startsWithAny(path, AdminPaths)) {
      const isAdmin =
        user.email === "harlan@harlanzw.com" || user.role === "admin";
      if (!isAdmin) return res.status(401).json({ message: "Unauthorized" });
    }

    req.authenticatedData = { user, tokens };
    req.user = user;
    next();
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[auth middleware]", e);
    }
    res.status(401).json({ message: "Unauthorized" });
  }
}

module.exports = { auth };
