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
const { toNumber } = require("lodash");

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
    const file = req.file;

    if (!file) throw new BadRequestError({ message: "No file uploaded" });

    const folder_id = req.body.folder_id;
    const is_background = req.body.is_background;

    const rows = await saveMedia({
      file,
      folder_id,
      is_background,
    });

    const resp = {
      id: rows.id,
      folder_id: rows.folder_id,
      is_background: rows.is_background,
      file_url: rows.file_url,
      url: rows.file_url,
      appUrl: `${process.env.APP_URL || ""}/media/${rows.id}`,

      name: file.originalname,
      file_name: file.filename,
      file_size: file.size,
      mime: file.mimetype,
      type: file.mimetype,
      size: file.size,
    };

    res.status(201).json(resp);
  } catch (e) {
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });

    // Ki?m tra xem media có t?n t?i không
    const media = await Media.findByPk(id);
    if (!media) return res.status(404).json({ error: "Media not found" });

    // T?o object ch?a các tr??ng c?n c?p nh?t
    const updateData = {};

    // Ch? c?p nh?t các tr??ng ???c phép
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.alt) updateData.alt = req.body.alt;
    if (req.body.file_url) updateData.file_url = req.body.file_url;
    if (req.body.folder_id) updateData.folder_id = req.body.folder_id;
    if (typeof req.body.is_background !== "undefined")
      updateData.is_background = req.body.is_background;
    if (req.body.caption) updateData.caption = req.body.caption;

    // C?p nh?t media
    await media.update(updateData);

    // Tr? v? ph?n h?i thành công
    return res.json({
      ok: true,
      message: "Media updated successfully",
      media: {
        id: media.id,
        ...updateData,
      },
    });
  } catch (e) {
    console.error("[media.update][catch]", e);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { list, remove, uploads, update };
