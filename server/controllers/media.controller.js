/*
 * path: server/controllers/media.controller.js
 */
const fs = require("fs");
const path = require("path");
const Media = require("../models/media.model");
const { parsePagination, buildMeta } = require("../utils/pagination");
const { BadRequestError } = require("../error");
const { saveMedia } = require("../services/media.service");
const {
  pickRelativeFromMedia,
  normalizePublicRelative,
} = require("../helpers/upload");
const { PUBLIC_DIR } = require("../helpers/paths");

async function list(req, res, next) {
  try {
    const { page, limit, offset } = parsePagination(req.query, 48);

    const where = {};
    if (typeof req.folder_id === "number") {
      where.folder_id = req.folder_id; // filter theo 1 folder
    } // null => không set where.folder_id => l?y t?t c? ?nh

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

async function uploads(req, res, next) {
  try {
    const files = Array.isArray(req.files)
      ? req.files
      : req.file
        ? [req.file]
        : [];
    if (!files.length)
      throw new BadRequestError({ message: "No file(s) uploaded" });

    const folder_id = req.folder_id;
    const is_background = req.body.is_background;

    const rows = await saveMedia({
      files,
      folder_id,
      is_background,
    });

    const resp = rows.map((r, i) => ({
      id: r.id,
      name: files[i].originalname,
      file_name: files[i].filename,
      file_url: r.file_url,
      file_size: files[i].size,
      mime: files[i].mimetype,
      folder_id,
    }));

    res.status(201).json(resp.length === 1 ? resp[0] : resp);
  } catch (e) {
    next(e);
  }
}

module.exports = { list, remove, uploads };
