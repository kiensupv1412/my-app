// server/middleware/resolve-folder.js
/**
 * Chuẩn hoá folder_id về chỉ 2 giá trị:
 * - null   => lấy tất cả ảnh (không filter)
 * - number => filter theo folder_id (số nguyên dương)
 */
function resolveFolderById(req, _res, next) {
  try {
    const raw =
      (req.query && req.query.folder_id) ?? (req.body && req.body.folder_id);

    // Không truyền / rỗng / "null" => null
    if (raw === undefined || raw === null) {
      req.folder_id = null;
      return next();
    }
    const s = String(raw).trim().toLowerCase();
    if (s === "" || s === "null") {
      req.folder_id = null;
      return next();
    }

    // Số hợp lệ > 0 => number, còn lại => null
    const n = Number(s);
    req.folder_id = Number.isSafeInteger(n) && n > 0 ? n : null;

    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { resolveFolderById };
