// server/middleware/resolve-folder.js
const { getFolderById } = require('../models/folder.model');

async function resolveFolderById(req, _res, next) {
    try {
        const fid = Number(req.query && req.query.folder_id ? req.query.folder_id :
            req.body && req.body.folder_id ? req.body.folder_id : 0);
        if (fid) {
            const f = await getFolderById(fid);
            if (f && f.slug) req._folderSlug = String(f.slug);
        }
        next();
    } catch (e) { next(e); }
}
module.exports = { resolveFolderById };