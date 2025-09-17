/*
 * path: server/controllers/media.controller.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { filePublicUrl } = require('../helpers/file');
const Media = require('../models/media.model');
let PUBLIC_DIR = null;

try {
  const up = require('../helpers/upload');
  if (up && typeof up.PUBLIC_DIR === 'string' && up.PUBLIC_DIR.length) {
    PUBLIC_DIR = up.PUBLIC_DIR;
  }
} catch (e) { }
if (!PUBLIC_DIR) {
  PUBLIC_DIR = path.join(process.cwd(), 'public');
}

/* --------------------------- Helpers --------------------------- */
function resolveSite(req) {
  let s;
  if (req.body && req.body.site !== undefined) s = Number(req.body.site);
  else if (req.query && req.query.site !== undefined) s = Number(req.query.site);
  else if (req.headers && req.headers['x-site'] !== undefined) s = Number(req.headers['x-site']);
  else s = 1;
  return Number.isFinite(s) ? s : 1;
}

function resolveUserId(req) {
  let uid;
  if (req.user && req.user.id !== undefined) uid = Number(req.user.id);
  else if (req.body && req.body.user_id !== undefined) uid = Number(req.body.user_id);
  else if (req.query && req.query.user_id !== undefined) uid = Number(req.query.user_id);
  else uid = 0;
  return Number.isFinite(uid) ? uid : 0;
}

function publicUrlFromAbs(absPath) {
  const rel = path.relative(PUBLIC_DIR, absPath).split(path.sep).join('/');
  return '/' + rel.replace(/^\/+/, '');
}

function pickRelativeFromMedia(media) {
  if (media && media.file_url) return String(media.file_url);
  if (media && media.url) return String(media.url);
  if (media && media.stored_name) return '/uploads/' + String(media.stored_name);
  return '';
}

function normalizePublicRelative(rel) {
  let s = String(rel || '');
  s = s.replace(/\\/g, '/');
  if (s.length && s.charAt(0) !== '/') s = '/' + s;
  return s;
}

/* -------------------------- Controllers ------------------------ */
async function uploadOne(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const f = req.file;
    const folder_id = Number(
      (req.query && req.query.folder_id) ??
      (req.body && req.body.folder_id) ?? 0
    ) || null;

    const url = publicUrlFromAbs(f.path);

    const row = await Media.create({
      site: resolveSite(req),
      user_id: resolveUserId(req),
      folder_id,
      media_type: f.mimetype.startsWith('video/') ? 'video' : 'image',
      uuid: crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random().toString(36).slice(2, 8),
      name: f.originalname,
      file_name: f.filename,
      file_url: url,
      file_size: f.size,
      extension: path.extname(f.originalname).replace('.', ''),
      mime: f.mimetype,
      height: null,
      width: null,
    });

    res.status(201).json({
      id: row.id,
      name: f.originalname,
      file_name: f.filename,
      file_url: url,
      file_size: f.size,
      mime: f.mimetype,
      folder_id,
    });
  } catch (e) { next(e); }
}

async function uploadMany(req, res, next) {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'No files uploaded' });

    const folder_id = Number(
      (req.query && req.query.folder_id) ??
      (req.body && req.body.folder_id) ?? 0
    ) || null;

    const site = resolveSite(req);
    const user_id = resolveUserId(req);

    const payloads = files.map((f) => ({
      site,
      user_id,
      folder_id,
      media_type: f.mimetype.startsWith('video/') ? 'video' : 'image',
      uuid: crypto.randomUUID ? crypto.randomUUID() : Date.now() + Math.random().toString(36).slice(2, 8),
      name: f.originalname,
      file_name: f.filename,
      file_url: publicUrlFromAbs(f.path),
      file_size: f.size,
      extension: path.extname(f.originalname).replace('.', ''),
      mime: f.mimetype,
    }));

    const rows = await Media.bulkCreate(payloads);

    const results = rows.map((r, i) => ({
      id: r.id,
      name: files[i].originalname,
      file_name: files[i].filename,
      file_url: r.file_url,
      file_size: files[i].size,
      mime: files[i].mimetype,
      folder_id,
    }));

    res.status(201).json(results);
  } catch (e) { next(e); }
}

async function list(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 20, 1), 100);
    const q = (req.query.q || '').trim();
    const media_type = req.query.media_type || undefined;
    const site = req.query.site ? Number(req.query.site) : undefined;
    const user_id = req.query.user_id ? Number(req.query.user_id) : undefined;

    // ✅ ƯU TIÊN middleware resolve-folder nếu có
    let folder_id = (Object.prototype.hasOwnProperty.call(req, '_folderId'))
      ? req._folderId  // có thể là null hoặc number
      : undefined;

    // ✅ Nếu chưa có từ middleware, set mặc định = ROOT (null)
    if (folder_id === undefined) {
      folder_id = null; // mặc định khi /media không chỉ định -> chỉ lấy ở uploads/
      if (req.query.folder_id !== undefined) {
        const raw = String(req.query.folder_id).trim().toLowerCase();
        if (raw !== '' && raw !== 'null') {
          const n = Number(raw);
          if (Number.isFinite(n)) folder_id = n; // user cố tình chỉ định 1 folder cụ thể
        }
      }
    }

    const where = {};
    if (q) where.name = { [Op.like]: `%${q}%` };
    if (media_type) where.media_type = media_type;
    if (Number.isFinite(site)) where.site = site;
    if (Number.isFinite(user_id)) where.user_id = user_id;

    // ✅ lọc theo folder: null = ROOT
    if (folder_id === null) where.folder_id = null;        // Sequelize sẽ sinh IS NULL
    else if (Number.isFinite(folder_id)) where.folder_id = folder_id;

    const { rows, count: total } = await Media.findAndCountAll({
      where,
      offset: (page - 1) * pageSize,
      limit: pageSize,
      order: [['id', 'DESC']],
    });

    res.json({ page, pageSize, total, rows });
  } catch (e) { next(e); }
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Bad id' });

    const media = await Media.findByPk(id);
    if (!media) return res.status(404).json({ error: 'Not found' });

    const rawRel = pickRelativeFromMedia(media);
    const publicRel = normalizePublicRelative(rawRel);

    if (!publicRel || publicRel === '/' || publicRel === '/uploads' || publicRel === '/uploads/') {
      try {
        await Media.destroy({ where: { id } });
        return res.json({ ok: true, id, warn: 'no file path' });
      } catch (dbErr) {
        console.error('[media.remove][db] delete failed', dbErr);
        return res.status(500).json({ error: 'DB delete failed' });
      }
    }

    const relNoLead = publicRel.replace(/^\//, '');
    const absPath = path.join(PUBLIC_DIR, relNoLead);

    const resolved = path.resolve(absPath);
    const root = path.resolve(PUBLIC_DIR);
    if (!resolved.startsWith(root)) {
      console.error('[media.remove] path escape detected', { resolved, root, id });
      return res.status(400).json({ error: 'Invalid file path' });
    }

    fs.unlink(resolved, async (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== 'ENOENT') {
        console.error('[media.remove][unlink]', unlinkErr, { absPath: resolved });
      }
      try {
        await Media.destroy({ where: { id } });
        return res.json({ ok: true, id });
      } catch (dbErr) {
        console.error('[media.remove][db] delete failed', dbErr);
        return res.status(500).json({ error: 'DB delete failed' });
      }
    });
  } catch (e) {
    console.error('[media.remove][catch]', e);
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { uploadOne, uploadMany, list, remove };