// express/services/auth.js
// Chịu trách nhiệm: đọc session/token từ req và trả về authenticatedData
// Output chuẩn: { user, session, sub, tokens } hoặc { statusCode, message } khi lỗi

// Ví dụ bạn lưu session trong cookie 'session' hoặc Bearer token
// và có storage để lấy token Google Indexing (giống getUserToken của Nitro)

async function getAuthenticatedData(req) {
  // TODO: Lấy session user từ nơi bạn đã "làm xong phần login"
  // Ví dụ:
  // const session = req.session?.userSession  // nếu dùng express-session
  //          hoặc decode JWT từ cookie/header để ra { user, ... }
  const session = req.session?.userSession || null;

  if (!session?.user) {
    return {
      statusCode: 401,
      message: "Unauthorized",
    };
  }

  // TODO: Lấy token ứng với user (giống getUserToken trong Nitro)
  // Ví dụ đọc từ DB/kv-store dựa trên userId:
  // const token = await tokenStore.get(session.user.userId, 'indexing')
  const token = await fakeGetUserToken(session.user.userId, "indexing"); // thay bằng store thực

  if (!token) {
    return {
      statusCode: 401,
      message: "Unauthorized",
    };
  }

  // Chuẩn hóa cấu trúc giống Nitro
  return {
    sub: token.sub, // id tài khoản google đã liên kết
    tokens: token.tokens, // access_token/refresh_token/... để gọi Google APIs
    user: session.user, // thông tin user đã login
    session, // full session nếu cần
  };
}

// Helper để nhận diện lỗi từ getAuthenticatedData
function isErrorResult(val) {
  return (
    !!val && typeof val === "object" && "statusCode" in val && "message" in val
  );
}

/** ==========================
 *  Dummy store (thay bằng thật)
 *  ========================== */
async function fakeGetUserToken(userId, key /* 'indexing' | 'login' */) {
  // Trả về null nếu chưa liên kết
  // Trả về { sub, tokens: { access_token, refresh_token, expiry_date, ... } } nếu có
  // Ở đây minh họa trả về token giả khi userId tồn tại
  if (!userId) return null;
  return {
    sub: `google-oauth-${userId}`,
    tokens: {
      access_token: "ACCESS_TOKEN_PLACEHOLDER",
      refresh_token: "REFRESH_TOKEN_PLACEHOLDER",
      expiry_date: Date.now() + 50 * 60 * 1000,
      token_type: "Bearer",
    },
  };
}

module.exports = { getAuthenticatedData, isErrorResult };
