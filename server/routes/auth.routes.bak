const express = require("express");
const User = require("../models/user.model");
const { signAccess, signRefresh, verifyRefresh } = require("../utils/jwt");

const router = express.Router();

// Helper set cookie refresh
function setRefreshCookie(res, token) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: Number(process.env.REFRESH_EXPIRES) * 1000,
  });
}

// POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || !password || !name)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const exists = await User.findOne({ where: { email } });
    if (exists)
      return res
        .status(409)
        .json({ success: false, message: "Email already registered" });

    const user = await User.create({ email, password, name });
    const payload = { id: user.id, email: user.email, name: user.name };
    const access = signAccess(payload);
    const refresh = signRefresh(payload);
    setRefreshCookie(res, refresh);

    return res.json({ success: true, access_token: access, user: payload });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const payload = { id: user.id, email: user.email, name: user.name };
    const access = signAccess(payload);
    const refresh = signRefresh(payload);
    setRefreshCookie(res, refresh);

    return res.json({ success: true, access_token: access, user: payload });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "Missing refresh token" });

    const payload = verifyRefresh(token);
    const data = { id: payload.id, email: payload.email, name: payload.name };

    // rotate refresh
    const newRefresh = signRefresh(data);
    setRefreshCookie(res, newRefresh);

    const access = signAccess(data);
    return res.json({ success: true, access_token: access, user: data });
  } catch (e) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid/Expired refresh token" });
  }
});

// POST /auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("refresh_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
  });
  return res.json({ success: true });
});

// GET /auth/me (cần access token)
const { auth } = require("../middleware/auth");
router.get("/me", auth, async (req, res) => {
  return res.json({ success: true, user: req.user });
});

module.exports = router;
