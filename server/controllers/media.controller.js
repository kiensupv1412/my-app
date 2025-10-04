/*
 * path: server/controllers/media.controller.js
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Media = require("../models/media.model");
const { parsePagination, buildMeta } = require("../utils/pagination");

let PUBLIC_DIR = null;

try {
  const up = require("../helpers/upload");
  if (up && typeof up.PUBLIC_DIR === "string" && up.PUBLIC_DIR.length) {
    PUBLIC_DIR = up.PUBLIC_DIR;
  }
} catch (e) {}
if (!PUBLIC_DIR) {
  PUBLIC_DIR = path.join(process.cwd(), "public");
}

function resolveSite(req) {
  let s;
  if (req.body && req.body.site !== undefined) s = Number(req.body.site);
  else if (req.query && req.query.site !== undefined)
    s = Number(req.query.site);
  else if (req.headers && req.headers["x-site"] !== undefined)
    s = Number(req.headers["x-site"]);
  else s = 1;
  return Number.isFinite(s) ? s : 1;
}

function resolveUserId(req) {
  let uid;
  if (req.user && req.user.id !== undefined) uid = Number(req.user.id);
  else if (req.body && req.body.user_id !== undefined)
    uid = Number(req.body.user_id);
  else if (req.query && req.query.user_id !== undefined)
    uid = Number(req.query.user_id);
  else uid = 0;
  return Number.isFinite(uid) ? uid : 0;
}

function publicUrlFromAbs(absPath) {
  const rel = path.relative(PUBLIC_DIR, absPath).split(path.sep).join("/");
  return "/" + rel.replace(/^\/+/, "");
}

function pickRelativeFromMedia(media) {
  if (media && media.file_url) return String(media.file_url);
  if (media && media.url) return String(media.url);
  if (media && media.stored_name)
    return "/uploads/" + String(media.stored_name);
  return "";
}

function normalizePublicRelative(rel) {
  let s = String(rel || "");
  s = s.replace(/\\/g, "/");
  if (s.length && s.charAt(0) !== "/") s = "/" + s;
  return s;
}

async function uploadOne(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const f = req.file;
    let { folder_id } = req.body;
    if (typeof folder_id === "string") {
      const raw = folder_id.trim().toLowerCase();
      if (raw === "" || raw === "null") folder_id = null;
      else {
        const n = Number(raw);
        if (Number.isFinite(n)) folder_id = n;
        else folder_id = null; // fallback
      }
    }

    const url = publicUrlFromAbs(f.path);

    const row = await Media.create({
      site: resolveSite(req),
      is_background: req.body.is_background,
      user_id: resolveUserId(req),
      folder_id,
      media_type: f.mimetype.startsWith("video/") ? "video" : "image",
      uuid: crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + Math.random().toString(36).slice(2, 8),
      name: f.originalname,
      file_name: f.filename,
      file_url: url,
      file_size: f.size,
      extension: path.extname(f.originalname).replace(".", ""),
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
  } catch (e) {
    next(e);
  }
}

async function uploadMany(req, res, next) {
  try {
    const files = req.files || [];
    if (!files.length)
      return res.status(400).json({ error: "No files uploaded" });

    const folder_id =
      Number(
        (req.query && req.query.folder_id) ??
          (req.body && req.body.folder_id) ??
          0
      ) || null;

    const site = resolveSite(req);
    const user_id = resolveUserId(req);

    const payloads = files.map((f) => ({
      site,
      is_background: req.body.is_background,
      user_id,
      folder_id,
      media_type: f.mimetype.startsWith("video/") ? "video" : "image",
      uuid: crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() + Math.random().toString(36).slice(2, 8),
      name: f.originalname,
      file_name: f.filename,
      file_url: publicUrlFromAbs(f.path),
      file_size: f.size,
      extension: path.extname(f.originalname).replace(".", ""),
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
  } catch (e) {
    next(e);
  }
}

async function list(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query, 48);

    // ?u tiên middleware resolve-folder ??t s?n req._folderId = null | number | undefined
    let folder_id = Object.prototype.hasOwnProperty.call(req, "_folderId")
      ? req._folderId
      : undefined;

    // N?u không có middleware, cho phép ?folder_id='null' ?? l?c ROOT
    if (folder_id === undefined && typeof req.query.folder_id !== "undefined") {
      const raw = String(req.query.folder_id).trim().toLowerCase();
      if (raw === "null") folder_id = null;
      else if (raw !== "") {
        const n = Number(raw);
        if (Number.isFinite(n)) folder_id = n;
      }
    }

    const where = {};
    if (folder_id === null)
      where.folder_id = null; // ROOT
    else if (Number.isFinite(folder_id)) where.folder_id = folder_id; // Folder c? th?
    // (undefined => không filter folder)

    const total = await Media.count({ where });
    const rows = await Media.findAll({
      where,
      offset,
      limit,
      order: [
        ["is_background", "DESC"],
        ["id", "DESC"],
      ],
    });

    return res.json({
      data: rows,
      meta: buildMeta({ page, limit, total }),
    });
  } catch (e) {
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });

    const media = await Media.findByPk(id);
    if (!media) return res.status(404).json({ error: "Not found" });

    const rawRel = pickRelativeFromMedia(media);
    const publicRel = normalizePublicRelative(rawRel);

    if (
      !publicRel ||
      publicRel === "/" ||
      publicRel === "/uploads" ||
      publicRel === "/uploads/"
    ) {
      try {
        await Media.destroy({ where: { id } });
        return res.json({ ok: true, id, warn: "no file path" });
      } catch (dbErr) {
        console.error("[media.remove][db] delete failed", dbErr);
        return res.status(500).json({ error: "DB delete failed" });
      }
    }

    const relNoLead = publicRel.replace(/^\//, "");
    const absPath = path.join(PUBLIC_DIR, relNoLead);

    const resolved = path.resolve(absPath);
    const root = path.resolve(PUBLIC_DIR);
    if (!resolved.startsWith(root)) {
      console.error("[media.remove] path escape detected", {
        resolved,
        root,
        id,
      });
      return res.status(400).json({ error: "Invalid file path" });
    }

    fs.unlink(resolved, async (unlinkErr) => {
      if (unlinkErr && unlinkErr.code !== "ENOENT") {
        console.error("[media.remove][unlink]", unlinkErr, {
          absPath: resolved,
        });
      }
      try {
        await Media.destroy({ where: { id } });
        return res.json({ ok: true, id });
      } catch (dbErr) {
        console.error("[media.remove][db] delete failed", dbErr);
        return res.status(500).json({ error: "DB delete failed" });
      }
    });
  } catch (e) {
    console.error("[media.remove][catch]", e);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { uploadOne, uploadMany, list, remove };
