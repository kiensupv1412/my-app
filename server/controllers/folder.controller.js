/*
 * path: server/controllers/folder.controller.js
 */
const path = require('path');
const { mkdirSync, existsSync } = require('fs');
const { Folder } = require('../models/folder.model');
const Sequelize = require('../models/db');

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
    const rows = await Folder.findAll({
      attributes: [
        'id', 'name', 'slug', 'site', 'created_at', 'updated_at',
        [
          // đếm số media thuộc folder này
          Sequelize.literal(`(
            SELECT COUNT(*) 
            FROM media_storage AS m 
            WHERE m.folder_id = media_folders.id
          )`),
          'total'
        ],
      ],
      order: [['id', 'DESC']],
      raw: true,
    });

    res.json(rows);
  } catch (e) {
    next(e);
  }
}

// POST /folders
async function create(req, res, next) {
  try {
    const name = String((req.body?.name || '')).trim();
    const site = Number(req.body?.site || 0);
    if (!name) return res.status(400).json({ error: 'Name is required' });

    let slug = slugify(name);

    // tránh trùng slug
    const same = await Folder.findOne({ where: { slug } });
    if (same) {
      slug = `${slug}-${Date.now().toString(36).slice(4)}`;
    }

    const folder = await Folder.create({ name, slug, site });

    // tạo thư mục vật lý
    ensureDir(path.join(UPLOADS_DIR, slug));

    res.status(201).json(folder);
  } catch (e) {
    next(e);
  }
}

// DELETE /folders/:id
async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Bad id' });

    const folder = await Folder.findByPk(id);
    if (!folder) return res.status(404).json({ error: 'Not found' });

    // TODO: kiểm tra bảng media_storage nếu còn file thì chặn
    await folder.destroy();
    res.json({ ok: true, id });
  } catch (e) {
    next(e);
  }
}

module.exports = { list, create, remove };