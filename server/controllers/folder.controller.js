/*
 * path: server/controllers/folder.controller.js
 */
const path = require('path');
const { mkdirSync, existsSync } = require('fs');
const { query } = require('../models/db');

// helpers
function slugify(s) {
    return String(s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || 'folder';
}

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');

function ensureDir(p) {
    if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

// GET /folders
async function list(req, res, next) {
    try {
        // nếu muốn lọc site: thêm WHERE site=?
        const rows = await query(
            `SELECT f.id, f.name, f.slug, f.site, f.created_at, f.updated_at,
              (SELECT COUNT(*) FROM media_storage m WHERE m.folder_id=f.id) AS total
       FROM media_folders f
       ORDER BY f.id DESC`
        );
        res.json(rows);
    } catch (e) { next(e); }
}

// POST /folders   body: { name, site }
async function create(req, res, next) {
    try {
        const name = String((req.body && req.body.name) || '').trim();
        const site = Number((req.body && req.body.site) || 0);
        if (!name) return res.status(400).json({ error: 'Name is required' });

        let slug = slugify(name);

        // tránh trùng slug
        const same = await query('SELECT id FROM media_folders WHERE slug=? LIMIT 1', [slug]);
        if (same.length) slug = `${slug}-${Date.now().toString(36).slice(4)}`;

        const now = new Date();
        const ins = await query(
            `INSERT INTO media_folders (name, slug, site, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`, [name, slug, site, now, now]
        );

        // tạo thư mục vật lý: /public/uploads/<slug>
        ensureDir(path.join(UPLOADS_DIR, slug));

        res.status(201).json({
            id: ins.insertId,
            name,
            slug,
            site,
            created_at: now,
            updated_at: now,
            total: 0,
        });
    } catch (e) { next(e); }
}

// DELETE /folders/:id
async function remove(req, res, next) {
    try {
        const id = Number(req.params.id);
        if (!Number.isFinite(id)) return res.status(400).json({ error: 'Bad id' });

        // không cho xoá nếu còn media
        const cnt = await query('SELECT COUNT(*) AS n FROM media_storage WHERE folder_id=?', [id]);
        if ((cnt[0] && cnt[0].n) > 0) {
            return res.status(400).json({ error: 'Folder is not empty' });
        }

        await query('DELETE FROM media_folders WHERE id=?', [id]);
        return res.json({ ok: true, id });
    } catch (e) { next(e); }
}

module.exports = { list, create, remove };