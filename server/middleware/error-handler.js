/*
 * path: server/middlewares/error-handler.js
 */
const { AppError, InternalServerError } = require("../error");

module.exports = function errorHandler(err, req, res, next) {
  // Chuẩn hoá về AppError
  let e =
    err instanceof AppError
      ? err
      : new InternalServerError({ message: err?.message || undefined });

  // Quy tắc log:
  // - Không log stack cho lỗi bình thường (400/401/403/404/409/422…)
  // - Chỉ log khi critical hoặc 5xx
  const shouldLog =
    e.level === "critical" || (e.statusCode >= 500 && e.hideStack !== true);

  if (shouldLog) {
    // log gọn: type + message + id để trace, KHÔNG in stack nếu hideStack = true
    const summary = `[${e.statusCode}] ${e.errorType} (${e.id}): ${e.message}`;
    if (e.hideStack) {
      console.error(summary);
    } else {
      console.error(summary, e.stack);
    }
  }

  // Payload trả về client — gọn, không lộ stack
  return res.status(e.statusCode).json({
    success: false,
    error: {
      type: e.errorType,
      message: e.message,
      code: e.code,
      context: e.context,
      id: e.id,
    },
  });
};
