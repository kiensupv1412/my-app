// server/utils/session.js
const jwt = require("jsonwebtoken");

const COOKIE = process.env.SESSION_COOKIE_NAME || "sid";
const SECRET = process.env.SESSION_SECRET || "change_me";
const SECURE = String(process.env.SESSION_COOKIE_SECURE || "false") === "true";
const COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN || undefined;
// sameSite: 'lax' (same-site) | 'none' (cross-site cần Secure)
const SAMESITE =
  process.env.SESSION_COOKIE_SAMESITE || (SECURE ? "none" : "lax");

async function signSessionCookie(res, payload) {
  // ❌ Không nhét tokens vào JWT
  const token = jwt.sign(
    {
      sub: String(payload.sub),
      // chỉ giữ thông tin nhẹ; có thể bỏ luôn "user" nếu muốn
      user: {
        userId: payload.user.userId,
        email: payload.user.email,
        name: payload.user.name,
        picture: payload.user.picture ?? null,
      },
    },
    SECRET,
    { expiresIn: "7d" }
  );

  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: SAMESITE, // 'lax' or 'none'
    secure: SECURE, // bắt buộc true nếu sameSite='none'
    path: "/",
    domain: COOKIE_DOMAIN, // nếu cần dùng subdomain chung
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function verifySessionCookie(req) {
  const raw = req.cookies?.[COOKIE];
  if (!raw) return null;
  try {
    return jwt.verify(raw, SECRET);
  } catch {
    return null;
  }
}

function clearSessionCookie(res) {
  res.clearCookie(COOKIE, {
    path: "/",
    domain: COOKIE_DOMAIN, // khớp domain khi set
  });
}

module.exports = { signSessionCookie, verifySessionCookie, clearSessionCookie };
