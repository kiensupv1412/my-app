// server/controllers/media.list.controller.js
const { listMediaByFolder, countMediaByFolder } = require('../models/media.model');

async function list(req, res, next) {
    try {
        const page = Math.max(parseInt(req.query && req.query.page ? req.query.page : 1), 1);
        const pageSize = Math.min(Math.max(parseInt(req.query && req.query.pageSize ? req.query.pageSize : 20), 1), 100);
        const folder_id = req.query && req.query.folder_id ? Number(req.query.folder_id) : null;
        const q = String(req.query && req.query.q ? req.query.q : '').trim();

        const total = await countMediaByFolder(folder_id, q);
        const rows = await listMediaByFolder({ page, pageSize, folder_id, q });
        res.json({ page, pageSize, total, rows });
    } catch (e) { next(e); }
};

module.exports = { list };