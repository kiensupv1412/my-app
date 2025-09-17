// server/middleware/resolve-folder.js
const Folder = require('../models/folder.model'); // Model Sequelize

async function resolveFolderById(req, _res, next) {
    try {
        // chấp nhận: ?folder_id=123 | 'null' | undefined
        const raw = req.query?.folder_id ?? req.body?.folder_id ?? undefined;

        if (raw === undefined || raw === null || String(raw).toLowerCase() === 'null' || String(raw).trim() === '') {
            // → root
            req._folderId = null;
            req._folderSlug = '';         // root = uploads/
            return next();
        }

        const fid = Number(raw);
        if (!Number.isFinite(fid) || fid <= 0) {
            req._folderId = null;
            req._folderSlug = '';
            return next();
        }

        const f = await Folder.findByPk(fid, { attributes: ['id', 'slug'] });
        if (!f) {
            // folder không tồn tại -> coi như root
            req._folderId = null;
            req._folderSlug = '';
            return next();
        }

        req._folderId = f.id;
        req._folderSlug = String(f.slug || '');
        next();
    } catch (e) { next(e); }
}
module.exports = { resolveFolderById };
