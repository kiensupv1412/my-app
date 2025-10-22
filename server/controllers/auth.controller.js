// server/controllers/auth.controller.js

const { UnauthorizedError } = require("../error");
const {
  buildGoogleAuthUrl,
  exchangeCodeForTokens,
  fetchGoogleProfile,
} = require("../utils/google-oauth");
const { signSessionCookie, clearSessionCookie } = require("../utils/session");
const {
  upsertUserByGoogle,
  storeUserToken,
  revokeGoogleToken,
} = require("../utils/storage");

const WEB_APP_URL = process.env.WEB_APP_URL || "http://localhost:3000";

async function startGoogleOAuth(req, res) {
  const ref = req.query.ref || `${WEB_APP_URL}/`;
  const url = buildGoogleAuthUrl({ state: encodeURIComponent(ref) });
  return res.redirect(url);
}

async function googleCallback(req, res) {
  const code = req.query.code;
  const state = req.query.state
    ? decodeURIComponent(req.query.state)
    : `${WEB_APP_URL}/`;

  if (!code) throw new UnauthorizedError();

  // Đổi code lấy tokens
  const tokens = await exchangeCodeForTokens(code);

  // Lấy profile Google
  const profile = await fetchGoogleProfile(tokens);
  if (!profile?.email) throw new UnauthorizedError();

  // Upsert user trong DB
  const user = await upsertUserByGoogle({
    email: profile.email,
    name: profile.name || profile.email.split("@")[0],
    picture: profile.picture || null,
  });

  // Lưu tokens (refresh/access) để gọi API Google sau này
  await storeUserToken(user.userId, tokens);

  // Ký session cookie cho frontend
  await signSessionCookie(res, {
    sub: String(user.userId),
    user: {
      userId: user.userId,
      email: user.email,
      name: user.name,
      picture: user.picture || null,
      analyticsPeriod: user.analyticsPeriod || "7d",
      hiddenSites: user.hiddenSites || [],
    },
    tokens: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      token_type: tokens.token_type,
      scope: tokens.scope,
      id_token: tokens.id_token,
    },
  });

  // Quay về app
  return res.redirect(state || WEB_APP_URL);
}

async function logout(req, res) {
  const revoke = req.query.revoke === "1";

  // Nếu muốn, có thể revoke token Google
  if (revoke && req.userTokens?.refresh_token) {
    try {
      await revokeGoogleToken(req.userTokens);
    } catch (e) {
      // không chặn logout vì revoke fail
    }
  }

  clearSessionCookie(res);
  res.json({ ok: true });
}

module.exports = { startGoogleOAuth, googleCallback, logout };
