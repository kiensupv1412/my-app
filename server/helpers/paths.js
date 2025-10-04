// server/helpers/paths.js
const path = require("path");
const fs = require("fs");

const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
ensureDir(UPLOADS_DIR);

// ===================== UTILS (NHỎ GỌN) =====================
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

module.exports = {
  UPLOADS_DIR,
  PUBLIC_DIR,
  ensureDir,
};
