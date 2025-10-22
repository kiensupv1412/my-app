// server/routes/auth.routes.js

const { Router } = require("express");
const { asyncWrap } = require("../utils/http");
const {
  startGoogleOAuth,
  googleCallback,
  logout,
} = require("../controllers/auth.controller");

const router = Router();

// B1: Redirect sang Google
router.get("/google", asyncWrap(startGoogleOAuth));

// B2: Callback từ Google
router.get("/google/callback", asyncWrap(googleCallback));

// Logout (revoke optional)
router.post("/logout", asyncWrap(logout));

module.exports = router;
