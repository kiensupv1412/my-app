// server/controllers/user.controller.js

const { verifySessionCookie } = require("../utils/session");

async function getSession(req, res) {
  // Đọc cookie -> verify -> trả về user session
  const data = await verifySessionCookie(req);
  if (!data) return res.status(200).json({ user: null });
  res.json({ user: data.user, sub: data.sub });
}

module.exports = { getSession };
