/*
 * server/helpers/upload.js
 * One-file helper cho upload/media (CommonJS)
 */
const path = require("path");
const sanitize = require("sanitize-filename");
const { PUBLIC_DIR, UPLOADS_DIR } = require("./paths");

/** Chuẩn hoá slug thư mục, ngăn path traversal */
function sanitizeSlug(input) {
  const s = String(input || "")
    .trim()
    .toLowerCase();
  return s
    .replace(/[/\\]+/g, "-") // chặn slash
    .replace(/\.\.+/g, "-") // chặn ..
    .replace(/\s+/g, "-") // space -> -
    .replace(/[^a-z0-9-_]+/g, "-") // ký tự lạ -> -
    .replace(/-+/g, "-") // gộp ---- -> -
    .replace(/^[-]+|[-]+$/g, ""); // trim -
}

/** Absolute path tới thư mục con trong uploads theo slug an toàn */
function folderAbsPath(slug) {
  const safe = sanitizeSlug(slug);
  const abs = path.join(UPLOADS_DIR, safe || "");
  const norm = path.normalize(abs);
  const uploadsNorm = path.normalize(UPLOADS_DIR + path.sep);
  if (!(norm + path.sep).startsWith(uploadsNorm)) {
    throw new Error("Invalid folder path");
  }
  return norm;
}

/** Tên file an toàn + unique */
function safeFileName(originalName) {
  const parsed = path.parse(String(originalName || "file"));
  const base =
    sanitize(parsed.name)
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase() || "file";
  const ext = (parsed.ext || "").toLowerCase();
  const ts = Date.now();
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${base}-${ts}-${rnd}${ext}`;
}

/** Convert absolute fs path -> URL public tương đối (bắt đầu bằng /) */
function publicUrlFromAbs(absPath) {
  const rel = path.relative(PUBLIC_DIR, absPath).split(path.sep).join("/");
  return "/" + rel.replace(/^\/+/, ""); // Đảm bảo URL bắt đầu bằng "/"
}

/** Chuẩn hoá đường dẫn public tương đối */
function normalizePublicRelative(rel) {
  let s = String(rel || "").replace(/\\/g, "/");
  if (s && s.charAt(0) !== "/") s = "/" + s;
  return s;
}

/** Lấy URL public từ object media (ưu tiên file_url) */
function pickRelativeFromMedia(media) {
  if (media?.file_url) return String(media.file_url);
  if (media?.url) return String(media.url);
  if (media?.stored_name)
    return normalizePublicRelative(`/uploads/${String(media.stored_name)}`);
  return "";
}

module.exports = {
  sanitizeSlug,
  safeFileName,
  folderAbsPath,
  publicUrlFromAbs,
  normalizePublicRelative,
  pickRelativeFromMedia,
};
