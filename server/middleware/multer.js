const multer = require("multer");
const { UPLOADS_DIR, ensureDir } = require("../helpers/paths");
const { safeFileName, folderAbsPath } = require("../helpers/upload");

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

function fileFilter(_req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error("Unsupported file type"));
  }
  cb(null, true);
}

/** Lưu theo folder_slug (query/body hoặc req._folderSlug); fallback = uploads root */
function storageDynamic() {
  return multer.diskStorage({
    destination: (req, _file, cb) => {
      try {
        const slug =
          (req.query && req.query.folder_slug
            ? String(req.query.folder_slug)
            : null) ||
          (req.body && req.body.folder_slug
            ? String(req.body.folder_slug)
            : null) ||
          (req._folderSlug ? String(req._folderSlug) : null);
        const dest = slug ? folderAbsPath(slug) : UPLOADS_DIR;
        ensureDir(dest);
        cb(null, dest);
      } catch (err) {
        cb(err);
      }
    },
    filename: (_req, file, cb) => cb(null, safeFileName(file.originalname)),
  });
}

const uploadDynamic = multer({
  storage: storageDynamic(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter,
});

module.exports = {
  uploadDynamic,
};
