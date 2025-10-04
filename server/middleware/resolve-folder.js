// server/middleware/resolve-folder.js
const { Folder } = require("../models/folder.model"); // Model Sequelize

async function resolveFolderById(req, _res, next) {
  try {
    const raw = req.query?.folder_id ?? req.body?.folder_id;
    if (raw === undefined) {
      return next();
    }

    const v = String(raw).trim().toLowerCase();
    if (v === "" || v === "null") {
      req._folderId = null;
      return next();
    }

    const id = Number(v);
    if (Number.isFinite(id) && id > 0) {
      req._folderId = id;
    }
    next();
  } catch (e) {
    next(e);
  }
}
module.exports = { resolveFolderById };
