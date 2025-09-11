/*
 * path: server/helpers/upload.js
 */
const path = require('path');
const multer = require('multer');
const sanitize = require('sanitize-filename');
const fs = require('fs');
const { folderAbsPath, ensureDir } = require('./paths');

// ====== constants ======
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
    'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm'
]);

// ====== helpers ======
function safeFileName(originalName) {
    const parsed = path.parse(String(originalName || 'file'));
    const base = sanitize(parsed.name).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').toLowerCase() || 'file';
    const ext = (parsed.ext || '').toLowerCase();
    const ts = Date.now();
    const rnd = Math.random().toString(36).slice(2, 8);
    return `${base}-${ts}-${rnd}${ext}`;
}

function fileFilter(_req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(new Error('Unsupported file type'));
    }
    cb(null, true);
}

// ====== static storage (không theo folder) – optional ======
const storage = multer.diskStorage({
    destination: function(_req, _file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function(_req, file, cb) {
        cb(null, safeFileName(file.originalname));
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter,
});

// ====== dynamic storage theo folder_slug ======
// NOTE: Để đồng bộ & an toàn, phía client nên gửi `?folder_slug=ten-thu-muc`.
// Nếu bạn chỉ có `folder_id`, hãy viết middleware trước multer để tra DB và gán `req._folderSlug = '...'`.
function storageDynamic() {
    return multer.diskStorage({
        destination: function(req, _file, cb) {
            // ưu tiên slug từ query hoặc body
            const slug =
                (req.query && req.query.folder_slug ? String(req.query.folder_slug) : null) ||
                (req.body && req.body.folder_slug ? String(req.body.folder_slug) : null) ||
                (req._folderSlug ? String(req._folderSlug) : null);

            let dest;
            try {
                if (slug) {
                    dest = folderAbsPath(slug); // đã chống path traversal trong helpers/paths
                } else {
                    // fallback: uploads root
                    dest = UPLOADS_DIR;
                }
                ensureDir(dest);
                cb(null, dest);
            } catch (err) {
                cb(err);
            }
        },
        filename: function(_req, file, cb) {
            cb(null, safeFileName(file.originalname));
        },
    });
}

const uploadDynamic = multer({
    storage: storageDynamic(),
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter,
});

// ====== exports ======
module.exports = {
    upload, // dùng cho /media/upload(s) nếu không cần folder
    uploadDynamic, // dùng cho /media/upload(s)?folder_slug=...
    UPLOADS_DIR,
    PUBLIC_DIR,
};