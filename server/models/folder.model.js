// server/models/folder.model.js
const { query } = require('./db');
const { safeSlug } = require('../helpers/paths');

async function createFolder({ name, site = 0 }) {
    const slug = safeSlug(name);
    const now = new Date();
    const sql = 'INSERT INTO media_folders (name, slug, site, created_at, updated_at) VALUES (?,?,?,?,?)';
    const res = await query(sql, [name, slug, site, now, now]);
    return { id: res.insertId, name, slug, site };
}

async function listFolders({ site = 0 }) {
    return query('SELECT * FROM media_folders WHERE site=? ORDER BY name ASC', [site]);
}

async function getFolderById(id) {
    const rows = await query('SELECT * FROM media_folders WHERE id=?', [id]);
    return rows[0] || null;
}

async function removeFolder(id) {
    // tuỳ bạn: chặn xoá nếu còn media
    return query('DELETE FROM media_folders WHERE id=?', [id]);
}

module.exports = { createFolder, listFolders, getFolderById, removeFolder };